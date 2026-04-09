/**
 * SOMMELIER PRO — Unified Auth Module (MINDFUL Blueprint)
 * 
 * Single Source of Truth for authentication state.
 * All modules MUST use DSMAuth instead of direct localStorage access.
 * 
 * Stage-Gate Pattern: DSMAuth.requireAuth(callback)
 * — If logged in → callback runs immediately
 * — If not → login modal opens, callback runs after successful login
 */

const DSMAuth = (function() {
    // ========== CONSTANTS ==========
    const STORAGE_KEY_USER = 'sommelier_quiz_user';
    const STORAGE_KEY_API  = 'sommelier_api_key';
    const STORAGE_KEY_TOKENS = 'sommelier_total_tokens';

    // ========== INTERNAL STATE ==========
    let _currentUser = null;  // { user_id, name }
    let _apiKey = null;
    let _pendingCallback = null;
    let _modalElement = null;

    // ========== INIT (Rehydrate from localStorage) ==========
    function _rehydrate() {
        try {
            const savedUser = localStorage.getItem(STORAGE_KEY_USER);
            if (savedUser) _currentUser = JSON.parse(savedUser);
        } catch(e) { _currentUser = null; }

        _apiKey = localStorage.getItem(STORAGE_KEY_API) || null;
    }

    // ========== PUBLIC API ==========

    /** Get current user object or null */
    function getUser() {
        if (!_currentUser) _rehydrate();
        return _currentUser;
    }

    /** Get API key or null */
    function getApiKey() {
        if (!_apiKey) _rehydrate();
        return _apiKey;
    }

    /** Check if fully authenticated (user + API key) */
    function isLoggedIn() {
        const u = getUser();
        const k = getApiKey();
        return !!(u && u.name && k && k.startsWith('AIza'));
    }

    /** Login and persist */
    function login(name, apiKey) {
        if (!name || !apiKey) return false;
        const uid = 'usr_' + Date.now().toString(36);
        _currentUser = { user_id: uid, name: name.trim() };
        _apiKey = apiKey.trim();
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(_currentUser));
        localStorage.setItem(STORAGE_KEY_API, _apiKey);
        
        // Dispatch global event so all modules can react
        document.dispatchEvent(new CustomEvent('dsm:auth:login', { detail: { user: _currentUser } }));
        return true;
    }

    /** Logout and clear state */
    function logout() {
        _currentUser = null;
        _apiKey = null;
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_API);
        document.dispatchEvent(new CustomEvent('dsm:auth:logout'));
    }

    /** Get total accumulated tokens */
    function getTotalTokens() {
        return parseInt(localStorage.getItem(STORAGE_KEY_TOKENS) || '0', 10);
    }

    /** Add tokens */
    function addTokens(amount) {
        const current = getTotalTokens();
        const newTotal = current + amount;
        localStorage.setItem(STORAGE_KEY_TOKENS, String(newTotal));
        return newTotal;
    }

    // ========== STAGE-GATE ==========

    /**
     * Require authentication before running callback.
     * If logged in → callback(user) immediately.
     * If not → show login modal, run callback(user) after successful login.
     */
    function requireAuth(callback) {
        if (isLoggedIn()) {
            callback(getUser());
        } else {
            _pendingCallback = callback;
            _showLoginModal();
        }
    }

    // ========== LOGIN MODAL (Unified) ==========

    function _showLoginModal() {
        // Remove existing modal
        if (_modalElement) _modalElement.remove();

        _modalElement = document.createElement('div');
        _modalElement.id = 'dsmAuthModal';
        _modalElement.className = 'dsm-auth-overlay';
        _modalElement.innerHTML = `
            <div class="dsm-auth-card">
                <div class="dsm-auth-header">
                    <h2 class="dsm-auth-title">Sommelier PRO</h2>
                    <p class="dsm-auth-subtitle">割り当てられたユーザー名とAPIキーを入力してください</p>
                </div>
                <div class="dsm-auth-form">
                    <div class="dsm-auth-field">
                        <label for="dsmAuthName">ユーザー名 (ローマ字)</label>
                        <input type="text" id="dsmAuthName" placeholder="例: Iga" autocomplete="off">
                    </div>
                    <div class="dsm-auth-field">
                        <label for="dsmAuthKey">Gemini API Key</label>
                        <input type="password" id="dsmAuthKey" placeholder="AIzaSy...">
                    </div>
                    <p class="dsm-auth-error" id="dsmAuthError"></p>
                    <button class="dsm-auth-btn" id="dsmAuthSubmit">ログインして開始する</button>
                </div>
            </div>
        `;
        document.body.appendChild(_modalElement);

        // Focus
        setTimeout(() => document.getElementById('dsmAuthName').focus(), 100);

        // Handler
        const handleSubmit = () => {
            const name = document.getElementById('dsmAuthName').value.trim();
            const key = document.getElementById('dsmAuthKey').value.trim();
            const errorEl = document.getElementById('dsmAuthError');

            if (!name) {
                errorEl.textContent = 'ユーザー名を入力してください。';
                errorEl.style.display = 'block';
                return;
            }
            if (!key || !key.startsWith('AIza')) {
                errorEl.textContent = '無効な API Key です。AIzaで始まるキーを入力してください。';
                errorEl.style.display = 'block';
                return;
            }

            login(name, key);
            _modalElement.remove();
            _modalElement = null;

            if (_pendingCallback) {
                _pendingCallback(getUser());
                _pendingCallback = null;
            }
        };

        document.getElementById('dsmAuthSubmit').addEventListener('click', handleSubmit);
        document.getElementById('dsmAuthKey').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSubmit();
        });
    }

    // Boot: rehydrate on load
    _rehydrate();

    // ========== PUBLIC INTERFACE ==========
    return {
        getUser,
        getApiKey,
        isLoggedIn,
        login,
        logout,
        getTotalTokens,
        addTokens,
        requireAuth,
        // Constants exposed for backward compatibility
        STORAGE_KEY_USER,
        STORAGE_KEY_API,
        STORAGE_KEY_TOKENS
    };
})();

/**
 * SOMMELIER PRO — Unified Toast Notification System
 * 
 * Usage:
 *   DSMToast.success('保存しました');
 *   DSMToast.error('接続エラー');
 *   DSMToast.info('ナレッジベースを読み込み中...');
 */
const DSMToast = (function() {
    let _container = null;

    function _ensureContainer() {
        if (_container) return _container;
        _container = document.createElement('div');
        _container.id = 'dsmToastContainer';
        _container.className = 'dsm-toast-container';
        document.body.appendChild(_container);
        return _container;
    }

    function _show(message, type, durationMs) {
        const container = _ensureContainer();
        const toast = document.createElement('div');
        toast.className = `dsm-toast dsm-toast-${type}`;

        const icons = { success: '✓', error: '✕', info: 'ℹ' };
        toast.innerHTML = `
            <span class="dsm-toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="dsm-toast-msg">${message}</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('dsm-toast-show'));

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.remove('dsm-toast-show');
            toast.classList.add('dsm-toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, durationMs || 3000);
    }

    return {
        success: (msg, ms) => _show(msg, 'success', ms || 3000),
        error:   (msg, ms) => _show(msg, 'error',   ms || 4000),
        info:    (msg, ms) => _show(msg, 'info',    ms || 3000)
    };
})();
