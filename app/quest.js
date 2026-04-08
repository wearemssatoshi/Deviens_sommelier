/**
 * DEVIENS SOMMELIER — Quest Progression System v2.0
 * 100,000 Token Economy + Médoc 1855 Classification Status
 * 
 * - 中級: 累計トークンゲート（自動解放・無料）
 * - 上級: 200トークン支払い → クリアで1,000トークン（周回OK）
 * - 最上級: 5,000トークン支払い → クリアで15,000トークン（周回OK）
 * - 卒業: 累計100,000トークンでResident Sommelierディプロマ
 * 
 * Je serai Sommelier — 私はソムリエになる
 */

(function() {
    // ========== CONFIG ==========
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";
    const QUEST_QUIZ_COUNT = TOKEN_ECONOMY.questQuizCount;        // 50
    const PASS_THRESHOLD   = TOKEN_ECONOMY.passThreshold;          // 0.9
    const DIPLOMA_THRESHOLD = TOKEN_ECONOMY.diplomaThreshold;      // 100,000

    // ========== DEVELOPER OVERRIDE ==========
    const DEV_USERS = ['伊賀智史'];
    function isDevUser() {
        return questState.currentUser && DEV_USERS.includes(questState.currentUser.name);
    }

    // ========== RANK DEFINITIONS (Journey Milestones) ==========
    const RANKS = [
        {
            id: 'grape', title: 'Grape', titleJa: 'グレープ', subtitle: '学びの種',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><circle cx="8" cy="13" r="3"/><circle cx="16" cy="13" r="3"/><circle cx="12" cy="18" r="3"/><path d="M12 2v3"/><path d="M10 2h4"/></svg>`,
            color: '#9B59B6', unlockCondition: '初期ランク', requirement: null
        },
        {
            id: 'vine', title: 'Vine', titleJa: 'ヴァイン', subtitle: '成長の証',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5"/><path d="M14.5 8.5c0 0-1.87 1-3.5 3.5a22 22 0 0 0-3 7"/><path d="M3 21c0 0 3-1 6-6"/></svg>`,
            color: '#27AE60', unlockCondition: '累計200トークン到達', requirement: { cumulativeTokens: 200 }
        },
        {
            id: 'cellar', title: 'Cellar', titleJa: 'セラー', subtitle: '知識の熟成',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>`,
            color: '#E67E22', unlockCondition: '中級テスト全10回クリア', requirement: { tier: 'intermediate', passAll: true }
        },
        {
            id: 'candidate', title: 'Candidate', titleJa: 'カンディダ', subtitle: 'ソムリエ候補生',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>`,
            color: '#2980B9', unlockCondition: '上級テスト全10回クリア', requirement: { tier: 'advanced', passAll: true }
        },
        {
            id: 'resident', title: 'Resident Sommelier', titleJa: 'レジデント・ソムリエ', subtitle: 'ディプロマ取得',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
            color: '#C9A94E', unlockCondition: '累計100,000トークン到達', requirement: { cumulativeTokens: DIPLOMA_THRESHOLD }
        }
    ];

    // ========== TIER DEFINITIONS (Token Economy v2) ==========
    const TIERS = [
        TOKEN_ECONOMY.tiers.intermediate,
        TOKEN_ECONOMY.tiers.advanced,
        TOKEN_ECONOMY.tiers.supreme
    ];

    // ========== STATE ==========
    let questState = {
        currentUser: null,
        userStats: null,
        questProgress: {},
        spentTokens: 0,
        questEarned: 0,
        currentTier: null,
        currentTestId: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        pendingFee: 0       // Fee paid for current attempt (for cashback calc)
    };

    // ========== WALLET HELPERS ==========
    function getTotalTokens() {
        const quizTokens = questState.userStats?.total_tokens || 0;
        return quizTokens; // GAS now includes quest_earned in total_tokens
    }

    function getWalletBalance() {
        return (questState.userStats?.wallet_balance) || 0;
    }

    // ========== INIT ==========
    function init() {
        document.addEventListener('quest:open', openQuest);
    }

    // ========== OPEN QUEST ==========
    async function openQuest() {
        const overlay = document.getElementById('questOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');

        DSMAuth.requireAuth(async (user) => {
            questState.currentUser = user;
            renderQuestLoading(overlay);

            try {
                const [statsRes, questRes] = await Promise.all([
                    fetch(`${GAS_URL}?action=getDetailedStats&user_name=${encodeURIComponent(user.name)}`),
                    fetch(`${GAS_URL}?action=getQuestProgress&user_name=${encodeURIComponent(user.name)}`)
                ]);
                
                const statsData = await statsRes.json();
                if (statsData.status === 'success') {
                    questState.userStats = statsData.data;
                }

                const questData = await questRes.json();
                if (questData.status === 'success') {
                    questState.questProgress = questData.data.progress || {};
                    questState.spentTokens = questData.data.spent_tokens || 0;
                    questState.questEarned = questData.data.quest_earned || 0;
                }
            } catch (e) {
                console.warn('[Quest] Failed to load data:', e);
                questState.userStats = questState.userStats || { distinct_days: 0, accuracy: 0, total_tokens: 0, wallet_balance: 0 };
                questState.questProgress = questState.questProgress || {};
            }

            renderQuestMain(overlay);
        });
    }

    // ========== DETERMINE CURRENT RANK ==========
    function getCurrentRank() {
        const totalTokens = getTotalTokens();
        const progress = questState.questProgress;

        if (totalTokens >= DIPLOMA_THRESHOLD) return RANKS[4]; // Resident
        if (isTierCleared('advanced', progress)) return RANKS[3]; // Candidate
        if (isTierCleared('intermediate', progress)) return RANKS[2]; // Cellar
        if (totalTokens >= 200) return RANKS[1]; // Vine
        return RANKS[0]; // Grape
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
        return passedCount >= tier.testCount;
    }

    function isTierUnlocked(tierId) {
        if (isDevUser()) return true;

        const totalTokens = getTotalTokens();
        const progress = questState.questProgress;

        switch (tierId) {
            case 'intermediate':
                return totalTokens >= 200; // Need at least 200 cumulative to start
            case 'advanced':
                return isTierCleared('intermediate', progress);
            case 'supreme':
                return isTierCleared('advanced', progress) && totalTokens >= 10000;
            default:
                return false;
        }
    }

    function isTestUnlocked(tierId, testNum) {
        if (isDevUser()) return true;

        const tierConfig = TOKEN_ECONOMY.tiers[tierId];
        if (!tierConfig) return false;

        if (tierId === 'intermediate') {
            // Cumulative token gate: test N requires N*200 cumulative tokens
            const requiredTokens = testNum * tierConfig.tokenGateStep;
            return getTotalTokens() >= requiredTokens;
        }

        // Advanced & Supreme: always accessible if tier is unlocked (pay per attempt)
        return isTierUnlocked(tierId);
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

    // ========== RENDER: MAIN QUEST PAGE ==========
    function renderQuestMain(overlay) {
        const body = overlay.querySelector('.quest-body');
        const rank = getCurrentRank();
        const totalTokens = getTotalTokens();
        const walletBalance = getWalletBalance();
        const sessionCount = questState.userStats?.session_count || 0;
        const medocRank = getMedocRank(sessionCount);
        const nextMedoc = getNextMedocRank(sessionCount);
        const sessionsLeft = sessionsToNextRank(sessionCount);

        const rankIndex = RANKS.findIndex(r => r.id === rank.id);
        const rankPercent = ((rankIndex) / (RANKS.length - 1)) * 100;

        let html = `
            <!-- Wallet & Médoc Status -->
            <div class="quest-wallet-bar">
                <div class="quest-wallet-section">
                    <div class="quest-wallet-label">WALLET</div>
                    <div class="quest-wallet-value">${walletBalance.toLocaleString()} <span class="quest-wallet-unit">G</span></div>
                </div>
                <div class="quest-wallet-divider"></div>
                <div class="quest-wallet-section">
                    <div class="quest-wallet-label">TOTAL EARNED</div>
                    <div class="quest-wallet-value quest-wallet-total">${totalTokens.toLocaleString()} <span class="quest-wallet-unit">G</span></div>
                </div>
            </div>

            <!-- Médoc 1855 Status -->
            <div class="quest-medoc-card">
                <div class="quest-medoc-grade">${medocRank.gradeJa}</div>
                <div class="quest-medoc-name">${medocRank.name}</div>
                <div class="quest-medoc-name-ja">${medocRank.nameJa}</div>
                ${nextMedoc ? `
                    <div class="quest-medoc-next">
                        次: <strong>${nextMedoc.name}</strong>（あと${sessionsLeft}セッション）
                    </div>
                    <div class="quest-medoc-progress-wrap">
                        <div class="quest-medoc-progress-bar">
                            <div class="quest-medoc-progress-fill" style="width: ${Math.round(((3 - sessionsLeft) / 3) * 100)}%"></div>
                        </div>
                    </div>
                ` : `<div class="quest-medoc-next" style="color:#C9A94E">🏆 最高位到達！</div>`}
                <div class="quest-medoc-level">Lev. ${medocRank.level} / 65</div>
            </div>

            <!-- Diploma Progress -->
            <div class="quest-diploma-bar">
                <div class="quest-diploma-label">DIPLOMA GOAL</div>
                <div class="quest-diploma-track">
                    <div class="quest-diploma-fill" style="width: ${Math.min(100, (totalTokens / DIPLOMA_THRESHOLD) * 100)}%"></div>
                </div>
                <div class="quest-diploma-text">${totalTokens.toLocaleString()} / ${DIPLOMA_THRESHOLD.toLocaleString()} トークン</div>
            </div>

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

        // TIER CARDS
        html += `<div class="quest-tiers-title">QUEST EXAMINATIONS</div>`;
        TIERS.forEach(tier => {
            const unlocked = isTierUnlocked(tier.id);
            const cleared = isTierCleared(tier.id, questState.questProgress);
            html += renderTierCard(tier, unlocked, cleared);
        });

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
                handleTestAttempt(tierId, testNum);
            });
        });
    }

    // ========== HANDLE TEST ATTEMPT (Fee + Confirmation) ==========
    async function handleTestAttempt(tierId, testNum) {
        const tierConfig = TOKEN_ECONOMY.tiers[tierId];
        if (!tierConfig) return;

        if (tierConfig.unlockType === 'wallet' && tierConfig.unlockCost > 0) {
            const wallet = getWalletBalance();
            const cost = tierConfig.unlockCost;

            if (wallet < cost) {
                showQuestModal(
                    'トークン不足',
                    `受験には${cost.toLocaleString()} トークンが必要です。\n現在のウォレット残高: ${wallet.toLocaleString()} トークン`,
                    [{ text: '戻る', action: 'close' }]
                );
                return;
            }

            // Confirmation modal
            showQuestModal(
                `${tierConfig.titleJa}試験 — 受験確認`,
                `受験料として <strong style="color:#D4002A;font-size:1.2em">${cost.toLocaleString()} トークン</strong> を支払います。\n\n` +
                `🏆 合格すると <strong style="color:#C9A94E">${tierConfig.clearReward.toLocaleString()} トークン</strong> を獲得！\n` +
                `💡 不合格でも正答率に応じてキャッシュバックあり\n\n` +
                `<span style="color:#999;font-size:0.85em">残高: ${wallet.toLocaleString()} トークン → ${(wallet - cost).toLocaleString()} トークン</span>`,
                [
                    { text: 'キャンセル', action: 'close', style: 'secondary' },
                    { text: `${cost.toLocaleString()} トークン支払って挑戦`, action: 'pay', style: 'danger' }
                ],
                async (action) => {
                    if (action === 'pay') {
                        // Record fee payment to GAS
                        questState.pendingFee = cost;
                        try {
                            await fetch(GAS_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'text/plain' },
                                body: JSON.stringify({
                                    action: 'updateWallet',
                                    user_name: questState.currentUser.name,
                                    tx_type: 'quest_fee',
                                    test_id: `${tierId}_${String(testNum).padStart(2, '0')}`,
                                    amount: -cost
                                })
                            });
                            // Update local wallet
                            if (questState.userStats) {
                                questState.userStats.wallet_balance -= cost;
                                questState.userStats.spent_tokens = (questState.userStats.spent_tokens || 0) + cost;
                            }
                        } catch (e) {
                            console.error('[Quest] Fee payment failed:', e);
                        }
                        startQuestTest(tierId, testNum);
                    }
                }
            );
        } else {
            // Free (intermediate) — just start
            questState.pendingFee = 0;
            startQuestTest(tierId, testNum);
        }
    }

    // ========== MODAL ==========
    function showQuestModal(title, message, buttons, callback) {
        const overlay = document.getElementById('questOverlay');
        const existing = overlay.querySelector('.quest-modal-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'quest-modal-backdrop';
        backdrop.innerHTML = `
            <div class="quest-modal">
                <div class="quest-modal-title">${title}</div>
                <div class="quest-modal-body">${message.replace(/\n/g, '<br>')}</div>
                <div class="quest-modal-actions">
                    ${buttons.map(b => `
                        <button class="quest-modal-btn ${b.style || ''}" data-action="${b.action}">${b.text}</button>
                    `).join('')}
                </div>
            </div>
        `;
        overlay.appendChild(backdrop);

        backdrop.querySelectorAll('.quest-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                backdrop.remove();
                if (action !== 'close' && callback) callback(action);
            });
        });
    }

    // ========== RENDER: TIER CARD ==========
    function renderTierCard(tier, unlocked, cleared) {
        const progress = questState.questProgress;
        const totalTokens = getTotalTokens();
        const wallet = getWalletBalance();
        let passedCount = 0;
        let testListHtml = '';

        for (let i = 1; i <= tier.testCount; i++) {
            const testKey = `${tier.id}_${String(i).padStart(2, '0')}`;
            const result = progress[testKey];
            const bestScore = result ? result.bestScore : null;
            const passed = bestScore !== null && bestScore >= Math.ceil(QUEST_QUIZ_COUNT * PASS_THRESHOLD);
            if (passed) passedCount++;

            const testUnlocked = isTestUnlocked(tier.id, i);
            const scoreDisplay = bestScore !== null ? `${bestScore}/${QUEST_QUIZ_COUNT}` : '—';
            const pctDisplay = bestScore !== null ? `${Math.round((bestScore / QUEST_QUIZ_COUNT) * 100)}%` : '';

            let statusClass = 'locked';
            let actionHtml = '';

            if (!unlocked || !testUnlocked) {
                statusClass = 'locked';
                if (tier.id === 'intermediate') {
                    const requiredTokens = i * tier.tokenGateStep;
                    actionHtml = `<span class="quest-test-gate">🔒 累計 ${requiredTokens.toLocaleString()} トークン</span>`;
                }
            } else if (passed && !tier.clearRewardRepeatable) {
                statusClass = 'passed';
                actionHtml = '<span class="quest-test-check">✓</span>';
            } else if (passed && tier.clearRewardRepeatable) {
                // Passed but can replay for tokens
                statusClass = 'passed';
                actionHtml = `
                    <span class="quest-test-check">✓</span>
                    <button class="quest-test-btn quest-test-replay" data-tier="${tier.id}" data-test="${i}">💰 周回</button>
                `;
            } else {
                statusClass = bestScore !== null ? 'attempted' : 'available';
                if (tier.unlockType === 'wallet') {
                    actionHtml = `<button class="quest-test-btn quest-test-pay" data-tier="${tier.id}" data-test="${i}">💰 ${tier.unlockCost.toLocaleString()} トークン</button>`;
                } else {
                    actionHtml = `<button class="quest-test-btn" data-tier="${tier.id}" data-test="${i}">${bestScore !== null ? '再挑戦' : '挑戦'}</button>`;
                }
            }

            testListHtml += `
                <div class="quest-test-row ${statusClass}">
                    <div class="quest-test-num">Test ${i}</div>
                    <div class="quest-test-score">${scoreDisplay}</div>
                    <div class="quest-test-pct ${passed ? 'pass' : ''}">${pctDisplay}</div>
                    <div class="quest-test-action">${actionHtml}</div>
                </div>
            `;
        }

        const progressPct = Math.round((passedCount / tier.testCount) * 100);
        const conditionText = `全${tier.testCount}テスト 90%以上: ${passedCount}/${tier.testCount}`;

        // Tier-specific info
        let tierInfoHtml = '';
        if (tier.unlockType === 'wallet') {
            tierInfoHtml = `
                <div class="quest-tier-economy">
                    <span class="quest-tier-eco-item cost">受験料: ${tier.unlockCost.toLocaleString()} トークン</span>
                    <span class="quest-tier-eco-item reward">報酬: +${tier.clearReward.toLocaleString()} トークン</span>
                    ${tier.cashbackOnFail ? '<span class="quest-tier-eco-item cashback">不合格時は正答率に応じてキャッシュバック</span>' : ''}
                </div>
            `;
        } else {
            tierInfoHtml = `
                <div class="quest-tier-economy">
                    <span class="quest-tier-eco-item free">受験料: 無料</span>
                    <span class="quest-tier-eco-item reward">初回クリア報酬: +${tier.clearReward.toLocaleString()} トークン</span>
                </div>
            `;
        }

        let lockReason = '';
        if (!unlocked) {
            if (tier.id === 'intermediate') {
                lockReason = `累計 ${tier.tokenGateStart.toLocaleString()} トークンでアンロック（現在: ${totalTokens.toLocaleString()} トークン）`;
            } else if (tier.prerequisite) {
                const prereqTier = TIERS.find(t => t.id === tier.prerequisite);
                lockReason = `${prereqTier?.titleJa || '前提ティア'}を全クリアで解放`;
                if (tier.cumulativeGate) {
                    lockReason += ` + 累計 ${tier.cumulativeGate.toLocaleString()} トークン 必要`;
                }
            }
        }

        return `
            <div class="quest-tier-card ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''}" style="--tier-color: ${tier.color}">
                <div class="quest-tier-header">
                    <div class="quest-tier-left">
                        ${!unlocked ? '<span class="quest-tier-lock-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>' : ''}
                        <div>
                            <div class="quest-tier-title">${tier.title}</div>
                            <div class="quest-tier-subtitle">${tier.titleJa} — ${tier.description}</div>
                            ${!unlocked ? `<div class="quest-tier-lock-reason">${lockReason}</div>` : ''}
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
                        ${tierInfoHtml}
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

        questState.userAnswers.push({ selectedIndex, isCorrect, questionData: q });

        body.querySelectorAll('.quest-choice-btn').forEach(b => b.style.pointerEvents = 'none');

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
        const tierConfig = TOKEN_ECONOMY.tiers[questState.currentTier];

        // Calculate token changes
        let tokenDelta = 0;
        let rewardAmount = 0;
        let cashbackAmount = 0;
        let feeAmount = questState.pendingFee;

        if (passed) {
            // Check if first clear (for non-repeatable rewards)
            const testResult = questState.questProgress[questState.currentTestId];
            const isFirstClear = !testResult || !testResult.passed;

            if (tierConfig.clearRewardRepeatable || isFirstClear) {
                rewardAmount = tierConfig.clearReward;
                tokenDelta = rewardAmount;
            }
        } else if (feeAmount > 0 && tierConfig.cashbackOnFail) {
            // Cashback based on score percentage
            cashbackAmount = calculateCashback(feeAmount, correctCount, total);
            tokenDelta = cashbackAmount; // Positive: partial refund
        }

        // Build result HTML
        let tokenResultHtml = '';
        if (feeAmount > 0 || rewardAmount > 0 || cashbackAmount > 0) {
            tokenResultHtml = `<div class="quest-results-token-section">`;
            if (feeAmount > 0) {
                tokenResultHtml += `<div class="quest-token-line fee">受験料: <span>-${feeAmount.toLocaleString()} トークン</span></div>`;
            }
            if (passed && rewardAmount > 0) {
                tokenResultHtml += `<div class="quest-token-line reward">🏆 クリア報酬: <span>+${rewardAmount.toLocaleString()} トークン</span></div>`;
            }
            if (!passed && cashbackAmount > 0) {
                tokenResultHtml += `<div class="quest-token-line cashback">💡 キャッシュバック (${pct}%): <span>+${cashbackAmount.toLocaleString()} トークン</span></div>`;
            }
            const netResult = -feeAmount + (passed ? rewardAmount : cashbackAmount);
            const netColor = netResult >= 0 ? '#C9A94E' : '#D4002A';
            tokenResultHtml += `<div class="quest-token-line net" style="color:${netColor}">純増減: <span>${netResult >= 0 ? '+' : ''}${netResult.toLocaleString()} トークン</span></div>`;
            tokenResultHtml += `</div>`;
        }

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

                ${tokenResultHtml}

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

        document.getElementById('questBackToMain').addEventListener('click', () => {
            openQuest();
        });

        // Save result & reward to GAS
        await saveQuestResult(correctCount, total, tokenDelta);

        // Record reward/cashback transaction if applicable
        if (passed && rewardAmount > 0) {
            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'updateWallet',
                        user_name: questState.currentUser.name,
                        tx_type: 'quest_reward',
                        test_id: questState.currentTestId,
                        amount: rewardAmount
                    })
                });
            } catch (e) {
                console.warn('[Quest] Reward save failed:', e);
            }
        } else if (!passed && cashbackAmount > 0) {
            try {
                await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({
                        action: 'updateWallet',
                        user_name: questState.currentUser.name,
                        tx_type: 'quest_cashback',
                        test_id: questState.currentTestId,
                        amount: cashbackAmount
                    })
                });
            } catch (e) {
                console.warn('[Quest] Cashback save failed:', e);
            }
        }

        // Reset pending fee
        questState.pendingFee = 0;
    }

    // ========== SAVE RESULT ==========
    async function saveQuestResult(score, total, tokenDelta) {
        const testKey = questState.currentTestId;
        const userName = questState.currentUser?.name || '';
        if (!userName || !testKey) return;

        const existing = questState.questProgress[testKey];
        if (!existing || score > existing.bestScore) {
            questState.questProgress[testKey] = { bestScore: score, total: total, passed: score >= Math.ceil(total * PASS_THRESHOLD) };
        }

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
                    token_delta: tokenDelta,
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
