/**
 * SOMMELIER PRO — Learning Dashboard v1.0
 * 学習進捗ダッシュボード（個人の弱点分析・日別推移・ストリーク）
 */

(function() {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";

    let dashboardOpen = false;
    let dashboardData = null;

    // ========== INIT ==========
    function init() {
        // Listen for bottom-nav trigger
        document.addEventListener('dashboard:open', openDashboard);
        
        // Close button
        const closeBtn = document.querySelector('.dash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDashboard);
        }
    }

    // ========== OPEN / CLOSE ==========
    function openDashboard() {
        const overlay = document.getElementById('dashOverlay');
        if (!overlay) return;

        // Get current user from quiz state
        const savedUser = localStorage.getItem('sommelier_quiz_user');
        let user = null;
        try { user = JSON.parse(savedUser); } catch(e) {}

        if (!user) {
            overlay.classList.remove('hidden');
            dashboardOpen = true;
            renderNoUser();
            return;
        }

        overlay.classList.remove('hidden');
        dashboardOpen = true;
        renderLoading();
        fetchDetailedStats(user.name);
    }

    function closeDashboard() {
        const overlay = document.getElementById('dashOverlay');
        if (overlay) overlay.classList.add('hidden');
        dashboardOpen = false;
        // Reset bottom nav to home
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('navHome')?.classList.add('active');
    }

    // ========== FETCH DATA ==========
    async function fetchDetailedStats(userName) {
        try {
            const res = await fetch(`${GAS_URL}?action=getDetailedStats&user_name=${encodeURIComponent(userName)}`);
            const data = await res.json();
            if (data.status === 'success') {
                dashboardData = data.data;
                renderDashboard();
            } else {
                renderError('データの取得に失敗しました');
            }
        } catch (e) {
            console.error('[Dashboard] Fetch error:', e);
            renderError('サーバーへの接続に失敗しました');
        }
    }

    // ========== RENDER STATES ==========
    function renderLoading() {
        const body = document.getElementById('dashBody');
        body.innerHTML = `
            <div class="dash-loading">
                <div class="quiz-spinner"></div>
                <p>学習データを分析中...</p>
            </div>
        `;
    }

    function renderNoUser() {
        const body = document.getElementById('dashBody');
        body.innerHTML = `
            <div class="dash-empty">
                <div class="dash-empty-icon">📊</div>
                <h3>まだログインしていません</h3>
                <p>クイズを受験してから、ダッシュボードをご確認ください</p>
            </div>
        `;
    }

    function renderError(msg) {
        const body = document.getElementById('dashBody');
        body.innerHTML = `
            <div class="dash-empty">
                <div class="dash-empty-icon">⚠️</div>
                <h3>エラー</h3>
                <p>${msg}</p>
            </div>
        `;
    }

    // ========== RENDER DASHBOARD ==========
    function renderDashboard() {
        const d = dashboardData;
        const body = document.getElementById('dashBody');

        const accuracy = d.accuracy || 0;
        const accuracyColor = accuracy >= 80 ? '#00B36B' : accuracy >= 50 ? '#F5A623' : '#D4002A';
        const ringPercent = accuracy;

        body.innerHTML = `
            <!-- Header -->
            <div class="dash-user-header">
                <span class="dash-user-avatar">${(d.user_name || '?').charAt(0)}</span>
                <div class="dash-user-info">
                    <div class="dash-user-name">${d.user_name}</div>
                    <div class="dash-user-sub">Learning Analytics</div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="dash-kpi-grid">
                <div class="dash-kpi-card">
                    <div class="dash-kpi-ring" style="--percent:${ringPercent}; --ring-color:${accuracyColor}">
                        <svg viewBox="0 0 36 36">
                            <path class="dash-ring-bg" d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="dash-ring-fill" stroke="${accuracyColor}"
                                stroke-dasharray="${ringPercent}, 100"
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        </svg>
                        <span class="dash-ring-label" style="color:${accuracyColor}">${accuracy}%</span>
                    </div>
                    <div class="dash-kpi-title">正答率</div>
                </div>
                <div class="dash-kpi-card">
                    <div class="dash-kpi-value">${d.distinct_days}</div>
                    <div class="dash-kpi-title">学習日数</div>
                </div>
                <div class="dash-kpi-card">
                    <div class="dash-kpi-value">${d.session_count}</div>
                    <div class="dash-kpi-title">セッション</div>
                </div>
                <div class="dash-kpi-card">
                    <div class="dash-kpi-value">${d.total_questions}</div>
                    <div class="dash-kpi-title">総問題数</div>
                </div>
            </div>

            <!-- Streak -->
            <div class="dash-streak-bar">
                <div class="dash-streak-item">
                    <span class="dash-streak-icon">🔥</span>
                    <span class="dash-streak-num">${d.streak}</span>
                    <span class="dash-streak-label">日連続</span>
                </div>
                <div class="dash-streak-divider"></div>
                <div class="dash-streak-item">
                    <span class="dash-streak-icon">🏆</span>
                    <span class="dash-streak-num">${d.best_streak}</span>
                    <span class="dash-streak-label">最高記録</span>
                </div>
            </div>

            <!-- Daily Trend -->
            ${renderDailyTrend(d.daily_trend)}

            <!-- Chapter Heatmap -->
            ${renderChapterStats(d.chapter_stats)}

            <!-- Weakness Analysis -->
            ${renderWeaknessAnalysis(d.chapter_stats)}
        `;
    }

    // ========== DAILY TREND CHART ==========
    function renderDailyTrend(trend) {
        if (!trend || trend.length === 0) {
            return `
                <div class="dash-section">
                    <div class="dash-section-title">DAILY TREND</div>
                    <div class="dash-empty-mini">まだデータがありません</div>
                </div>
            `;
        }

        const maxSessions = Math.max(...trend.map(t => t.sessions), 1);

        const bars = trend.map(t => {
            const height = Math.max((t.accuracy / 100) * 100, 4);
            const barColor = t.accuracy >= 80 ? '#00B36B' : t.accuracy >= 50 ? '#F5A623' : '#D4002A';
            const dateLabel = t.date.slice(5); // MM-DD
            return `
                <div class="dash-trend-col" title="${t.date}: ${t.accuracy}% (${t.score}/${t.total})">
                    <div class="dash-trend-bar-wrap">
                        <div class="dash-trend-bar" style="height:${height}%; background:${barColor}"></div>
                    </div>
                    <div class="dash-trend-date">${dateLabel}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="dash-section">
                <div class="dash-section-title">DAILY TREND</div>
                <div class="dash-trend-chart">${bars}</div>
                <div class="dash-trend-legend">
                    <span class="dash-legend-item"><span class="dash-legend-dot" style="background:#00B36B"></span>80%+</span>
                    <span class="dash-legend-item"><span class="dash-legend-dot" style="background:#F5A623"></span>50-79%</span>
                    <span class="dash-legend-item"><span class="dash-legend-dot" style="background:#D4002A"></span>~49%</span>
                </div>
            </div>
        `;
    }

    // ========== CHAPTER STATS ==========
    function renderChapterStats(chapters) {
        if (!chapters || chapters.length === 0) {
            return `
                <div class="dash-section">
                    <div class="dash-section-title">CHAPTER ANALYSIS</div>
                    <div class="dash-empty-mini">まだ受験したチャプターがありません</div>
                </div>
            `;
        }

        // Sort by accuracy descending for display
        const sorted = [...chapters].sort((a, b) => b.accuracy - a.accuracy);

        const rows = sorted.map(ch => {
            const barWidth = ch.accuracy;
            const barColor = ch.accuracy >= 80 ? '#00B36B' : ch.accuracy >= 50 ? '#F5A623' : '#D4002A';
            const shortTitle = ch.chapter_title.length > 20 ? ch.chapter_title.slice(0, 20) + '…' : ch.chapter_title;

            return `
                <div class="dash-chapter-row">
                    <div class="dash-chapter-name" title="${ch.chapter_title}">${shortTitle}</div>
                    <div class="dash-chapter-bar-wrap">
                        <div class="dash-chapter-bar" style="width:${barWidth}%; background:${barColor}"></div>
                    </div>
                    <div class="dash-chapter-pct" style="color:${barColor}">${ch.accuracy}%</div>
                    <div class="dash-chapter-detail">${ch.score}/${ch.total} (${ch.attempts}回)</div>
                </div>
            `;
        }).join('');

        return `
            <div class="dash-section">
                <div class="dash-section-title">CHAPTER ANALYSIS</div>
                ${rows}
            </div>
        `;
    }

    // ========== WEAKNESS ANALYSIS ==========
    function renderWeaknessAnalysis(chapters) {
        if (!chapters || chapters.length === 0) return '';

        // Chapters sorted by accuracy ascending (weakest first), take top 3
        const weakest = chapters.filter(c => c.accuracy < 80).slice(0, 3);

        if (weakest.length === 0) {
            return `
                <div class="dash-section">
                    <div class="dash-section-title">IMPROVEMENT AREAS</div>
                    <div class="dash-congrats">
                        <span class="dash-congrats-icon">🎉</span>
                        <p>全チャプターで80%以上を達成しています！</p>
                    </div>
                </div>
            `;
        }

        const items = weakest.map((ch, i) => {
            const priority = i === 0 ? 'HIGH' : i === 1 ? 'MEDIUM' : 'LOW';
            const priorityColor = i === 0 ? '#D4002A' : i === 1 ? '#F5A623' : '#999';

            return `
                <div class="dash-weakness-card">
                    <div class="dash-weakness-header">
                        <span class="dash-weakness-priority" style="color:${priorityColor}">${priority}</span>
                        <span class="dash-weakness-accuracy">${ch.accuracy}%</span>
                    </div>
                    <div class="dash-weakness-title">${ch.chapter_title}</div>
                    <div class="dash-weakness-meta">${ch.score}/${ch.total} 正解 · ${ch.attempts}回受験</div>
                    <div class="dash-weakness-tip">このチャプターの復習を重点的に行いましょう</div>
                </div>
            `;
        }).join('');

        return `
            <div class="dash-section">
                <div class="dash-section-title">IMPROVEMENT AREAS</div>
                ${items}
            </div>
        `;
    }

    // ========== BOOT ==========
    document.addEventListener("DOMContentLoaded", init);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dashboardOpen) closeDashboard();
    });

})();
