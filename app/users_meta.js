/**
 * SommelierPRO - Frontend User Metadata Configuration
 * 
 * TI (Talent Intelligence) および MF (MINDFUL) から着想を得た、受講生プロファイルの設定。
 * ユーザーの名前をキーとして、TIライクなチップUIを描画するための静的データを提供します。
 * 
 * v2.0: GAS Users_Meta シートからBase64写真を動的取得する機能を追加。
 *       ローカル画像はフォールバックとして維持。
 */

// Static fallback data (always available offline)
const SOMMELIER_USERS_FALLBACK = {
    "Mohri": { photo: "img/user_mohri.jpg", status: "受験生 (Active)" },
    "Hatakeyama": { photo: "img/user_hatakeyama.jpg", status: "受験生 (Active)" },
    "Sugita": { photo: "img/user_sugita.jpg", status: "受験生 (Active)" },
    "Yahata": { photo: "img/user_yahata.jpg", status: "受験生 (Active)" },
    "Yamaguchi": { photo: "img/user_yamaguchi.jpg", status: "受験生 (Active)" },
    "Wakasa": { photo: "img/user_wakasa.jpg", status: "受験生 (Active)" },
    "Iga": { photo: "img/user_iga.jpg", status: "Mentor" }
};

// Live data (populated from GAS)
const SOMMELIER_USERS = { ...SOMMELIER_USERS_FALLBACK };

/**
 * Fetch dynamic photo metadata from GAS and merge with fallback.
 * GAS Base64 photos take priority over local img/ files.
 * Call this once on app boot after DOM is ready.
 */
let _metaReadyResolve;
const userMetaReady = new Promise(resolve => { _metaReadyResolve = resolve; });

async function loadDynamicUserMeta() {
    try {
        const GAS_URL = typeof DSM_GAS_URL !== 'undefined'
            ? DSM_GAS_URL
            : "https://script.google.com/macros/s/AKfycbz7SNH0irHiarYDDzpJF1Jgr8UM8qX6Z4v-r_aGlQPIXTnx2cZaqkYrfixay4g37K1i_A/exec";

        const res = await fetch(`${GAS_URL}?action=getUserMeta`);
        const json = await res.json();

        if (json.status === 'success' && json.data && json.data.meta) {
            const remoteMeta = json.data.meta;
            for (const [userName, meta] of Object.entries(remoteMeta)) {
                if (meta.photo) {
                    // Merge: GAS photo overrides local fallback
                    if (!SOMMELIER_USERS[userName]) {
                        SOMMELIER_USERS[userName] = {};
                    }
                    SOMMELIER_USERS[userName].photo = meta.photo;
                    if (meta.status) {
                        SOMMELIER_USERS[userName].status = meta.status;
                    }
                }
            }
            console.log('[UserMeta] Dynamic photos loaded:', Object.keys(remoteMeta).length, 'users');
        }
    } catch (e) {
        console.warn('[UserMeta] Dynamic fetch failed, using fallback:', e.message);
    } finally {
        _metaReadyResolve(); // Signal readiness even on error (fallback data is valid)
    }
}
