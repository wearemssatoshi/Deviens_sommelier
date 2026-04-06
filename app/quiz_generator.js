/**
 * SOMMELIER PRO — Quiz Generator v2.0
 * 毎日30問スキマ時間テスト（朝10問 + 休憩10問 + 帰り道10問）
 * Gemini 3.1 Pro Preview で問題生成、GASバックエンドで成績永続化
 */

(function() {
    // ========== CONFIG ==========
    const QUIZ_COUNT = 10;
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent";
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";

    const SESSIONS = [
        { id: 'morning', label: '朝テスト',   icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>', desc: '出勤前・午前中のスキマ時間に' },
        { id: 'break',   label: '休憩テスト', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>', desc: '昼休み・休憩時間のリフレッシュに' },
        { id: 'evening', label: '帰り道テスト', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>', desc: '帰宅途中・夜のまとめに' },
        { id: 'extra',   label: '補習（無制限）', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>', desc: '1日に何度でも反復練習' },
        { id: 'pair',    label: 'ペアモード 🤝', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', desc: '仲間と一緒に学んでボーナスTOKEN獲得！' }
    ];

    // ========== DOM ELEMENTS ==========
    const elements = {
        overlay: document.getElementById('quizOverlay'),
        closeBtn: document.getElementById('quizClose'),
        stateLoading: document.getElementById('quizStateLoading'),
        stateQuestion: document.getElementById('quizStateQuestion'),
        stateResults: document.getElementById('quizStateResults'),
        container: document.querySelector('.quiz-container'),
        progress: document.getElementById('quizProgress'),
        questionText: document.getElementById('quizQuestionText'),
        choicesBox: document.getElementById('quizChoices'),
        scoreNumber: document.getElementById('quizScoreNumber'),
        resultsList: document.getElementById('quizResultsList'),
        retryBtn: document.getElementById('quizRetryBtn'),
        hallucinationBtn: document.getElementById('quizHallucinationBtn')
    };

    // ========== TOKEN CONFIG ==========
    const TOKEN_CORRECT = 3;
    const TOKEN_WRONG = 1;
    const TOKEN_PAIR_BONUS = 20;

    // ========== STATE ==========
    let quizState = {
        currentUser: null, // { user_id, name }
        chapters: [],
        selectedChapter: null,
        selectedSession: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        todayProgress: {},
        pairPartner: null  // name of the person quizzing you (pair mode only)
    };

    // ========== TOKEN CALCULATOR ==========
    function calculateTokens(correctCount, totalCount, isPairMode) {
        const correctTokens = correctCount * TOKEN_CORRECT;
        const wrongTokens = (totalCount - correctCount) * TOKEN_WRONG;
        const pairBonus = isPairMode ? TOKEN_PAIR_BONUS : 0;
        return { correctTokens, wrongTokens, pairBonus, total: correctTokens + wrongTokens + pairBonus };
    }

    function getApiKey() {
        return DSMAuth.getApiKey();
    }

    // ========== JST DATE ==========
    function getJSTDateString() {
        const now = new Date();
        const jstOffset = 9 * 60;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const jstDate = new Date(utc + (jstOffset * 60000));
        return `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`;
    }

    // ========== INIT ==========
    async function init() {
        // Listen for bottom-nav trigger (custom event from app.js)
        document.addEventListener('quiz:open', openQuiz);
        elements.closeBtn.addEventListener('click', closeQuiz);
        elements.retryBtn.addEventListener('click', resetAndRestart);
        if (elements.hallucinationBtn) {
            elements.hallucinationBtn.addEventListener('click', handleHallucinationCheck);
        }

        // Restore user from DSMAuth
        quizState.currentUser = DSMAuth.getUser();

        try {
            const res = await fetch('../data/summaries/summary_index.json');
            const data = await res.json();
            quizState.chapters = data.chapters || [];
        } catch (e) {
            console.error("Failed to load chapters for quiz", e);
        }
    }

    // ========== HALLUCINATION CHECK ==========
    function handleHallucinationCheck() {
        const qText = quizState.questions.map((q, i) => `【第${i+1}問】\n問題: ${q.question}\n正解: ${q.choices[q.correct_index]}\n解説: ${q.explanation}`).join('\n\n');
        const payload = `先ほど解いたクイズ（${quizState.selectedChapter?.title}）について、問題内容や解説に「事実の捏造（ハルシネーション）」や不適切な表現がないか精度検証をお願いします。\n\n${qText}`;
        
        closeQuiz();
        document.dispatchEvent(new CustomEvent('open-ai-concierge', { detail: { initialPrompt: payload } }));
    }

    // ========== SETUP SCREEN ==========
    function createSetupScreen() {
        const setupDiv = document.createElement('div');
        setupDiv.className = 'quiz-state';
        setupDiv.id = 'quizStateSetup';

        let chapterOptionsHtml = '<option value="random">全範囲からランダム</option>';
        quizState.chapters.forEach(ch => {
            chapterOptionsHtml += `<option value="${ch.id}">${ch.title}</option>`;
        });

        setupDiv.innerHTML = `
            <div class="quiz-setup-inner">
                <div class="quiz-user-bar">
                    <span class="quiz-user-greeting">
                        ${typeof SOMMELIER_USERS !== 'undefined' && SOMMELIER_USERS[quizState.currentUser?.name]?.photo 
                            ? `<img src="${SOMMELIER_USERS[quizState.currentUser?.name].photo}" alt="${quizState.currentUser?.name}" class="user-avatar-img">`
                            : `<span class="user-avatar-sm">${(quizState.currentUser?.name || '?').charAt(0)}</span>`
                        }
                        <div class="user-card-info" style="gap:1px; line-height: 1.1;">
                            <span style="font-weight:600; font-size:14px;">${quizState.currentUser?.name || 'ゲスト'}</span>
                            ${typeof SOMMELIER_USERS !== 'undefined' && SOMMELIER_USERS[quizState.currentUser?.name]?.status 
                                ? `<span class="user-status-badge" style="font-size:9px; padding: 1px 4px;">${SOMMELIER_USERS[quizState.currentUser?.name].status}</span>`
                                : ''}
                        </div>
                    </span>
                    <button class="quiz-switch-user" id="quizSwitchUser">変更</button>
                </div>

                <h2 class="quiz-setup-title">Deviens sommelier</h2>
                <p class="quiz-setup-subtitle">4ヶ月でソムリエ試験突破！毎日30問のスキマ時間テスト</p>

                <div class="quiz-today-progress" id="quizTodayProgress">
                    <!-- Filled by renderTodayProgress() -->
                </div>

                <div class="quiz-session-cards" id="quizSessionCards">
                    ${SESSIONS.map(s => `
                        <button class="quiz-session-card" data-session="${s.id}" id="sessionCard_${s.id}">
                            <span class="session-icon">${s.icon}</span>
                            <span class="session-label">${s.label}</span>
                            <span class="session-desc">${s.desc}</span>
                            <span class="session-status" id="sessionStatus_${s.id}"></span>
                        </button>
                    `).join('')}
                </div>

                <div class="quiz-chapter-select-row">
                    <label for="quizChapterSelect">出題範囲:</label>
                    <select id="quizChapterSelect">
                        ${chapterOptionsHtml}
                    </select>
                </div>

                <button id="quizStartBtn" class="quiz-btn-primary" disabled>セッションを選んでください</button>
            </div>
        `;

        elements.closeBtn.insertAdjacentElement('afterend', setupDiv);
        elements.stateSetup = setupDiv;

        // Session card click handlers
        setupDiv.querySelectorAll('.quiz-session-card').forEach(card => {
            card.addEventListener('click', () => {
                setupDiv.querySelectorAll('.quiz-session-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                quizState.selectedSession = card.dataset.session;
                quizState.pairPartner = null; // reset
                const btn = document.getElementById('quizStartBtn');
                const session = SESSIONS.find(s => s.id === card.dataset.session);

                if (card.dataset.session === 'pair') {
                    // Show pair setup inline
                    showPairSetup(btn);
                } else {
                    // Remove pair setup if exists
                    const pairSetup = document.getElementById('pairSetupRow');
                    if (pairSetup) pairSetup.remove();
                    btn.disabled = false;
                    btn.textContent = `${session.label}を開始（${QUIZ_COUNT}問）`;
                }
            });
        });

        document.getElementById('quizStartBtn').addEventListener('click', () => {
            if (!quizState.selectedSession) return;
            const chapterId = document.getElementById('quizChapterSelect').value;
            startQuizGeneration(chapterId);
        });

        // Switch user
        document.getElementById('quizSwitchUser').addEventListener('click', () => {
            quizState.currentUser = null;
            localStorage.removeItem('sommelier_quiz_user');
            showLoginScreen();
        });

        renderTodayProgress();
    }

    // ========== TODAY'S PROGRESS ==========
    async function loadTodayProgress() {
        if (!GAS_URL) {
            // No backend yet — load from localStorage fallback
            const stored = localStorage.getItem('quiz_today_' + getJSTDateString());
            if (stored) {
                quizState.todayProgress = JSON.parse(stored);
            }
            return;
        }
        try {
            const uname = quizState.currentUser?.name || '';
            const res = await fetch(`${GAS_URL}?action=getToday&user_name=${encodeURIComponent(uname)}`);
            const data = await res.json();
            if (data.status === 'success') {
                quizState.todayProgress = data.data.sessions || {};
            }
        } catch (e) {
            console.warn("Could not load today's progress from GAS", e);
        }
    }

    function renderTodayProgress() {
        const container = document.getElementById('quizTodayProgress');
        if (!container) return;

        const today = getJSTDateString();
        let completedCount = 0;
        let totalScore = 0;
        let totalQuestions = 0;

        let html = `<div class="today-header">${today}</div><div class="today-sessions">`;
        SESSIONS.forEach(s => {
            const done = quizState.todayProgress[s.id];
            if (done) {
                completedCount++;
                totalScore += done.score;
                totalQuestions += done.total;
            }
            html += `
                <div class="today-session-item ${done ? 'done' : ''}">
                    <span class="today-icon">${s.icon}</span>
                    <span class="today-label">${s.label}</span>
                    <span class="today-score">${done ? `${done.score}/${done.total}` : '—'}</span>
                    <span class="today-check">${done ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#00B36B" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' : '<span style="color:#ccc">○</span>'}</span>
                </div>
            `;

            // Update session card status
            const statusEl = document.getElementById(`sessionStatus_${s.id}`);
            if (statusEl) {
                statusEl.textContent = done ? `${done.score}/${done.total} ✅` : '';
            }
        });
        html += `</div>`;

        if (completedCount > 0) {
            const pct = Math.round((totalScore / totalQuestions) * 100);
            const mainCount = Math.min(3, SESSIONS.filter(s => s.id !== 'extra' && quizState.todayProgress[s.id]).length);
            html += `<div class="today-summary">メイン ${mainCount}/3 セッション完了 · 全体正答率 ${pct}%</div>`;
        }

        container.innerHTML = html;
    }

    // ========== QUIZ FLOW ==========
    function openQuiz() {
        elements.overlay.classList.remove('hidden');

        // Stage-Gate: require auth before proceeding
        DSMAuth.requireAuth((user) => {
            quizState.currentUser = user;
            createSetupScreen();
            loadTodayProgress().then(() => renderTodayProgress());
            showState('setup');
        });
    }

    // ========== LOGIN SCREEN ==========
    function showLoginScreen() {
        // Remove existing login if any
        const existing = document.getElementById('quizStateLogin');
        if (existing) existing.remove();

        const loginDiv = document.createElement('div');
        loginDiv.className = 'quiz-state';
        loginDiv.id = 'quizStateLogin';
        loginDiv.innerHTML = `
            <div class="quiz-setup-inner">
                <h2 class="quiz-setup-title">Deviens sommelier</h2>
                <p class="quiz-setup-subtitle">割り当てられたユーザー名と提供されたAPIキーを入力してください</p>

                <div class="quiz-register-row" style="flex-direction: column; gap: 12px; margin-top: 24px;">
                    <div style="width: 100%;">
                        <label for="quizLoginName" style="font-size: 13px; color: #666; font-weight: 500; margin-bottom: 4px; display: block;">ユーザー名 (ローマ字)</label>
                        <input type="text" id="quizLoginName" placeholder="例: Iga" class="quiz-input" style="width: 100%; box-sizing: border-box;">
                    </div>
                    <div style="width: 100%;">
                        <label for="quizLoginKey" style="font-size: 13px; color: #666; font-weight: 500; margin-bottom: 4px; display: block;">Gemini API Key</label>
                        <input type="password" id="quizLoginKey" placeholder="AIzaSy..." class="quiz-input" style="width: 100%; box-sizing: border-box;">
                    </div>
                    <button id="quizLoginBtn" class="quiz-btn-primary" style="margin-top: 8px;">ログインして開始する</button>
                    <p id="quizLoginError" style="color: #D4002A; font-size: 13px; text-align: center; display: none;">ユーザー名とAPI Keyを入力してください。</p>
                </div>
            </div>
        `;

        elements.closeBtn.insertAdjacentElement('afterend', loginDiv);
        showStateByElement(loginDiv);

        const handleLogin = () => {
            const name = document.getElementById('quizLoginName').value.trim();
            const apiKey = document.getElementById('quizLoginKey').value.trim();
            const errorEl = document.getElementById('quizLoginError');

            if (!name || !apiKey || !apiKey.startsWith('AIza')) {
                errorEl.style.display = 'block';
                errorEl.textContent = !apiKey.startsWith('AIza') && apiKey ? "無効な API Key です。" : "ユーザー名とAPI Keyを入力してください。";
                return;
            }
            
            errorEl.style.display = 'none';
            
            // Save user and API key
            const uid = 'usr_' + Date.now().toString(36);
            const userObj = { user_id: uid, name: name };
            quizState.currentUser = userObj;
            localStorage.setItem('sommelier_quiz_user', JSON.stringify(userObj));
            localStorage.setItem('sommelier_api_key', apiKey);
            
            createSetupScreen();
            loadTodayProgress().then(() => renderTodayProgress());
            showState('setup');
        };

        // Login button
        document.getElementById('quizLoginBtn').addEventListener('click', handleLogin);
        // Enter key
        document.getElementById('quizLoginKey').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    async function registerUser(name) {
        try {
            const res = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'registerUser', name })
            });
            const data = await res.json();
            if (data.status === 'success') {
                selectUser(data.data.user_id, name);
            }
        } catch (e) {
            console.error('Registration error', e);
        }
    }

    function selectUser(userId, name) {
        quizState.currentUser = { user_id: userId, name };
        localStorage.setItem('sommelier_quiz_user', JSON.stringify(quizState.currentUser));
        createSetupScreen();
        loadTodayProgress().then(() => renderTodayProgress());
        showState('setup');
    }

    function showStateByElement(el) {
        // Hide all quiz states
        document.querySelectorAll('.quiz-state').forEach(s => s.classList.add('hidden'));
        el.classList.remove('hidden');
    }

    function closeQuiz() {
        elements.overlay.classList.add('hidden');
    }

    function resetAndRestart() {
        quizState.selectedSession = null;
        quizState.questions = [];
        quizState.userAnswers = [];
        quizState.currentQuestionIndex = 0;
        // Refresh today progress
        loadTodayProgress().then(() => {
            renderTodayProgress();
            // Deselect session cards
            document.querySelectorAll('.quiz-session-card').forEach(c => c.classList.remove('active'));
            const btn = document.getElementById('quizStartBtn');
            if (btn) { btn.disabled = true; btn.textContent = 'セッションを選んでください'; }
            showState('setup');
        });
    }

    function showState(stateName) {
        if (elements.stateSetup) elements.stateSetup.classList.add('hidden');
        elements.stateLoading.classList.add('hidden');
        elements.stateQuestion.classList.add('hidden');
        elements.stateResults.classList.add('hidden');

        if (stateName === 'setup' && elements.stateSetup) elements.stateSetup.classList.remove('hidden');
        if (stateName === 'loading') elements.stateLoading.classList.remove('hidden');
        if (stateName === 'question') elements.stateQuestion.classList.remove('hidden');
        if (stateName === 'results') elements.stateResults.classList.remove('hidden');
    }

    // ========== GENERATION ==========
    async function startQuizGeneration(chapterId) {
        showState('loading');

        try {
            let targetChId = chapterId;
            if (targetChId === 'random') {
                const randomCh = quizState.chapters[Math.floor(Math.random() * quizState.chapters.length)];
                targetChId = randomCh.id;
            }
            quizState.selectedChapter = quizState.chapters.find(c => c.id === targetChId) || { id: targetChId, title: targetChId };

            const res = await fetch(`../data/chapters/${targetChId}.json`);
            const chapterData = await res.json();

            const pages = chapterData.pages || [];
            if (pages.length === 0) throw new Error("No pages found in chapter");

            // Pick 10 random pages (with replacement allowed)
            let selectedTexts = [];
            for (let i = 0; i < QUIZ_COUNT; i++) {
                const rp = pages[Math.floor(Math.random() * pages.length)];
                selectedTexts.push(`[Page ${rp.page}]\n${rp.text}`);
            }

            const contextText = selectedTexts.join("\n\n---\n\n");
            await generateFromGemini(contextText);

        } catch (error) {
            console.error("Quiz generation error:", error);
            alert("クイズ生成中にエラーが発生しました: " + error.message);
            showState('setup');
        }
    }

    async function generateFromGemini(contextText) {
        const apiKey = getApiKey();

        const promptText = `
あなたはJ.S.A.ソムリエ試験問題の専門作成AIです。
以下の【参照テキスト】に含まれる事実のみを用いて、高度で正確な4択問題を【${QUIZ_COUNT}問】作成してください。

# 制約事項
- 問題は必ず以下に指定する厳密なJSON配列形式で返すこと。
- 余計な挨拶やMarkdownコードブロック (\`\`\`json) は絶対に含まないこと。JSON自体のみ出力せよ。
- 問題はプロフェッショナル向け（重箱の隅をつつくような具体的なものや、主要な概念を問うもの）にする。
- 選択肢は必ず4つ。
- 外国語の単語（ワイン名、産地、ブドウ品種、専門用語など）が登場する場合は、可能な限り直後にカッコ書きでカタカナのふりがなを付けてください（例: Pinot Noir（ピノ・ノワール）、Bourgogne（ブルゴーニュ））。

# 参照テキスト
${contextText}

# 出力JSONフォーマット
[
  {
    "question": "問題文",
    "choices": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "解説文"
  }
]
        `;

        const requestBody = {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
                temperature: 0.3
            }
        };

        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "API request failed");
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        let parsedQuestions = [];
        try {
            parsedQuestions = JSON.parse(responseText.trim());
        } catch (e) {
            const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedQuestions = JSON.parse(cleaned);
        }

        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error("Invalid format received from AI");
        }

        quizState.questions = parsedQuestions;
        quizState.currentQuestionIndex = 0;
        quizState.userAnswers = [];

        showState('question');
        renderQuestion(0);
    }

    // ========== QUIZ UI ==========
    function renderQuestion(index) {
        const q = quizState.questions[index];
        elements.progress.innerText = `QUESTION ${index + 1} / ${quizState.questions.length}`;
        elements.questionText.innerText = q.question;

        elements.choicesBox.innerHTML = '';
        q.choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-choice-btn';

            const numberSpan = document.createElement('span');
            numberSpan.className = 'quiz-choice-number';
            numberSpan.innerText = String.fromCharCode(65 + i);

            const textSpan = document.createElement('span');
            textSpan.innerText = choice;

            btn.appendChild(numberSpan);
            btn.appendChild(textSpan);
            btn.addEventListener('click', () => handleAnswer(index, i));
            elements.choicesBox.appendChild(btn);
        });

        // わからない（スキップ）ボタンを追加
        const idkBtn = document.createElement('button');
        idkBtn.className = 'quiz-choice-btn quiz-idk-btn';
        idkBtn.style.marginTop = '1rem';
        idkBtn.style.borderStyle = 'dashed';
        idkBtn.style.opacity = '0.8';
        idkBtn.innerHTML = `<span class="quiz-choice-number" style="background:transparent; color:var(--text-secondary); border: 1px solid var(--border)">?</span><span>わからない（正解を見る）</span>`;
        idkBtn.addEventListener('click', () => handleAnswer(index, -1));
        elements.choicesBox.appendChild(idkBtn);
    }

    function handleAnswer(qIndex, selectedChoiceIndex) {
        const q = quizState.questions[qIndex];
        const isCorrect = (selectedChoiceIndex === q.correct_index);

        quizState.userAnswers.push({
            qIndex,
            selectedChoiceIndex,
            isCorrect,
            questionData: q
        });

        const buttons = elements.choicesBox.querySelectorAll('.quiz-choice-btn');
        if (selectedChoiceIndex >= 0) {
            buttons[selectedChoiceIndex].classList.add('selected');
        } else {
            buttons[buttons.length - 1].classList.add('selected'); // IDK Btn
        }

        // Disable all buttons to prevent double-click
        buttons.forEach(b => b.style.pointerEvents = 'none');

        setTimeout(() => {
            if (qIndex + 1 < quizState.questions.length) {
                quizState.currentQuestionIndex++;
                renderQuestion(quizState.currentQuestionIndex);
            } else {
                finishQuiz();
            }
        }, 400);
    }

    // ========== PAIR SETUP ==========
    function showPairSetup(startBtn) {
        // Remove existing pair setup
        const existing = document.getElementById('pairSetupRow');
        if (existing) existing.remove();

        const pairDiv = document.createElement('div');
        pairDiv.id = 'pairSetupRow';
        pairDiv.className = 'pair-setup-row';
        pairDiv.innerHTML = `
            <div class="pair-setup-header">
                <span class="pair-setup-icon">🤝</span>
                <span class="pair-setup-title">ペアモード設定</span>
            </div>
            <div class="pair-setup-field">
                <label for="pairPartnerName">出題してくれる人の名前（ローマ字）</label>
                <input type="text" id="pairPartnerName" placeholder="例: Mohri" class="quiz-input" style="width:100%; box-sizing:border-box;">
            </div>
            <div class="pair-setup-bonus">
                <span class="pair-token-badge">+${TOKEN_PAIR_BONUS}T BONUS</span>
                <span class="pair-bonus-desc">仲間と一緒に学ぶとボーナストークン獲得！</span>
            </div>
        `;

        // Insert before start button
        startBtn.parentElement.insertBefore(pairDiv, startBtn);
        startBtn.disabled = true;
        startBtn.textContent = '出題者の名前を入力してください';

        const partnerInput = document.getElementById('pairPartnerName');
        partnerInput.addEventListener('input', () => {
            const val = partnerInput.value.trim();
            if (val.length > 0) {
                quizState.pairPartner = val;
                startBtn.disabled = false;
                startBtn.textContent = `${val} さんと一緒にスタート（${QUIZ_COUNT}問）`;
            } else {
                quizState.pairPartner = null;
                startBtn.disabled = true;
                startBtn.textContent = '出題者の名前を入力してください';
            }
        });
        partnerInput.focus();
    }

    // ========== RESULTS ==========
    async function finishQuiz() {
        showState('results');

        const correctCount = quizState.userAnswers.filter(a => a.isCorrect).length;
        const total = quizState.questions.length;
        const isPair = quizState.selectedSession === 'pair';
        const tokens = calculateTokens(correctCount, total, isPair);

        elements.scoreNumber.innerText = `${correctCount} / ${total}`;
        elements.scoreNumber.style.color = (correctCount >= total * 0.8) ? '#00B36B' : (correctCount >= total * 0.5) ? '#F5A623' : 'var(--accent)';

        // ---------- TOKEN SUMMARY (inserted before results list) ----------
        const tokenSummaryEl = document.createElement('div');
        tokenSummaryEl.className = 'token-summary';
        tokenSummaryEl.innerHTML = `
            <div class="token-summary-header">
                <span class="token-summary-icon">🪙</span>
                <span class="token-summary-title">獲得トークン</span>
            </div>
            <div class="token-breakdown">
                <div class="token-row">
                    <span class="token-label">正解 ${correctCount}問 × ${TOKEN_CORRECT}T</span>
                    <span class="token-value token-correct">+${tokens.correctTokens}T</span>
                </div>
                <div class="token-row">
                    <span class="token-label">不正解 ${total - correctCount}問 × ${TOKEN_WRONG}T</span>
                    <span class="token-value token-wrong">+${tokens.wrongTokens}T</span>
                </div>
                ${isPair ? `
                <div class="token-row token-row-bonus">
                    <span class="token-label">🤝 ペアボーナス</span>
                    <span class="token-value token-pair">+${tokens.pairBonus}T</span>
                </div>` : ''}
                <div class="token-row token-row-total">
                    <span class="token-label">合計</span>
                    <span class="token-value token-total">${tokens.total}T</span>
                </div>
            </div>
            ${isPair ? `
            <div class="pair-reflection">
                <div class="pair-reflection-label">出題してくれた人</div>
                <div class="pair-reflection-partner">
                    <span class="pair-partner-avatar">${(quizState.pairPartner || '?').charAt(0)}</span>
                    <span class="pair-partner-name">${quizState.pairPartner}</span>
                </div>
                <div class="pair-reflection-thanks">一緒に学んでくれてありがとう！この記憶が、あなたの力になる。</div>
            </div>` : `
            <div class="solo-tip">
                <span class="solo-tip-icon">💡</span>
                <span>ペアモードなら <strong>+${TOKEN_PAIR_BONUS}T ボーナス</strong> を獲得できます！</span>
            </div>`}
        `;

        elements.resultsList.innerHTML = '';
        elements.resultsList.parentElement.insertBefore(tokenSummaryEl, elements.resultsList);

        // ---------- QUESTION RESULTS ----------
        quizState.userAnswers.forEach((ans, i) => {
            const q = ans.questionData;
            const card = document.createElement('div');
            card.className = `quiz-result-card ${ans.isCorrect ? 'correct' : 'wrong'}`;

            const icon = ans.isCorrect ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#00B36B" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#D94052" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
            const iconClass = ans.isCorrect ? 'correct' : 'wrong';

            card.innerHTML = `
                <div class="result-q-header">
                    <span class="result-icon ${iconClass}">${icon}</span>
                    <span class="result-q-title">Question ${i + 1}</span>
                </div>
                <div class="result-q-text">${q.question}</div>
                <div class="result-answer-row">
                    <span class="result-answer-label">あなた</span>
                    <span class="result-answer-text ${ans.isCorrect ? 'correct-text' : 'wrong-text'}">${ans.selectedChoiceIndex === -1 ? 'わからない（未回答）' : q.choices[ans.selectedChoiceIndex]}</span>
                </div>
                ${!ans.isCorrect ? `
                <div class="result-answer-row">
                    <span class="result-answer-label">正解</span>
                    <span class="result-answer-text correct-text">${q.choices[q.correct_index]}</span>
                </div>` : ''}
                <div class="result-explanation"><strong>解説:</strong><br>${q.explanation}</div>
            `;
            elements.resultsList.appendChild(card);
        });

        // Save result
        await saveResult(correctCount, total, tokens);
    }

    // ========== PERSISTENCE ==========
    async function saveResult(score, total, tokens) {
        const date = getJSTDateString();
        const session = quizState.selectedSession;
        const isPair = session === 'pair';
        const details = quizState.userAnswers.map(a => ({
            q: a.questionData.question.substring(0, 60),
            correct: a.isCorrect,
            selected: a.selectedChoiceIndex,
            answer: a.questionData.correct_index
        }));

        // Always save to localStorage as fallback
        const todayKey = 'quiz_today_' + date;
        const stored = JSON.parse(localStorage.getItem(todayKey) || '{}');
        stored[session] = { score, total };
        localStorage.setItem(todayKey, JSON.stringify(stored));
        quizState.todayProgress = stored;

        // Accumulate tokens in localStorage
        const currentTokens = parseInt(localStorage.getItem('sommelier_total_tokens') || '0', 10);
        localStorage.setItem('sommelier_total_tokens', String(currentTokens + (tokens?.total || 0)));

        // Save to GAS if configured
        if (GAS_URL) {
            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'saveResult',
                        user_name: quizState.currentUser?.name || '',
                        date,
                        session,
                        score,
                        total,
                        chapter_id: quizState.selectedChapter?.id || '',
                        chapter_title: quizState.selectedChapter?.title || '',
                        details,
                        is_pair: isPair,
                        pair_partner: isPair ? quizState.pairPartner : '',
                        tokens: tokens?.total || 0
                    })
                });
                console.log('[Quiz] Result saved to GAS');
            } catch (e) {
                console.warn('[Quiz] GAS save failed, localStorage fallback used', e);
            }
        }
    }

    // ========== BOOT ==========
    document.addEventListener("DOMContentLoaded", init);

})();
