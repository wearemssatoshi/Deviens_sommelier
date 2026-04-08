/**
 * SOMMELIER PRO — Application Logic
 * NewsPicks Feature-style UI with correct wine terminology accents
 */

// ---- DATA PATH ----
const SUMMARY_INDEX = '../data/summaries/summary_index.json';

// ---- CATEGORIES (No emoji icons — clean text only) ----
const CATEGORIES = [
    { id: 'ALL', label: 'すべて' },
    { id: 'FOUNDATION', label: '基礎概論' },
    { id: 'ASIA_OCEANIA', label: 'アジア・オセアニア' },
    { id: 'EUROPE_MAJOR', label: 'ヨーロッパ' },
    { id: 'AMERICAS', label: 'アメリカ大陸' },
    { id: 'EUROPE_MINOR', label: '中東欧・その他' },
    { id: 'AFRICA', label: 'アフリカ' },
    { id: 'PROFESSIONAL', label: 'プロフェッショナル' },
    { id: 'UPDATE_2025', label: '2025最新版' },
    { id: 'WSET', label: 'WSET' },
];

// ---- CATEGORY LABELS ----
const CATEGORY_LABELS = {
    'FOUNDATION': '基礎概論',
    'ASIA_OCEANIA': 'アジア・オセアニア',
    'EUROPE_MAJOR': 'ヨーロッパ',
    'AMERICAS': 'アメリカ大陸',
    'EUROPE_MINOR': '中東欧・その他',
    'AFRICA': 'アフリカ',
    'PROFESSIONAL': 'プロフェッショナル',
    'UPDATE_2025': '2025最新版',
    'WSET': 'WSET',
};

// ---- CARD THUMBNAIL IMAGES ----
const THUMB_IMAGES = {
    'ch00_wine_overview':          'url(img/thumb_wine_overview.png)',
    'ch01_spirits_overview':       'url(img/thumb_spirits.png)',
    'ch02_beverages_overview':     'url(img/thumb_beverages.png)',
    'ch03_japan':                  'url(img/thumb_japan.png)',
    'ch04_australia_nz':           'url(img/thumb_australia.png)',
    'ch05_france':                 'url(img/thumb_france.png)',
    'ch06_italy':                  'url(img/thumb_italy.png)',
    'ch07_spain':                  'url(img/thumb_spain.png)',
    'ch08_germany':                'url(img/thumb_germany.png)',
    'ch09_portugal':               'url(img/thumb_portugal.png)',
    'ch10_usa':                    'url(img/thumb_usa.png)',
    'ch11_chile':                  'url(img/thumb_chile.png)',
    'ch12_south_america':          'url(img/thumb_argentina.png)',
    'ch13_canada':                 'url(img/thumb_canada.png)',
    'ch14_austria':                'url(img/thumb_austria.png)',
    'ch15_hungary':                'url(img/thumb_hungary.png)',
    'ch16_central_eastern_europe': 'url(img/thumb_central_europe.png)',
    'ch17_greece_georgia':         'url(img/thumb_greece_georgia.png)',
    'ch18_switzerland_uk':         'url(img/thumb_switzerland.png)',
    'ch19_south_africa':           'url(img/thumb_south_africa.png)',
    'ch20_tasting':                'url(img/thumb_tasting.png)',
    'ch21_cheese':                 'url(img/thumb_cheese.png)',
    'ch22_pairing':                'url(img/thumb_pairing.png)',
    'ch23_wine_management':        'url(img/thumb_management.png)',
    'ch24_sommelier':              'url(img/thumb_sommelier.png)',
    'ch25_jsa_exam':               'url(img/thumb_jsa_exam.png)',
    'ch26_latest_update':          'url(img/thumb_latest_update.png)',
    'update_europe_2025':          'url(img/thumb_central_eastern_europe.png)',
    'update_newworld_2025':        'url(img/thumb_south_america.png)',
    'update_professional_2025':    'url(img/thumb_wine_management.png)',
    'wset_sat':                    'url(assets/img/thumbnails/wset_conclusion.png)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)';

// ---- FLAG MAP (National flags only — NO emoji icons) ----
const FLAG_MAP = {
    'ch00_wine_overview':    '',
    'ch01_spirits_overview': '',
    'ch02_beverages_overview':'',
    'ch03_japan':            '🇯🇵',
    'ch04_australia_nz':     '🇦🇺',
    'ch05_france':           '🇫🇷',
    'ch06_italy':            '🇮🇹',
    'ch07_spain':            '🇪🇸',
    'ch08_germany':          '🇩🇪',
    'ch09_portugal':         '🇵🇹',
    'ch10_usa':              '🇺🇸',
    'ch11_chile':            '🇨🇱',
    'ch12_argentina':        '🇦🇷',
    'ch13_south_africa':     '🇿🇦',
    'ch14_canada':           '🇨🇦',
    'ch15_austria':          '🇦🇹',
    'ch16_hungary':          '🇭🇺',
    'ch17_central_europe':   '',
    'ch18_greece_georgia':   '🇬🇷',
    'ch19_switzerland_uk':   '🇨🇭',
    'ch20_south_africa':     '🇿🇦',
};

// ---- CORRECT ACCENT TITLES (wine terminology accents) ----
const ACCENT_TITLES = {
    'ch05_france':    { ja: 'フランス', en: 'France' },
    'ch06_italy':     { ja: 'イタリア', en: 'Italia' },
    'ch07_spain':     { ja: 'スペイン', en: 'España' },
    'ch08_germany':   { ja: 'ドイツ', en: 'Deutschland' },
    'ch09_portugal':  { ja: 'ポルトガル', en: 'Portugal' },
    'ch04_australia_nz': { ja: 'オーストラリア & ニュージーランド', en: 'Australia & New Zealand' },
    'ch11_chile':     { ja: 'チリ', en: 'Chile' },
    'ch12_argentina': { ja: 'アルゼンチン', en: 'Argentina' },
    'ch15_austria':   { ja: 'オーストリア', en: 'Österreich' },
    'ch16_hungary':   { ja: 'ハンガリー', en: 'Magyarország' },
    'ch18_greece_georgia': { ja: 'ギリシャ & ジョージア', en: 'Ελλάδα & საქართველო' },
    'ch19_switzerland_uk': { ja: 'スイス & 英国', en: 'Schweiz & United Kingdom' },
    'update_europe_2025': { ja: 'ヨーロッパ最新版', en: 'Europe 2025 Update' },
    'update_newworld_2025': { ja: '新世界 & アジア最新版', en: 'New World & Asia 2025 Update' },
    'update_professional_2025': { ja: 'テイスティング & マネジメント最新版', en: 'Tasting & Management 2025 Update' },
};

// ---- STATE ----
let chapters = [];
let activeCategory = 'ALL';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(`${SUMMARY_INDEX}?t=${Date.now()}`);
        const data = await res.json();
        chapters = data.chapters || [];
        renderCategories();
        renderMobileMenu();
        renderChapters(chapters);
        setupSearch();
        setupDetail();
        setupBottomNav();
        setupDesktopNav();
        setupHamburger();
    } catch (err) {
        console.error('Failed to load data:', err);
    }
});


// ---- BOTTOM NAVIGATION ----
function setupBottomNav() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const nav = item.dataset.nav;
            // Reset active
            navItems.forEach(i => i.classList.remove('active'));
            
            switch(nav) {
                case 'home':
                    item.classList.add('active');
                    // Scroll to top, close any overlays
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'quiz':
                    item.classList.add('active');
                    // Trigger quiz open (quiz_generator handles this)
                    const quizOverlay = document.getElementById('quizOverlay');
                    if (quizOverlay) {
                        quizOverlay.classList.remove('hidden');
                        document.dispatchEvent(new CustomEvent('quiz:open'));
                    }
                    break;
                case 'quest':
                    item.classList.add('active');
                    document.dispatchEvent(new CustomEvent('quest:open'));
                    break;
                case 'ai':
                    item.classList.add('active');
                    // Trigger AI panel open
                    const aiConcierge = document.getElementById('aiConcierge');
                    if (aiConcierge) {
                        aiConcierge.classList.add('open');
                        const aiFab = document.getElementById('aiFab');
                        if (aiFab) aiFab.classList.add('hidden');
                        document.getElementById('aiInput')?.focus();
                    }
                    break;
                case 'dash':
                    item.classList.add('active');
                    // Trigger dashboard open
                    document.dispatchEvent(new CustomEvent('dashboard:open'));
                    break;
            }
        });
    });
}

// ---- DESKTOP HEADER NAVIGATION ----
function setupDesktopNav() {
    const deskBtns = document.querySelectorAll('.hd-nav-btn');
    const bottomItems = document.querySelectorAll('.bottom-nav-item');
    if (deskBtns.length === 0) return;

    deskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const nav = btn.dataset.nav;
            // Sync active state on both navs
            deskBtns.forEach(b => b.classList.remove('active'));
            bottomItems.forEach(i => i.classList.remove('active'));
            btn.classList.add('active');
            // Also activate matching bottom nav item
            const matchBottom = document.querySelector(`.bottom-nav-item[data-nav="${nav}"]`);
            if (matchBottom) matchBottom.classList.add('active');

            switch(nav) {
                case 'home':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'quiz':
                    const quizOverlay = document.getElementById('quizOverlay');
                    if (quizOverlay) {
                        quizOverlay.classList.remove('hidden');
                        document.dispatchEvent(new CustomEvent('quiz:open'));
                    }
                    break;
                case 'quest':
                    document.dispatchEvent(new CustomEvent('quest:open'));
                    break;
                case 'ai':
                    const aiConcierge = document.getElementById('aiConcierge');
                    if (aiConcierge) {
                        aiConcierge.classList.add('open');
                        const aiFab = document.getElementById('aiFab');
                        if (aiFab) aiFab.classList.add('hidden');
                        document.getElementById('aiInput')?.focus();
                    }
                    break;
                case 'dash':
                    document.dispatchEvent(new CustomEvent('dashboard:open'));
                    break;
            }
        });
    });

    // Keep desktop nav in sync when bottom nav is clicked
    bottomItems.forEach(item => {
        item.addEventListener('click', () => {
            deskBtns.forEach(b => b.classList.remove('active'));
            const match = document.querySelector(`.hd-nav-btn[data-nav="${item.dataset.nav}"]`);
            if (match) match.classList.add('active');
        });
    });
}


// ---- HAMBURGER MENU ----
function setupHamburger() {
    const hamburger = document.getElementById('hamburgerBtn');
    const overlay = document.getElementById('mobileMenuOverlay');
    const close = document.getElementById('mobileMenuClose');
    const backdrop = document.getElementById('mobileMenuBackdrop');

    if (!hamburger || !overlay) return;

    function open() {
        overlay.classList.remove('hidden');
        hamburger.classList.add('open');
    }

    function closeMenu() {
        overlay.classList.add('hidden');
        hamburger.classList.remove('open');
    }

    hamburger.addEventListener('click', () => {
        if (overlay.classList.contains('hidden')) open();
        else closeMenu();
    });
    close?.addEventListener('click', closeMenu);
    backdrop?.addEventListener('click', closeMenu);
}


// ---- MOBILE MENU RENDERING ----
function renderMobileMenu() {
    const nav = document.getElementById('mobileMenuNav');
    if (!nav) return;

    nav.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `mobile-menu-btn ${cat.id === activeCategory ? 'active' : ''}`;
        btn.textContent = cat.label;
        btn.addEventListener('click', () => {
            activeCategory = cat.id;
            // Update both desktop and mobile nav
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.mobile-menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Also activate the corresponding desktop button
            document.querySelectorAll('.cat-btn').forEach(b => {
                if (b.textContent === cat.label) b.classList.add('active');
            });
            renderChapters(filterChapters());
            // Close mobile menu
            document.getElementById('mobileMenuOverlay')?.classList.add('hidden');
            document.getElementById('hamburgerBtn')?.classList.remove('open');
        });
        nav.appendChild(btn);
    });
}

function filterChapters() {
    if (activeCategory === 'ALL') return chapters;
    return chapters.filter(ch => ch.category === activeCategory);
}


// ---- RENDER CATEGORIES ----
function renderCategories() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${cat.id === activeCategory ? 'active' : ''}`;
        btn.textContent = cat.label;
        btn.addEventListener('click', () => {
            activeCategory = cat.id;
            nav.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtered = cat.id === 'ALL'
                ? chapters
                : chapters.filter(c => c.category === cat.id);
            renderChapters(filtered);
        });
        nav.appendChild(btn);
    });
}


// ---- RENDER CHAPTERS ----
function renderChapters(data) {
    const featuredEl = document.getElementById('featuredCard');
    const gridEl = document.getElementById('chapterGrid');
    
    featuredEl.innerHTML = '';
    gridEl.innerHTML = '';
    
    if (data.length === 0) {
        gridEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);padding:60px 0;">該当するチャプターがありません</p>';
        return;
    }
    
    // First item = featured
    const first = data[0];
    featuredEl.innerHTML = buildFeaturedCard(first);
    featuredEl.querySelector('.featured-card')?.addEventListener('click', () => showDetail(first));
    
    // Rest = grid
    data.slice(1).forEach(ch => {
        const card = document.createElement('div');
        card.innerHTML = buildCard(ch);
        const el = card.firstElementChild;
        el.addEventListener('click', () => showDetail(ch));
        gridEl.appendChild(el);
    });
}


function buildFeaturedCard(ch) {
    const gradient = THUMB_IMAGES[ch.id] || DEFAULT_GRADIENT;
    const flag = FLAG_MAP[ch.id] || '';
    const catLabel = CATEGORY_LABELS[ch.category] || ch.category;
    const titleEn = getAccentTitle(ch);
    
    return `
        <div class="featured-card">
            <div class="featured-thumb" style="background-image:${gradient}; background-size:cover; background-position:center;">
            </div>
            <div class="featured-info">
                <div class="card-kicker">${catLabel}</div>
                <div class="card-title">${flag ? `<span class="flag-inline">${flag}</span> ` : ''}${ch.title}</div>
                <div class="card-title-en">${titleEn}</div>
                <div class="card-desc">${ch.description}</div>
                <div class="card-meta">
                    <span><strong>${ch.keywords?.length || 0}</strong> keywords</span>
                    <span class="card-tier">${ch.tier === 'major' ? '★ MAJOR' : ''}</span>
                </div>
            </div>
        </div>
    `;
}


function buildCard(ch) {
    const gradient = THUMB_IMAGES[ch.id] || DEFAULT_GRADIENT;
    const flag = FLAG_MAP[ch.id] || '';
    const catLabel = CATEGORY_LABELS[ch.category] || ch.category;
    const titleEn = getAccentTitle(ch);
    const kwTags = (ch.keywords || []).slice(0, 3)
        .map(kw => `<span class="kw-tag">${kw}</span>`).join('');
    
    return `
        <div class="card">
            <div class="card-thumb" style="background-image:${gradient}; background-size:cover; background-position:center;">
            </div>
            <div class="card-body">
                <div class="card-kicker">${catLabel}</div>
                <div class="card-title">${flag ? `<span class="flag-inline">${flag}</span> ` : ''}${ch.title}</div>
                <div class="card-title-en">${titleEn}</div>
                <div class="card-desc">${ch.description}</div>
                ${kwTags ? `<div class="card-keywords">${kwTags}</div>` : ''}
                <div class="card-meta">
                    <span><strong>${ch.keywords?.length || 0}</strong> keywords</span>
                    <span class="card-tier">${ch.tier === 'major' ? '★ MAJOR' : ''}</span>
                </div>
            </div>
        </div>
    `;
}


function getAccentTitle(ch) {
    if (ACCENT_TITLES[ch.id]) {
        return ACCENT_TITLES[ch.id].en;
    }
    return ch.title_en || '';
}


// ---- SEARCH ----
function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        if (!q) {
            renderChapters(activeCategory === 'ALL' ? chapters : chapters.filter(c => c.category === activeCategory));
            return;
        }
        const filtered = chapters.filter(ch => {
            const searchable = [ch.title, ch.title_en, ch.description, ...(ch.keywords || [])].join(' ').toLowerCase();
            return searchable.includes(q);
        });
        renderChapters(filtered);
    });
}


// ---- DETAIL PANEL (Side Peek) ----
function setupDetail() {
    document.getElementById('detailClose').addEventListener('click', hideDetail);
    document.getElementById('detailBackdrop').addEventListener('click', hideDetail);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideDetail();
    });
}


// ---- LIGHTWEIGHT MARKDOWN → HTML ----
function renderMarkdown(md) {
    const lines = md.split('\n');
    let html = '';
    let inTable = false;
    let firstTableRow = true;
    let inBlockquote = false;
    let inOl = false;
    let inUl = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // --- Table ---
        if (line.trim().startsWith('|')) {
            // Skip separator rows like |:---|:---|
            if (/^\|\s*:?-+/.test(line.trim())) continue;
            if (!inTable) { html += '<table class="md-table">'; inTable = true; firstTableRow = true; }
            const cells = line.split('|').filter(c => c.trim() !== '');
            const tag = firstTableRow ? 'th' : 'td';
            html += '<tr>' + cells.map(c => `<${tag}>${inlineMd(c.trim())}</${tag}>`).join('') + '</tr>';
            firstTableRow = false;
            continue;
        } else if (inTable) {
            html += '</table>';
            inTable = false;
        }

        // --- Blockquote ---
        if (line.trim().startsWith('>')) {
            if (!inBlockquote) { html += '<blockquote class="md-quote">'; inBlockquote = true; }
            html += inlineMd(line.replace(/^>\s*/, '')) + '<br>';
            continue;
        } else if (inBlockquote) {
            html += '</blockquote>';
            inBlockquote = false;
        }

        // --- Ordered list ---
        const olMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*(.*)/);
        if (olMatch) {
            if (!inOl) { html += '<ol class="md-ol">'; inOl = true; }
            html += `<li><strong>${olMatch[1]}</strong> ${inlineMd(olMatch[2])}</li>`;
            continue;
        }
        const olPlain = line.match(/^\d+\.\s+(.*)/);
        if (olPlain) {
            if (!inOl) { html += '<ol class="md-ol">'; inOl = true; }
            html += `<li>${inlineMd(olPlain[1])}</li>`;
            continue;
        } else if (inOl) {
            html += '</ol>';
            inOl = false;
        }

        // --- Unordered list ---
        const ulMatch = line.match(/^[\*\-]\s+(.*)/);
        if (ulMatch) {
            if (!inUl) { html += '<ul class="md-ul">'; inUl = true; }
            html += `<li>${inlineMd(ulMatch[1])}</li>`;
            continue;
        } else if (inUl) {
            html += '</ul>';
            inUl = false;
        }

        // --- Headings ---
        if (line.startsWith('### ')) { html += `<h3>${inlineMd(line.slice(4))}</h3>`; continue; }
        if (line.startsWith('## '))  { html += `<h2>${inlineMd(line.slice(3))}</h2>`; continue; }

        // --- Empty line = paragraph break ---
        if (line.trim() === '') { html += '<br>'; continue; }

        // --- Normal paragraph ---
        html += `<p>${inlineMd(line)}</p>`;
    }

    // Close any open tags
    if (inTable) html += '</table>';
    if (inBlockquote) html += '</blockquote>';
    if (inOl) html += '</ol>';
    if (inUl) html += '</ul>';

    return html;
}

function inlineMd(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/<br>/g, '<br>');
}


function showDetail(ch) {
    const overlay = document.getElementById('detailOverlay');
    const heroEl = document.getElementById('detailHero');
    const bodyEl = document.getElementById('detailBody');
    
    const flag = FLAG_MAP[ch.id] || '';
    const catLabel = CATEGORY_LABELS[ch.category] || ch.category;
    const titleEn = getAccentTitle(ch);
    
    heroEl.innerHTML = `
        <div class="detail-kicker">${catLabel}</div>
        <div class="detail-title">${flag ? `<span class="flag-inline">${flag}</span> ` : ''}${ch.title}</div>
        <div class="detail-title-en">${titleEn}</div>
        <div class="detail-stats">
            <div class="detail-stat">
                <span class="detail-stat-num">${ch.keywords?.length || 0}</span>
                <span class="detail-stat-label">Keywords</span>
            </div>
            <div class="detail-stat">
                <span class="detail-stat-num">${ch.key_points?.length || 0}</span>
                <span class="detail-stat-label">Key Points</span>
            </div>
            <div class="detail-stat">
                <span class="detail-stat-num">${ch.tier === 'major' ? 'MAJOR' : 'STD'}</span>
                <span class="detail-stat-label">Tier</span>
            </div>
        </div>
    `;
    
    // Key Points
    const keyPointsHtml = (ch.key_points || []).length > 1
        ? `<h3 class="detail-section-title">Key Points</h3>
           <ul class="detail-keypoints">
               ${ch.key_points.map(kp => `<li>${kp}</li>`).join('')}
           </ul>`
        : '';
    
    // Keywords
    const keywordsHtml = (ch.keywords || []).length > 0
        ? `<div class="detail-keywords-section">
               <h3 class="detail-section-title">Keywords</h3>
               <div class="detail-keywords">
                   ${ch.keywords.map(kw => `<span class="detail-kw-tag">${kw}</span>`).join('')}
               </div>
           </div>`
        : '';
    
    // Overview (cleaned summary — full Markdown rendering)
    let overviewHtml = '';
    if (ch.summary) {
        overviewHtml = `
            <h3 class="detail-section-title">Chapter Overview</h3>
            <div class="detail-overview">
                ${renderMarkdown(ch.summary)}
            </div>
        `;
    }
    
    // Deep Content: Exam Tips
    let examTipsHtml = '';
    if (ch.deep_content && ch.deep_content.exam_tips && ch.deep_content.exam_tips.length > 0) {
        examTipsHtml = `
            <h3 class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M14 3v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>試験対策ポイント</h3>
            <ul class="detail-exam-tips">
                ${ch.deep_content.exam_tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>`;
    }

    // Deep Content: Classification Tables (Grand Cru listings etc.)
    let classTablesHtml = '';
    if (ch.deep_content && ch.deep_content.classification_tables) {
        const tables = ch.deep_content.classification_tables;
        const tableEntries = Object.entries(tables);
        if (tableEntries.length > 0) {
            const tablesInner = tableEntries.map(([key, values]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return `
                    <div class="detail-class-table">
                        <h4 class="detail-class-label">${label}</h4>
                        <div class="detail-class-tags">
                            ${values.map(v => `<span class="detail-class-tag">${v}</span>`).join('')}
                        </div>
                    </div>`;
            }).join('');
            classTablesHtml = `
                <h3 class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/></svg>格付け・分類一覧</h3>
                ${tablesInner}`;
        }
    }

    // Deep Content: Timeline
    let timelineHtml = '';
    if (ch.deep_content && ch.deep_content.timeline && ch.deep_content.timeline.length > 0) {
        timelineHtml = `
            <h3 class="detail-section-title"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:4px"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>歴史年表</h3>
            <div class="detail-timeline">
                ${ch.deep_content.timeline.map(item => `
                    <div class="timeline-item">
                        <span class="timeline-year">${item.year}</span>
                        <span class="timeline-event">${item.event}</span>
                    </div>
                `).join('')}
            </div>`;
    }

    bodyEl.innerHTML = keyPointsHtml + keywordsHtml + overviewHtml + examTipsHtml + classTablesHtml + timelineHtml;
    
    // Bind AI Concierge triggers to keywords
    document.querySelectorAll('.detail-kw-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            hideDetail();
            document.dispatchEvent(new CustomEvent('open-ai-concierge', { 
                detail: { initialPrompt: `「${tag.textContent}」というキーワードについて、ソムリエ試験対策の観点から詳しく深掘りして解説してください！` } 
            }));
        });
    });

    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Reset scroll
    document.querySelector('.detail-panel').scrollTop = 0;
}


function hideDetail() {
    document.getElementById('detailOverlay').classList.add('hidden');
    document.body.style.overflow = '';
}
