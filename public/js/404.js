/*
 * 404.js — 404 页面专用脚本
 * ===========================
 * 精简版 main.js，独立维护。包含：
 *   1. Cookie 同意横幅
 *   2. 主题切换（亮色 / 暗黑 / 自动）
 *   3. 侧边栏开关
 * ===========================
 */

// ---------- 全局变量 ----------
let currentThemeMode = 'auto';
let cookieConsent = null;

// ---------- Cookie 同意相关 ----------

/* 从 localStorage 获取用户 Cookie 同意状态 */
function getCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'necessary' || consent === 'all') {
        return consent;
    }
    return null;
}

/*
 * 设置 Cookie 同意状态
 * - 'all' → 保存 cookieConsent + themeMode
 * - 'necessary' → 仅保存 cookieConsent，清除 themeMode
 * 设置后隐藏横幅
 */
function setCookieConsent(type) {
    cookieConsent = type;

    if (type === 'all') {
        saveThemeMode();
    } else {
        localStorage.removeItem('themeMode');
        currentThemeMode = 'auto';
        applyTheme();
    }
    localStorage.setItem('cookieConsent', type);

    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

/* 显示 Cookie 横幅（仅在用户未做选择时） */
function showCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner && !cookieConsent) {
        banner.classList.remove('hidden');
    }
}

// ---------- 主题相关 ----------

/* 检测系统深色模式偏好 */
const isSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/* 仅在用户同意全部 Cookie 时保存主题偏好 */
function saveThemeMode() {
    if (cookieConsent === 'all') {
        localStorage.setItem('themeMode', currentThemeMode);
    }
}

/*
 * 应用当前主题
 * auto → 跟随系统；dark → 强制暗黑；light → 强制亮色
 */
function applyTheme() {
    const body = document.body;
    const btn = document.querySelector('.mode-toggle');

    if (currentThemeMode === 'auto') {
        body.classList.toggle('dark-mode', isSystemDark());
        btn.textContent = '\u25D0 自动';
    } else if (currentThemeMode === 'dark') {
        body.classList.add('dark-mode');
        btn.textContent = '\u2600 日间';
    } else {
        body.classList.remove('dark-mode');
        btn.textContent = '\u263D 深色';
    }

    saveThemeMode();
}

/* 切换主题：auto → dark → light → auto */
function toggleDarkMode() {
    const modes = ['auto', 'dark', 'light'];
    const currentIndex = modes.indexOf(currentThemeMode);
    currentThemeMode = modes[(currentIndex + 1) % modes.length];
    applyTheme();
}

/* 监听系统主题变化，自动模式下同步 */
function setupThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
        if (currentThemeMode === 'auto') {
            applyTheme();
        }
    });
}

/* 初始化主题：读取 localStorage 或默认 auto */
function initTheme() {
    if (cookieConsent === 'all') {
        const savedMode = localStorage.getItem('themeMode');
        if (savedMode && ['auto', 'dark', 'light'].includes(savedMode)) {
            currentThemeMode = savedMode;
        }
    }

    applyTheme();
    setupThemeListener();
}

// ---------- 外站跳转确认弹窗 ----------

var extLinkOverlay = document.getElementById('extLinkOverlay');
var extLinkModal = document.getElementById('extLinkModal');
var extLinkUrl = document.getElementById('extLinkUrl');
var extLinkConfirm = document.getElementById('extLinkConfirm');

function showExtLinkModal(url) {
    if (!extLinkModal || !extLinkOverlay) return;
    extLinkUrl.textContent = url;
    extLinkConfirm.href = url;
    extLinkOverlay.classList.add('active');
    extLinkModal.classList.add('active');
}

function closeExtLinkModal() {
    if (!extLinkModal || !extLinkOverlay) return;
    extLinkOverlay.classList.remove('active');
    extLinkModal.classList.remove('active');
    extLinkConfirm.href = '#';
}

// ---------- 侧边栏逻辑 ----------

/* 切换侧边栏开/关 */
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

/*
 * 隐藏 Cookie 横幅
 * 用户已同意时调用，确保刷新页面不会再次显示
 */
function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

// ---------- 启动 ----------

/*
 * DOM 加载完成后初始化
 * 顺序：Cookie 检查 → 主题初始化 → Cookie 横幅
 */
document.addEventListener('DOMContentLoaded', () => {
    cookieConsent = getCookieConsent();
    initTheme();

    if (!cookieConsent) {
        showCookieBanner();
    } else {
        hideCookieBanner();
    }

    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (!link || !link.href) return;
        if (link.href.startsWith('#')) return;

        var isExternal = link.hostname && link.hostname !== window.location.hostname;

        if (isExternal) {
            if (link.getAttribute('data-no-ext-confirm') !== null) return;
            e.preventDefault();
            showExtLinkModal(link.href);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && extLinkModal && extLinkModal.classList.contains('active')) {
            closeExtLinkModal();
        }
    });
});
