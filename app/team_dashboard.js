/**
 * DEVIENS SOMMELIER — Team Analytics Dashboard v1.0
 * Manager-only view: Hidden Access via long-press on brand logo
 * 
 * Provides:
 *  - Team KPI overview (tokens, active members, accuracy)
 *  - Leaderboards (Effort, Consistency, Quality)
 *  - Full staff roster with sort/search
 */

(function() {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";
    const MANAGER_PIN = '7777';
    const LONG_PRESS_MS = 1500;

    let teamData = null;
    let isOpen = false;
    let longPressTimer = null;

    // ========== HIDDEN ACCESS (Long Press on Brand Logo) ==========
    function initHiddenAccess() {
        const brand = document.querySelector('.header-brand');
        if (!brand) return;

        brand.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => showPinModal(), LONG_PRESS_MS);
        }, { passive: true });
        brand.addEventListener('touchend', () => clearTimeout(longPressTimer));
        brand.addEventListener('touchmove', () => clearTimeout(longPressTimer));

        // Desktop: mousedown
        brand.addEventListener('mousedown', () => {
            longPressTimer = setTimeout(() => showPinModal(), LONG_PRESS_MS);
        });
        brand.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        brand.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
    }

    // ========== PIN MODAL ==========
    function showPinModal() {
        // Remove any existing
        document.getElementById('teamPinModal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'teamPinModal';
        modal.className = 'team-pin-overlay';
        modal.innerHTML = `
            <div class="team-pin-card">
                <div class="team-pin-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#C9A94E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <h3>Manager Access</h3>
                    <p>PINコードを入力してください</p>
                </div>
                <div class="team-pin-field">
                    <input type="password" id="teamPinInput" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••" autocomplete="off">
                </div>
                <p class="team-pin-error hidden" id="teamPinError">PINが正しくありません</p>
                <div class="team-pin-actions">
                    <button class="team-pin-cancel" id="teamPinCancel">キャンセル</button>
                    <button class="team-pin-submit" id="teamPinSubmit">アクセス</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = document.getElementById('teamPinInput');
        setTimeout(() => input.focus(), 100);

        document.getElementById('teamPinCancel').addEventListener('click', () => modal.remove());
        document.getElementById('teamPinSubmit').addEventListener('click', () => handlePinSubmit(modal));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handlePinSubmit(modal);
        });
    }

    function handlePinSubmit(modal) {
        const pin = document.getElementById('teamPinInput').value;
        if (pin === MANAGER_PIN) {
            modal.remove();
            openTeamDashboard();
        } else {
            document.getElementById('teamPinError').classList.remove('hidden');
            document.getElementById('teamPinInput').value = '';
            document.getElementById('teamPinInput').focus();
        }
    }

    // ========== OPEN / CLOSE ==========
    function openTeamDashboard() {
        const overlay = document.getElementById('teamDashOverlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        isOpen = true;
        renderLoading();
        fetchTeamData();
    }

    function closeTeamDashboard() {
        const overlay = document.getElementById('teamDashOverlay');
        if (overlay) overlay.classList.add('hidden');
        isOpen = false;
    }

    // ========== FETCH ==========
    async function fetchTeamData() {
        try {
            const res = await fetch(`${GAS_URL}?action=getTeamAnalytics`);
            const json = await res.json();
            if (json.status === 'success') {
                teamData = json.data;
                renderTeamDashboard();
            } else {
                renderError('サーバーエラー: ' + (json.message || ''));
            }
        } catch (e) {
            console.error('[TeamDash] Fetch error:', e);
            renderError('接続に失敗しました');
        }
    }

    // ========== RENDER STATES ==========
    function renderLoading() {
        getBody().innerHTML = `
            <div class="td-loading">
                <div class="quiz-spinner"></div>
                <p>チームデータを集計中...</p>
            </div>
        `;
    }

    function renderError(msg) {
        getBody().innerHTML = `
            <div class="td-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="#D4002A" stroke-width="1.5" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                <h3>エラー</h3>
                <p>${msg}</p>
            </div>
        `;
    }

    function getBody() {
        return document.getElementById('teamDashBody');
    }

    // ========== MAIN RENDER ==========
    function renderTeamDashboard() {
        const d = teamData;
        const s = d.team_summary;
        const members = d.members || [];

        // Sort helpers
        const byTokens = [...members].sort((a, b) => b.total_tokens - a.total_tokens);
        const byDays = [...members].sort((a, b) => b.distinct_days - a.distinct_days);
        const byAccuracy = [...members].filter(m => m.total_questions >= 10).sort((a, b) => b.accuracy - a.accuracy);

        getBody().innerHTML = `
            <!-- Header -->
            <div class="td-header">
                <div class="td-header-top">
                    <div>
                        <div class="td-title">Team Analytics</div>
                        <div class="td-subtitle">Deviens sommelier — Manager View</div>
                    </div>
                    <div class="td-timestamp">${d.generated_at || ''}</div>
                </div>
            </div>

            <!-- Team KPI -->
            <div class="td-kpi-grid">
                <div class="td-kpi-card td-kpi-accent">
                    <div class="td-kpi-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                    </div>
                    <div class="td-kpi-num">${s.team_tokens.toLocaleString()}<span class="td-kpi-unit">T</span></div>
                    <div class="td-kpi-label">TEAM TOKENS</div>
                </div>
                <div class="td-kpi-card">
                    <div class="td-kpi-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div class="td-kpi-num">${s.active_members}<span class="td-kpi-unit">/ ${s.total_members}</span></div>
                    <div class="td-kpi-label">ACTIVE LEARNERS</div>
                </div>
                <div class="td-kpi-card">
                    <div class="td-kpi-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    </div>
                    <div class="td-kpi-num">${s.team_accuracy}<span class="td-kpi-unit">%</span></div>
                    <div class="td-kpi-label">TEAM ACCURACY</div>
                </div>
                <div class="td-kpi-card">
                    <div class="td-kpi-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </div>
                    <div class="td-kpi-num">${s.team_questions.toLocaleString()}</div>
                    <div class="td-kpi-label">TOTAL QUESTIONS</div>
                </div>
            </div>

            <!-- Leaderboards -->
            <div class="td-leaderboards">
                ${renderLeaderboard('🪙 EFFORT', 'トークン獲得数', byTokens.slice(0, 5), m => `${m.total_tokens.toLocaleString()}T`, 'token')}
                ${renderLeaderboard('🔥 CONSISTENCY', '学習日数', byDays.slice(0, 5), m => `${m.distinct_days}日`, 'day')}
                ${renderLeaderboard('🎯 QUALITY', '正答率 (10問以上)', byAccuracy.slice(0, 5), m => `${m.accuracy}%`, 'accuracy')}
            </div>

            <!-- Staff Roster -->
            <div class="td-section">
                <div class="td-section-header">
                    <div class="td-section-title">ALL MEMBERS</div>
                    <input type="text" class="td-search" id="tdRosterSearch" placeholder="名前で検索..." autocomplete="off">
                </div>
                <div class="td-roster" id="tdRoster">
                    ${renderRoster(members)}
                </div>
            </div>
        `;

        // Close button handler
        document.getElementById('teamDashClose')?.addEventListener('click', closeTeamDashboard);

        // Search handler
        document.getElementById('tdRosterSearch')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = q ? members.filter(m => m.name.toLowerCase().includes(q)) : members;
            document.getElementById('tdRoster').innerHTML = renderRoster(filtered);
        });
    }

    // ========== LEADERBOARD ==========
    function renderLeaderboard(title, subtitle, items, valueFn, type) {
        if (items.length === 0) {
            return `
                <div class="td-lb-card">
                    <div class="td-lb-title">${title}</div>
                    <div class="td-lb-subtitle">${subtitle}</div>
                    <div class="td-lb-empty">データなし</div>
                </div>
            `;
        }

        const medals = ['🥇', '🥈', '🥉', '4', '5'];
        const rows = items.map((m, i) => {
            const medal = i < 3 ? `<span class="td-lb-medal">${medals[i]}</span>` : `<span class="td-lb-rank">${medals[i]}</span>`;
            const avatar = getAvatar(m.name, 28);
            return `
                <div class="td-lb-row ${i === 0 ? 'td-lb-row-first' : ''}">
                    ${medal}
                    ${avatar}
                    <span class="td-lb-name">${m.name}</span>
                    <span class="td-lb-value td-lb-${type}">${valueFn(m)}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="td-lb-card">
                <div class="td-lb-title">${title}</div>
                <div class="td-lb-subtitle">${subtitle}</div>
                ${rows}
            </div>
        `;
    }

    // ========== ROSTER ==========
    function renderRoster(members) {
        const sorted = [...members].sort((a, b) => b.total_tokens - a.total_tokens);

        const rows = sorted.map(m => {
            const avatar = getAvatar(m.name, 32);
            const accColor = m.accuracy >= 80 ? '#00B36B' : m.accuracy >= 50 ? '#F5A623' : m.total_questions > 0 ? '#D4002A' : '#ccc';
            const lastActive = m.last_active ? formatRelativeDate(m.last_active) : '—';
            const streakBadge = m.streak > 0 ? `<span class="td-streak-badge">${m.streak}日</span>` : '';

            return `
                <div class="td-roster-row">
                    <div class="td-roster-user">
                        ${avatar}
                        <div class="td-roster-info">
                            <div class="td-roster-name">${m.name}</div>
                            <div class="td-roster-sub">${lastActive} ${streakBadge}</div>
                        </div>
                    </div>
                    <div class="td-roster-stats">
                        <div class="td-roster-stat">
                            <span class="td-roster-stat-num" style="color:${accColor}">${m.accuracy}%</span>
                            <span class="td-roster-stat-label">正答率</span>
                        </div>
                        <div class="td-roster-stat">
                            <span class="td-roster-stat-num">${m.total_tokens.toLocaleString()}</span>
                            <span class="td-roster-stat-label">T</span>
                        </div>
                        <div class="td-roster-stat">
                            <span class="td-roster-stat-num">${m.distinct_days}</span>
                            <span class="td-roster-stat-label">日</span>
                        </div>
                        <div class="td-roster-stat">
                            <span class="td-roster-stat-num">${m.session_count}</span>
                            <span class="td-roster-stat-label">回</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return rows || '<div class="td-lb-empty">該当なし</div>';
    }

    // ========== HELPERS ==========
    function getAvatar(name, size) {
        if (typeof SOMMELIER_USERS !== 'undefined' && SOMMELIER_USERS[name]?.photo) {
            return `<img src="${SOMMELIER_USERS[name].photo}" alt="${name}" class="td-avatar" style="width:${size}px;height:${size}px;">`;
        }
        return `<span class="td-avatar td-avatar-fallback" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px;">${(name || '?').charAt(0)}</span>`;
    }

    function formatRelativeDate(dateStr) {
        if (!dateStr) return '';
        const now = new Date();
        const jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const target = new Date(dateStr + 'T00:00:00+09:00');
        const diffDays = Math.floor((jstNow - target) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今日';
        if (diffDays === 1) return '昨日';
        if (diffDays < 7) return `${diffDays}日前`;
        return dateStr.slice(5); // MM-DD
    }

    // ========== BOOT ==========
    document.addEventListener('DOMContentLoaded', () => {
        initHiddenAccess();

        // Close button
        document.getElementById('teamDashClose')?.addEventListener('click', closeTeamDashboard);
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closeTeamDashboard();
    });

})();
