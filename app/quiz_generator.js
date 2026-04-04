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
        { id: 'extra',   label: '補習（無制限）', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>', desc: '1日に何度でも反復練習' }
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

    // ========== STATE ==========
    let quizState = {
        currentUser: null, // { user_id, name }
        chapters: [],
        selectedChapter: null,
        selectedSession: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        todayProgress: {}
    };

    function getApiKey() {
        return localStorage.getItem('sommelier_api_key');
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

        // Restore user from localStorage
        const savedUser = localStorage.getItem('sommelier_quiz_user');
        if (savedUser) {
            try { quizState.currentUser = JSON.parse(savedUser); } catch(e) {}
        }

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
                        <span class="user-avatar-sm">${(quizState.currentUser?.name || '?').charAt(0)}</span>
                        ${quizState.currentUser?.name || 'ゲスト'}
                    </span>
                    <button class="quiz-switch-user" id="quizSwitchUser">受講者を変更</button>
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
                const btn = document.getElementById('quizStartBtn');
                btn.disabled = false;
                const session = SESSIONS.find(s => s.id === card.dataset.session);
                btn.textContent = `${session.label}を開始（${QUIZ_COUNT}問）`;
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
        const apiKey = getApiKey();
        if (!apiKey) {
            const key = prompt("SommelierPRO AIを利用するためのGemini APIキーを入力してください:");
            if (key) localStorage.setItem('sommelier_api_key', key.trim());
            else return;
        }
        elements.overlay.classList.remove('hidden');

        if (!quizState.currentUser) {
            showLoginScreen();
        } else {
            createSetupScreen();
            loadTodayProgress().then(() => renderTodayProgress());
            showState('setup');
        }
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
                <p class="quiz-setup-subtitle">受講者を選択、または新規登録してください</p>

                <div class="quiz-user-list" id="quizUserList">
                    <div class="quiz-loading-text">受講者リストを読み込み中...</div>
                </div>

                <div class="quiz-login-divider">または</div>

                <div class="quiz-register-row">
                    <input type="text" id="quizNewUserName" placeholder="新規受講者の名前を入力" class="quiz-input">
                    <button id="quizRegisterBtn" class="quiz-btn-secondary">登録</button>
                </div>
            </div>
        `;

        elements.closeBtn.insertAdjacentElement('afterend', loginDiv);
        showStateByElement(loginDiv);

        // Load users from GAS
        loadUserList();

        // Register button
        document.getElementById('quizRegisterBtn').addEventListener('click', async () => {
            const nameInput = document.getElementById('quizNewUserName');
            const name = nameInput.value.trim();
            if (!name) return;
            await registerUser(name);
        });

        // Enter key
        document.getElementById('quizNewUserName').addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const name = e.target.value.trim();
                if (name) await registerUser(name);
            }
        });
    }

    async function loadUserList() {
        const container = document.getElementById('quizUserList');
        if (!GAS_URL) {
            container.innerHTML = '<div class="quiz-loading-text">バックエンド未設定</div>';
            return;
        }
        try {
            const res = await fetch(`${GAS_URL}?action=getUsers`);
            const data = await res.json();
            if (data.status === 'success' && data.data.users.length > 0) {
                container.innerHTML = data.data.users.map(u => `
                    <button class="quiz-user-card" data-uid="${u.user_id}" data-name="${u.name}">
                        <span class="user-avatar">${u.name.charAt(0)}</span>
                        <span class="user-name">${u.name}</span>
                    </button>
                `).join('');

                container.querySelectorAll('.quiz-user-card').forEach(card => {
                    card.addEventListener('click', () => {
                        selectUser(card.dataset.uid, card.dataset.name);
                    });
                });
            } else {
                container.innerHTML = '<div class="quiz-loading-text">まだ受講者がいません。下から登録してください。</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="quiz-loading-text">読み込みに失敗しました</div>';
        }
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
                temperature: 0.3,
                responseMimeType: "application/json"
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

    // ========== RESULTS ==========
    async function finishQuiz() {
        showState('results');

        const correctCount = quizState.userAnswers.filter(a => a.isCorrect).length;
        const total = quizState.questions.length;

        elements.scoreNumber.innerText = `${correctCount} / ${total}`;
        elements.scoreNumber.style.color = (correctCount >= total * 0.8) ? '#00B36B' : (correctCount >= total * 0.5) ? '#F5A623' : 'var(--accent)';

        elements.resultsList.innerHTML = '';

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
        await saveResult(correctCount, total);
    }

    // ========== PERSISTENCE ==========
    async function saveResult(score, total) {
        const date = getJSTDateString();
        const session = quizState.selectedSession;
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
                        details
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
