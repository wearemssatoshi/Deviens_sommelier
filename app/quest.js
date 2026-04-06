/**
 * DEVIENS SOMMELIER — Quest Progression System v1.0
 * ワインの旅：Grape → Vine → Cellar → Candidate → Resident Sommelier
 * 
 * Je serai Sommelier — 私はソムリエになる
 */

(function() {
    // ========== CONFIG ==========
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";
    const QUEST_QUIZ_COUNT = 50;
    const PASS_THRESHOLD = 0.9; // 90%

    // ========== DEVELOPER OVERRIDE ==========
    // 開発者は全ティアをアンロックし、すべての機能にフルアクセスできる
    const DEV_USERS = ['伊賀智史'];
    function isDevUser() {
        return questState.currentUser && DEV_USERS.includes(questState.currentUser.name);
    }

    // ========== RANK DEFINITIONS ==========
    const RANKS = [
        {
            id: 'grape',
            title: 'Grape',
            titleJa: 'グレープ',
            subtitle: '学びの種',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><circle cx="8" cy="13" r="3"/><circle cx="16" cy="13" r="3"/><circle cx="12" cy="18" r="3"/><path d="M12 2v3"/><path d="M10 2h4"/></svg>`,
            color: '#9B59B6',
            unlockCondition: '初期ランク',
            requirement: null
        },
        {
            id: 'vine',
            title: 'Vine',
            titleJa: 'ヴァイン',
            subtitle: '成長の証',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5"/><path d="M14.5 8.5c0 0-1.87 1-3.5 3.5a22 22 0 0 0-3 7"/><path d="M3 21c0 0 3-1 6-6"/></svg>`,
            color: '#27AE60',
            unlockCondition: '10日間学習 & 正答率70%以上',
            requirement: { days: 10, accuracy: 70 }
        },
        {
            id: 'cellar',
            title: 'Cellar',
            titleJa: 'セラー',
            subtitle: '知識の熟成',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>`,
            color: '#E67E22',
            unlockCondition: '中級テスト全10回を90%以上でクリア',
            requirement: { tier: 'intermediate', passAll: true }
        },
        {
            id: 'candidate',
            title: 'Candidate',
            titleJa: 'カンディダ',
            subtitle: 'ソムリエ候補生',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>`,
            color: '#2980B9',
            unlockCondition: '上級テスト30回中5回を90%以上クリア',
            requirement: { tier: 'advanced', passCount: 5 }
        },
        {
            id: 'resident',
            title: 'Resident Sommelier',
            titleJa: 'レジデント・ソムリエ',
            subtitle: 'エクセレンス級',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
            color: '#C9A94E',
            unlockCondition: '最上級テスト全10回をクリア',
            requirement: { tier: 'supreme', passAll: true }
        }
    ];

    // ========== TIER DEFINITIONS ==========
    const TIERS = [
        {
            id: 'intermediate',
            title: 'Intermédiaire',
            titleJa: '中級',
            testCount: 10,
            passCondition: 'all', // all tests must be 90%+
            passCount: 10,
            color: '#E67E22',
            rankOnClear: 'cellar',
            description: '基礎から応用まで幅広い知識を問う中級テスト'
        },
        {
            id: 'advanced',
            title: 'Avancé',
            titleJa: '上級',
            testCount: 30,
            passCondition: 'count', // 5 out of 30 must be 90%+
            passCount: 5,
            color: '#2980B9',
            rankOnClear: 'candidate',
            description: '産地・品種・法律を深く掘り下げる難関テスト'
        },
        {
            id: 'supreme',
            title: 'Suprême',
            titleJa: '最上級',
            testCount: 10,
            passCondition: 'all',
            passCount: 10,
            color: '#C9A94E',
            rankOnClear: 'resident',
            description: 'エクセレンス級の域に到達する最終試練'
        }
    ];

    // ========== STATE ==========
    let questState = {
        currentUser: null,
        userStats: null,     // { distinct_days, accuracy, ... }
        questProgress: {},   // { intermediate_01: { bestScore, total, passed }, ... }
        currentTier: null,
        currentTestId: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: []
    };

    // ========== INIT ==========
    function init() {
        document.addEventListener('quest:open', openQuest);
    }

    // ========== OPEN QUEST ==========
    async function openQuest() {
        const overlay = document.getElementById('questOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');

        // Get current user
        const savedUser = localStorage.getItem('sommelier_quiz_user');
        if (savedUser) {
            try { questState.currentUser = JSON.parse(savedUser); } catch(e) {}
        }

        if (!questState.currentUser) {
            renderQuestNoUser(overlay);
            return;
        }

        renderQuestLoading(overlay);

        // Fetch user stats and quest progress
        try {
            const [statsRes, questRes] = await Promise.all([
                fetch(`${GAS_URL}?action=getDetailedStats&user_name=${encodeURIComponent(questState.currentUser.name)}`),
                fetch(`${GAS_URL}?action=getQuestProgress&user_name=${encodeURIComponent(questState.currentUser.name)}`)
            ]);
            
            const statsData = await statsRes.json();
            if (statsData.status === 'success') {
                questState.userStats = statsData.data;
            }

            const questData = await questRes.json();
            if (questData.status === 'success') {
                questState.questProgress = questData.data.progress || {};
            }
        } catch (e) {
            console.warn('[Quest] Failed to load data:', e);
            questState.userStats = questState.userStats || { distinct_days: 0, accuracy: 0 };
            questState.questProgress = questState.questProgress || {};
        }

        renderQuestMain(overlay);
    }

    // ========== DETERMINE CURRENT RANK ==========
    function getCurrentRank() {
        const stats = questState.userStats;
        const progress = questState.questProgress;
        if (!stats) return RANKS[0]; // Grape

        // Check Resident Sommelier
        if (isTierCleared('supreme', progress)) return RANKS[4];
        // Check Candidate
        if (isTierCleared('advanced', progress)) return RANKS[3];
        // Check Cellar
        if (isTierCleared('intermediate', progress)) return RANKS[2];
        // Check Vine (quest unlock)
        if (stats.distinct_days >= 10 && stats.accuracy >= 70) return RANKS[1];
        // Default: Grape
        return RANKS[0];
    }

    function isTierCleared(tierId, progress) {
        const tier = TIERS.find(t => t.id === tierId);
        if (!tier) return false;

        let passedCount = 0;
        for (let i = 1; i <= tier.testCount; i++) {
            const testKey = `${tierId}_${String(i).padStart(2, '0')}`;
            const result = progress[testKey];
            if (result && result.bestScore >= Math.ceil(QUEST_QUIZ_COUNT * PASS_THRESHOLD)) {
                passedCount++;
            }
        }

        if (tier.passCondition === 'all') return passedCount >= tier.testCount;
        if (tier.passCondition === 'count') return passedCount >= tier.passCount;
        return false;
    }

    function isTierUnlocked(tierId) {
        // Developer override: all tiers unlocked
        if (isDevUser()) return true;

        const stats = questState.userStats;
        const progress = questState.questProgress;
        if (!stats) return false;

        // Quest itself must be unlocked (Vine rank)
        if (stats.distinct_days < 10 || stats.accuracy < 70) return false;

        switch (tierId) {
            case 'intermediate': return true; // Unlocked with Vine
            case 'advanced': return isTierCleared('intermediate', progress);
            case 'supreme': return isTierCleared('advanced', progress);
            default: return false;
        }
    }

    // ========== RENDER: LOADING ==========
    function renderQuestLoading(overlay) {
        const body = overlay.querySelector('.quest-body');
        body.innerHTML = `
            <div class="quest-loading">
                <div class="quiz-spinner"></div>
                <p>クエストデータを読み込み中...</p>
            </div>
        `;
    }

    // ========== RENDER: NO USER ==========
    function renderQuestNoUser(overlay) {
        const body = overlay.querySelector('.quest-body');
        body.innerHTML = `
            <div class="quest-empty">
                <div class="quest-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="#999" stroke-width="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <h3>まだログインしていません</h3>
                <p>クイズ画面からログインしてください</p>
            </div>
        `;
    }

    // ========== RENDER: MAIN QUEST PAGE ==========
    function renderQuestMain(overlay) {
        const body = overlay.querySelector('.quest-body');
        const rank = getCurrentRank();
        const stats = questState.userStats || { distinct_days: 0, accuracy: 0 };
        const questUnlocked = isDevUser() || (stats.distinct_days >= 10 && stats.accuracy >= 70);

        // Rank Progress Bar
        const rankIndex = RANKS.findIndex(r => r.id === rank.id);
        const rankPercent = ((rankIndex) / (RANKS.length - 1)) * 100;

        let html = `
            <!-- Current Rank Card -->
            <div class="quest-rank-card" style="--rank-color: ${rank.color}">
                <div class="quest-rank-icon">${rank.icon}</div>
                <div class="quest-rank-info">
                    <div class="quest-rank-label">CURRENT RANK</div>
                    <div class="quest-rank-title">${rank.title}</div>
                    <div class="quest-rank-subtitle">${rank.titleJa} — ${rank.subtitle}</div>
                </div>
            </div>

            <!-- Rank Journey -->
            <div class="quest-journey">
                <div class="quest-journey-title">YOUR JOURNEY</div>
                <div class="quest-journey-track">
                    ${RANKS.map((r, i) => {
                        const achieved = i <= rankIndex;
                        return `
                            <div class="quest-journey-node ${achieved ? 'achieved' : ''}" style="--node-color: ${r.color}">
                                <div class="quest-journey-dot"></div>
                                <div class="quest-journey-label">${r.title}</div>
                            </div>
                        `;
                    }).join('')}
                    <div class="quest-journey-line">
                        <div class="quest-journey-fill" style="width: ${rankPercent}%"></div>
                    </div>
                </div>
            </div>
        `;

        if (!questUnlocked) {
            // Show unlock requirements
            const daysLeft = Math.max(0, 10 - stats.distinct_days);
            const accDiff = Math.max(0, 70 - stats.accuracy);
            html += `
                <div class="quest-lock-notice">
                    <div class="quest-lock-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3>クエストはまだロックされています</h3>
                    <p>日常クイズを継続して、クエストをアンロックしましょう</p>
                    <div class="quest-lock-conditions">
                        <div class="quest-lock-cond ${stats.distinct_days >= 10 ? 'met' : ''}">
                            <span class="quest-cond-check">${stats.distinct_days >= 10 ? '✓' : '○'}</span>
                            <span>学習日数: <strong>${stats.distinct_days} / 10日</strong>${daysLeft > 0 ? ` (残り${daysLeft}日)` : ''}</span>
                        </div>
                        <div class="quest-lock-cond ${stats.accuracy >= 70 ? 'met' : ''}">
                            <span class="quest-cond-check">${stats.accuracy >= 70 ? '✓' : '○'}</span>
                            <span>通算正答率: <strong>${stats.accuracy}% / 70%</strong>${accDiff > 0 ? ` (あと${accDiff}%必要)` : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Show tier cards
            html += `<div class="quest-tiers-title">QUEST EXAMINATIONS</div>`;
            TIERS.forEach(tier => {
                const unlocked = isTierUnlocked(tier.id);
                const cleared = isTierCleared(tier.id, questState.questProgress);
                html += renderTierCard(tier, unlocked, cleared);
            });
        }

        body.innerHTML = html;

        // Bind tier expand/collapse and test start buttons
        body.querySelectorAll('.quest-tier-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.quest-tier-card');
                if (card.classList.contains('locked')) return;
                card.classList.toggle('expanded');
            });
        });

        body.querySelectorAll('.quest-test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tierId = btn.dataset.tier;
                const testNum = parseInt(btn.dataset.test);
                startQuestTest(tierId, testNum);
            });
        });
    }

    // ========== RENDER: TIER CARD ==========
    function renderTierCard(tier, unlocked, cleared) {
        const progress = questState.questProgress;
        let passedCount = 0;
        let testListHtml = '';

        for (let i = 1; i <= tier.testCount; i++) {
            const testKey = `${tier.id}_${String(i).padStart(2, '0')}`;
            const result = progress[testKey];
            const bestScore = result ? result.bestScore : null;
            const passed = bestScore !== null && bestScore >= Math.ceil(QUEST_QUIZ_COUNT * PASS_THRESHOLD);
            if (passed) passedCount++;

            const statusClass = !unlocked ? 'locked' : passed ? 'passed' : bestScore !== null ? 'attempted' : 'available';
            const scoreDisplay = bestScore !== null ? `${bestScore}/${QUEST_QUIZ_COUNT}` : '—';
            const pctDisplay = bestScore !== null ? `${Math.round((bestScore / QUEST_QUIZ_COUNT) * 100)}%` : '';

            testListHtml += `
                <div class="quest-test-row ${statusClass}">
                    <div class="quest-test-num">Test ${i}</div>
                    <div class="quest-test-score">${scoreDisplay}</div>
                    <div class="quest-test-pct ${passed ? 'pass' : ''}">${pctDisplay}</div>
                    ${unlocked && !passed ? `<button class="quest-test-btn" data-tier="${tier.id}" data-test="${i}">${bestScore !== null ? '再挑戦' : '挑戦'}</button>` : ''}
                    ${passed ? '<span class="quest-test-check">✓</span>' : ''}
                </div>
            `;
        }

        const progressPct = tier.passCondition === 'all' 
            ? Math.round((passedCount / tier.testCount) * 100)
            : Math.round((Math.min(passedCount, tier.passCount) / tier.passCount) * 100);

        const conditionText = tier.passCondition === 'all'
            ? `全${tier.testCount}テスト 90%以上: ${passedCount}/${tier.testCount}`
            : `${tier.testCount}テスト中${tier.passCount}回 90%以上: ${passedCount}/${tier.passCount}`;

        return `
            <div class="quest-tier-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" style="--tier-color: ${tier.color}">
                <div class="quest-tier-header">
                    <div class="quest-tier-left">
                        ${!unlocked ? '<span class="quest-tier-lock-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>' : ''}
                        <div>
                            <div class="quest-tier-title">${tier.title}</div>
                            <div class="quest-tier-subtitle">${tier.titleJa} — ${tier.description}</div>
                        </div>
                    </div>
                    <div class="quest-tier-right">
                        ${cleared ? '<span class="quest-tier-badge">CLEARED</span>' : ''}
                        ${unlocked && !cleared ? `<span class="quest-tier-progress">${progressPct}%</span>` : ''}
                        ${unlocked ? '<span class="quest-tier-chevron">▼</span>' : ''}
                    </div>
                </div>
                ${unlocked ? `
                    <div class="quest-tier-body">
                        <div class="quest-tier-progress-bar">
                            <div class="quest-tier-progress-fill" style="width: ${progressPct}%"></div>
                        </div>
                        <div class="quest-tier-condition">${conditionText}</div>
                        <div class="quest-test-list">
                            ${testListHtml}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ========== START QUEST TEST ==========
    async function startQuestTest(tierId, testNum) {
        const overlay = document.getElementById('questOverlay');
        const body = overlay.querySelector('.quest-body');
        const testKey = `${tierId}_${String(testNum).padStart(2, '0')}`;
        
        questState.currentTier = tierId;
        questState.currentTestId = testKey;

        body.innerHTML = `
            <div class="quest-loading">
                <div class="quiz-spinner"></div>
                <p>模擬試験を読み込み中...</p>
            </div>
        `;

        try {
            const res = await fetch(`../data/quiz_bank/${testKey}.json`);
            if (!res.ok) throw new Error('Test not found');
            const questions = await res.json();

            questState.questions = questions;
            questState.currentQuestionIndex = 0;
            questState.userAnswers = [];

            renderQuestQuestion(body);
        } catch (e) {
            body.innerHTML = `
                <div class="quest-empty">
                    <div class="quest-empty-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="#999" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </div>
                    <h3>テストデータが見つかりません</h3>
                    <p>${testKey}.json は準備中です</p>
                    <button class="quest-back-btn" onclick="document.dispatchEvent(new CustomEvent('quest:open'))">戻る</button>
                </div>
            `;
        }
    }

    // ========== RENDER: QUEST QUESTION ==========
    function renderQuestQuestion(body) {
        const q = questState.questions[questState.currentQuestionIndex];
        const total = questState.questions.length;
        const current = questState.currentQuestionIndex + 1;
        const pct = Math.round((current / total) * 100);

        const tierDef = TIERS.find(t => t.id === questState.currentTier);
        const tierLabel = tierDef ? `${tierDef.title} — Test ${questState.currentTestId.split('_').pop()}` : '';

        body.innerHTML = `
            <div class="quest-exam">
                <div class="quest-exam-header">
                    <span class="quest-exam-tier">${tierLabel}</span>
                    <span class="quest-exam-progress">Q${current} / ${total}</span>
                </div>
                <div class="quest-exam-progressbar">
                    <div class="quest-exam-progressfill" style="width: ${pct}%"></div>
                </div>
                <div class="quest-exam-question">${q.question}</div>
                <div class="quest-exam-choices">
                    ${q.choices.map((choice, i) => `
                        <button class="quest-choice-btn" data-index="${i}">
                            <span class="quest-choice-letter">${String.fromCharCode(65 + i)}</span>
                            <span>${choice}</span>
                        </button>
                    `).join('')}
                    <button class="quest-choice-btn quest-idk-btn" data-index="-1">
                        <span class="quest-choice-letter" style="background:transparent; border:1px solid var(--border); color: var(--text-secondary)">?</span>
                        <span>わからない（正解を見る）</span>
                    </button>
                </div>
            </div>
        `;

        body.querySelectorAll('.quest-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedIndex = parseInt(btn.dataset.index);
                handleQuestAnswer(body, selectedIndex);
            });
        });
    }

    // ========== HANDLE ANSWER ==========
    function handleQuestAnswer(body, selectedIndex) {
        const q = questState.questions[questState.currentQuestionIndex];
        const isCorrect = selectedIndex === q.correct_index;

        questState.userAnswers.push({
            selectedIndex,
            isCorrect,
            questionData: q
        });

        // Disable buttons
        body.querySelectorAll('.quest-choice-btn').forEach(b => b.style.pointerEvents = 'none');

        // Highlight
        const buttons = body.querySelectorAll('.quest-choice-btn');
        if (selectedIndex >= 0) {
            buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
        }

        setTimeout(() => {
            if (questState.currentQuestionIndex + 1 < questState.questions.length) {
                questState.currentQuestionIndex++;
                renderQuestQuestion(body);
            } else {
                finishQuestTest(body);
            }
        }, 500);
    }

    // ========== FINISH TEST ==========
    async function finishQuestTest(body) {
        const correctCount = questState.userAnswers.filter(a => a.isCorrect).length;
        const total = questState.questions.length;
        const pct = Math.round((correctCount / total) * 100);
        const passed = pct >= 90;
        const tierDef = TIERS.find(t => t.id === questState.currentTier);

        body.innerHTML = `
            <div class="quest-results">
                <div class="quest-results-badge ${passed ? 'passed' : 'failed'}">
                    ${passed 
                        ? '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" stroke="#C9A94E" stroke-width="1.5" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>'
                        : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" stroke="#D4002A" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
                    }
                </div>
                <div class="quest-results-title">${passed ? 'CLEAR!' : 'NOT YET...'}</div>
                <div class="quest-results-score" style="color: ${passed ? '#C9A94E' : '#D4002A'}">${correctCount} / ${total}</div>
                <div class="quest-results-pct">${pct}%</div>
                <div class="quest-results-threshold">${passed ? '90%基準をクリア' : '90%以上で合格 — もう一度挑戦しましょう'}</div>

                <div class="quest-results-details">
                    ${questState.userAnswers.map((ans, i) => {
                        const q = ans.questionData;
                        return `
                            <div class="quest-result-item ${ans.isCorrect ? 'correct' : 'wrong'}">
                                <span class="quest-result-num">Q${i+1}</span>
                                <span class="quest-result-status">${ans.isCorrect ? '○' : '✕'}</span>
                                ${!ans.isCorrect ? `<div class="quest-result-detail">
                                    <div class="quest-result-q">${q.question}</div>
                                    <div class="quest-result-correct">正解: ${q.choices[q.correct_index]}</div>
                                    <div class="quest-result-exp">${q.explanation}</div>
                                </div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="quest-results-actions">
                    <button class="quest-back-btn" id="questBackToMain">クエスト一覧に戻る</button>
                </div>
            </div>
        `;

        // Bind back button
        document.getElementById('questBackToMain').addEventListener('click', () => {
            openQuest();
        });

        // Save to GAS
        await saveQuestResult(correctCount, total);
    }

    // ========== SAVE RESULT ==========
    async function saveQuestResult(score, total) {
        const testKey = questState.currentTestId;
        const userName = questState.currentUser?.name || '';
        if (!userName || !testKey) return;

        // Update local progress
        const existing = questState.questProgress[testKey];
        if (!existing || score > existing.bestScore) {
            questState.questProgress[testKey] = { bestScore: score, total: total, passed: score >= Math.ceil(total * PASS_THRESHOLD) };
        }

        // Save to GAS
        try {
            await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'saveQuestResult',
                    user_name: userName,
                    test_id: testKey,
                    score: score,
                    total: total,
                    timestamp: new Date().toISOString()
                })
            });
            console.log('[Quest] Result saved to GAS');
        } catch (e) {
            console.warn('[Quest] GAS save failed:', e);
        }
    }

    // ========== CLOSE ==========
    function closeQuest() {
        const overlay = document.getElementById('questOverlay');
        if (overlay) overlay.classList.add('hidden');
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('navHome')?.classList.add('active');
    }

    // ========== BOOT ==========
    document.addEventListener('DOMContentLoaded', () => {
        init();
        const closeBtn = document.getElementById('questClose');
        if (closeBtn) closeBtn.addEventListener('click', closeQuest);
    });
})();
