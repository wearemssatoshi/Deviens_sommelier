/**
 * SOMMELIER PRO — Learning Dashboard v1.1.0
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

        overlay.classList.remove('hidden');
        dashboardOpen = true;

        // Stage-Gate: require auth
        DSMAuth.requireAuth(async (user) => {
            renderLoading();
            // Wait for dynamic photo metadata to be ready
            if (typeof userMetaReady !== 'undefined') {
                await userMetaReady;
            }
            fetchDetailedStats(user.name);
        });
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
                <div class="dash-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg></div>
                <h3>まだログインしていません</h3>
                <p>クイズを受験してから、ダッシュボードをご確認ください</p>
            </div>
        `;
    }

    function renderError(msg) {
        const body = document.getElementById('dashBody');
        body.innerHTML = `
            <div class="dash-empty">
                <div class="dash-empty-icon"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg></div>
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
        const totalTokens = d.total_tokens || parseInt(localStorage.getItem('sommelier_total_tokens') || '0', 10);
        const walletBalance = d.wallet_balance || totalTokens;
        const sessionCount = d.session_count || 0;

        // Médoc rank calculation (uses global from medoc_ranks.js)
        const medocRank = (typeof getMedocRank === 'function') ? getMedocRank(sessionCount) : null;
        const nextMedoc = (typeof getNextMedocRank === 'function') ? getNextMedocRank(sessionCount) : null;
        const sessionsLeft = (typeof sessionsToNextRank === 'function') ? sessionsToNextRank(sessionCount) : 0;
        const diplomaThreshold = (typeof TOKEN_ECONOMY !== 'undefined') ? TOKEN_ECONOMY.diplomaThreshold : 100000;

        // Pair sessions HTML
        let pairHtml = '';
        if (d.pair_sessions && d.pair_sessions.length > 0) {
            pairHtml = `
                <div class="dash-section">
                    <div class="dash-section-title">PAIR LEARNING</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        ${d.pair_sessions.map(p => `
                            <div style="display:flex; align-items:center; gap:6px; background:#f8f4eb; border:1px solid #e8d5a3; border-radius:8px; padding:6px 12px;">
                                ${typeof SOMMELIER_USERS !== 'undefined' && SOMMELIER_USERS[p.name]?.photo 
                                    ? `<img src="${SOMMELIER_USERS[p.name].photo}" alt="${p.name}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid #D4B861;">` 
                                    : `<span style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#C9A94E,#D4B861); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;">${p.name.charAt(0)}</span>`
                                }
                                <div>
                                    <div style="font-weight:600; font-size:13px;">${p.name}</div>
                                    <div style="font-size:11px; color:#8B6914;">${p.count}回ペア学習</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        body.innerHTML = `
            <!-- Header -->
            <div class="dash-user-header">
                <div class="dash-avatar-wrap" id="dashAvatarWrap">
                    <span class="dash-user-avatar" style="overflow:hidden" id="dashUserAvatar">
                        ${typeof SOMMELIER_USERS !== 'undefined' && SOMMELIER_USERS[d.user_name]?.photo
                            ? `<img src="${SOMMELIER_USERS[d.user_name].photo}" alt="${d.user_name}" style="width:100%;height:100%;object-fit:cover;">`
                            : (d.user_name || '?').charAt(0)}
                    </span>
                    <button class="dash-avatar-edit-btn" id="dashAvatarEditBtn" title="写真を変更">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </button>
                    <input type="file" accept="image/*" id="dashPhotoInput" style="display:none">
                </div>
                <div class="dash-user-info">
                    <div class="dash-user-name">${d.user_name}</div>
                    <div class="dash-user-sub">Learning Analytics</div>
                </div>
            </div>

            <!-- Wallet & Tracker -->
            <div class="dash-wallet-bar">
                <div class="dash-wallet-box wallet">
                    <div class="dash-wallet-title">WALLET BALANCE</div>
                    <div class="dash-wallet-val">${walletBalance.toLocaleString()} <span class="dash-wallet-unit">トークン</span></div>
                </div>
                <div class="dash-wallet-box earn">
                    <div class="dash-wallet-title">TOTAL EARNED</div>
                    <div class="dash-wallet-val">${totalTokens.toLocaleString()} <span class="dash-wallet-unit">トークン</span></div>
                </div>
            </div>

            <!-- Médoc Status -->
            <div class="dash-medoc-hero">
                <div class="dash-medoc-grade">${medocRank ? medocRank.gradeJa : ''} <span class="dash-medoc-level">Lev. ${medocRank ? medocRank.level : 0} / ${medocRank && medocRank.hidden ? '???' : '65'}</span></div>
                <div class="dash-medoc-name">${medocRank ? medocRank.name : ''}</div>
                <div class="dash-medoc-ja">${medocRank ? medocRank.nameJa : ''}</div>

                ${nextMedoc ? `
                    <div class="dash-medoc-next">
                        <div class="dash-medoc-next-text">${nextMedoc.hidden ? '???' : '次まであと'} <strong>${sessionsLeft}</strong> セッション${nextMedoc.hidden ? '' : `（${nextMedoc.name}）`}</div>
                        <div class="dash-medoc-progress">
                            <div class="dash-medoc-fill" style="width: ${Math.round(((3 - sessionsLeft) / 3) * 100)}%"></div>
                        </div>
                    </div>
                ` : `<div class="dash-medoc-next"><div class="dash-medoc-next-text" style="color:var(--gold-primary)">${medocRank && medocRank.level >= 75 ? '&#127942; 伝説に到達しました' : '&#127942; 最高位に到達しました！'}</div></div>`}
            </div>

            <div class="dash-diploma-track">
                <div class="dash-diploma-title">Resident Sommelier Diploma</div>
                <div class="dash-diploma-bar">
                    <div class="dash-diploma-fill" style="width: ${Math.min(100, (totalTokens / diplomaThreshold) * 100)}%"></div>
                </div>
                <div class="dash-diploma-status">${totalTokens.toLocaleString()} / ${diplomaThreshold.toLocaleString()} トークン</div>
            </div>

            <!-- LEARN to EARN -->
            <div class="dash-section" style="margin-top:16px;">
                <div class="dash-section-title">LEARN to EARN <span style="font-weight:400; font-size:10px; opacity:0.5; margin-left:6px;">Gamification</span></div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px;">
                    <div style="background:linear-gradient(145deg,#2a0a0f,#4a1525,#3d1020); border:1px solid rgba(139,69,80,0.3); border-radius:12px; padding:16px; color:#fff; text-align:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="opacity:0.5; margin-bottom:8px;"><path d="M8 22h8"/><path d="M12 11v11"/><path d="M20 3H4l1.86 7.43A4.64 4.64 0 0 0 10.38 14h3.24a4.64 4.64 0 0 0 4.52-3.57z"/></svg>
                        <div style="font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:700; margin-bottom:6px; line-height:1.4;">クイズを極めて<br>メドックの頂へ！</div>
                        <div style="font-size:10.5px; opacity:0.55; line-height:1.6;">3セッションごとにメドック格付けが昇格。全65階級を駆け上がり、第1級ラフィットの頂を目指そう。</div>
                    </div>
                    <div style="background:linear-gradient(145deg,#2a0a0f,#4a1525,#3d1020); border:1px solid rgba(139,69,80,0.3); border-radius:12px; padding:16px; color:#fff; text-align:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="opacity:0.5; margin-bottom:8px;"><path d="M8 22h8"/><path d="M12 11v11"/><path d="M20 3H4l1.86 7.43A4.64 4.64 0 0 0 10.38 14h3.24a4.64 4.64 0 0 0 4.52-3.57z"/></svg>
                        <div style="font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:700; margin-bottom:6px; line-height:1.4;">トークンを貯めて<br>ディプロマを目指そう！</div>
                        <div style="font-size:10.5px; opacity:0.55; line-height:1.6;">クイズ正解でトークン獲得。100,000トークンに到達すると Resident Sommelier Diploma を授与。</div>
                    </div>
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
                    <span class="dash-streak-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#F5A623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7.5 1 1.5 1.5 3.5 1 5.5-.5 1.93.5 3 1.5 3 2 0 3 1.5 3 3.5a5 5 0 0 1-10 1.5"/></svg></span>
                    <span class="dash-streak-num">${d.streak}</span>
                    <span class="dash-streak-label">日連続</span>
                </div>
                <div class="dash-streak-divider"></div>
                <div class="dash-streak-item">
                    <span class="dash-streak-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="#C9A94E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>
                    <span class="dash-streak-num">${d.best_streak}</span>
                    <span class="dash-streak-label">最高記録</span>
                </div>
            </div>

            <!-- Pair Sessions -->
            ${pairHtml}

            <!-- Daily Trend -->
            ${renderDailyTrend(d.daily_trend)}

            <!-- Chapter Heatmap -->
            ${renderChapterStats(d.chapter_stats)}

            <!-- Weakness Analysis -->
            ${renderWeaknessAnalysis(d.chapter_stats)}

            <!-- Logout -->
            <div class="dash-logout-row">
                <button class="dash-logout-btn" id="dashLogoutBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    ログアウト
                </button>
            </div>
        `;

        // Logout handler
        const logoutBtn = document.getElementById('dashLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                DSMAuth.logout();
                DSMToast.info('ログアウトしました');
                setTimeout(() => window.location.reload(), 800);
            });
        }

        // Photo upload handler
        const avatarEditBtn = document.getElementById('dashAvatarEditBtn');
        const photoInput = document.getElementById('dashPhotoInput');
        if (avatarEditBtn && photoInput) {
            avatarEditBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                resizeAndUploadPhoto(file, d.user_name);
            });
        }

        // ========== PREMIUM TOKEN: Odometer Count-Up + Particles ==========
        const odo = document.getElementById('tokenOdometer');
        if (odo) {
            const target = parseInt(odo.dataset.target, 10) || 0;
            if (target > 0) {
                const duration = 1200;
                const start = performance.now();
                const step = (now) => {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                    odo.textContent = Math.round(target * eased).toLocaleString();
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        odo.textContent = target.toLocaleString();
                        odo.classList.add('counting');
                        spawnTokenParticles();
                    }
                };
                requestAnimationFrame(step);
            } else {
                odo.textContent = '0';
            }
        }

        function spawnTokenParticles() {
            const container = document.getElementById('tokenParticles');
            if (!container) return;
            const fragments = ['+T', '✦', '◆', '★', '+T'];
            for (let i = 0; i < 8; i++) {
                const p = document.createElement('span');
                p.className = 'token-particle';
                p.textContent = fragments[i % fragments.length];
                p.style.left = (15 + Math.random() * 70) + '%';
                p.style.top = (40 + Math.random() * 30) + '%';
                p.style.fontSize = (12 + Math.random() * 8) + 'px';
                p.style.animationDelay = (i * 0.12) + 's';
                container.appendChild(p);
            }
            setTimeout(() => { container.innerHTML = ''; }, 2500);
        }
    }

    // ========== PHOTO UPLOAD (Canvas 256x256, JPEG 70%) ==========
    function resizeAndUploadPhoto(file, userName) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');

                // Center-crop to square
                const size = Math.min(img.width, img.height);
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);

                const base64 = canvas.toDataURL('image/jpeg', 0.7);

                // Show preview immediately
                const avatar = document.getElementById('dashUserAvatar');
                if (avatar) {
                    avatar.innerHTML = `<img src="${base64}" alt="${userName}" style="width:100%;height:100%;object-fit:cover;">`;
                }

                // Save to GAS
                DSMToast.info('写真を保存中...');
                fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'updateUserMeta',
                        user_name: userName,
                        photo: base64
                    })
                })
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') {
                        DSMToast.success('写真を保存しました');
                        // Update live data & nav avatar
                        if (typeof SOMMELIER_USERS !== 'undefined') {
                            if (!SOMMELIER_USERS[userName]) SOMMELIER_USERS[userName] = {};
                            SOMMELIER_USERS[userName].photo = base64;
                        }
                        if (typeof updateNavAvatar === 'function') updateNavAvatar();
                    } else {
                        DSMToast.error('保存に失敗しました');
                    }
                })
                .catch(() => DSMToast.error('サーバーに接続できません'));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
                        <span class="dash-congrats-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#C9A94E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg></span>
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
