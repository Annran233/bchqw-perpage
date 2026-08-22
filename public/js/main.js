/*
 * main.js — 主脚本
 * =================
 * 负责以下模块：
 *   1. Cookie 同意横幅 —— 读取/存储 localStorage，控制显示/隐藏
 *   2. 主题切换（亮色 / 暗黑 / 自动）—— 跟随系统偏好或手动切换
 *   3. 一言 API —— 获取随机句子，展示在 Hero 区域
 *   4. Hero 悬停交互 —— Grid 项悬停时切换 Hero 文字（0.3s 延迟防误触）
 *   5. 侧边栏 —— 开关状态管理
 *   6. 页面转场 —— 点击链接显示进度条，内容页淡入动画
 *   7. GA 分析 —— 按用户同意状态加载或卸载 Google Analytics
 *   8. TOC 目录 —— IntersectionObserver 高亮当前标题
 * =================
 */

// ---------- 全局变量 ----------
let ORIGINAL_HERO = '⏳';          // 初始占位，异步加载一言后会覆写
let heroTimer = null;              // 悬停交互的延迟定时器

// 当前主题模式，可选 'auto' | 'dark' | 'light'
let currentThemeMode = 'auto';

// Cookie 同意状态：'necessary'（仅必要）| 'all'（全部同意）| null（未选择）
let cookieConsent = null;

// ---------- Google Analytics ----------

/* Google Analytics 4 测量 ID */
const GA_MEASUREMENT_ID = 'G-QXMV93M6HE';

/*
 * 初始化 GA 默认同意状态为 "denied"
 * 在用户明确同意前不发送任何分析数据
 */
function initGAConsentDefault() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
        analytics_storage: 'denied'
    });
}

/*
 * 加载 Google Analytics 脚本
 * 仅在用户同意全部 Cookie 时调用
 * 使用 __gaLoaded 标记防止重复加载
 */
function loadGoogleAnalytics() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;

    // 更新同意状态为授予
    window.gtag('consent', 'update', {
        analytics_storage: 'granted'
    });

    // 动态创建 script 标签加载 GA
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,          // 匿名化 IP
        send_page_view: true         // 发送页面浏览事件
    });
}

/*
 * 卸载 Google Analytics
 * 当用户从"全部"切换到"仅必要"时调用
 * 清除 GA 同意状态和相关 Cookie
 */
function unloadGoogleAnalytics() {
    if (window.gtag) {
        window.gtag('consent', 'update', {
            analytics_storage: 'denied'
        });
    }

    // 清除所有 GA 相关 Cookie
    document.cookie.split(';').forEach(function(c) {
        var name = c.trim().split('=')[0];
        if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        }
    });

    window.__gaLoaded = false;
}

// ---------- Cookie 同意相关 ----------

/*
 * 获取用户之前选择的 Cookie 同意状态
 * 从 localStorage 读取，返回 'necessary' | 'all' | null
 */
function getCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'necessary' || consent === 'all') {
        return consent;
    }
    return null;
}

/*
 * 设置 Cookie 同意状态
 * @param {string} type - 'necessary'（仅必要）| 'all'（全部同意）
 *
 * 保存到 localStorage，同步加载/卸载 GA，然后隐藏横幅
 */
function setCookieConsent(type) {
    cookieConsent = type;

    localStorage.setItem('cookieConsent', type);

    if (type === 'all') {
        loadGoogleAnalytics();
    } else {
        unloadGoogleAnalytics();
        localStorage.removeItem('themeMode');
        currentThemeMode = 'auto';
        applyTheme();
    }

    saveThemeMode();
    hideCookieBanner();
}

/* 隐藏 Cookie 横幅（添加 .hidden 类） */
function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

/*
 * 显示 Cookie 横幅
 * 仅在用户未做选择且横幅存在时才显示
 * 如果用户已同意（刷新页面），不会显示
 */
function showCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner && !cookieConsent) {
        banner.classList.remove('hidden');
    }
}

// ---------- 主题相关 ----------

/* 检测系统是否偏好深色模式 */
const isSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

/* 仅在用户同意全部 Cookie 时保存主题偏好到 localStorage */
function saveThemeMode() {
    if (cookieConsent === 'all') {
        localStorage.setItem('themeMode', currentThemeMode);
    }
}

/*
 * 应用当前主题模式到界面
 * - 'auto' → 跟随系统，body.dark-mode 与系统一致
 * - 'dark' → 强制暗黑模式
 * - 'light' → 强制亮色模式
 *
 * 同时更新侧边栏模式按钮的显示文字
 */
function applyTheme() {
    const body = document.body;
    const btn = document.querySelector('.mode-toggle');

    if (currentThemeMode === 'auto') {
        body.classList.toggle('dark-mode', isSystemDark());
        btn.textContent = '\u25D0 自动';       // ◐
    } else if (currentThemeMode === 'dark') {
        body.classList.add('dark-mode');
        btn.textContent = '\u2600 日间';       // ☀
    } else {
        body.classList.remove('dark-mode');
        btn.textContent = '\u263D 深色';       // ☽
    }

    saveThemeMode();
}

/*
 * 切换主题模式
 * 顺序：auto → dark → light → auto（循环）
 */
function toggleDarkMode() {
    const modes = ['auto', 'dark', 'light'];
    const currentIndex = modes.indexOf(currentThemeMode);
    currentThemeMode = modes[(currentIndex + 1) % modes.length];
    applyTheme();
}

/*
 * 监听系统主题变化
 * 当用户在"自动"模式下，操作系统切换亮/暗时自动同步
 */
function setupThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
        if (currentThemeMode === 'auto') {
            applyTheme();
        }
    });
}

/*
 * 初始化主题
 * 从 localStorage 读取用户偏好，如无则默认 'auto'
 */
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

// ---------- 工具函数 ----------

function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ---------- 一言 API ----------

/*
 * 从「一言」API 获取随机句子
 * 类别：b(动漫) d(文学) e(设计) f(游戏) h(科学) i(诗词)
 * 3 秒超时，超时后使用备用文案
 * 返回带作者署名的 HTML 字符串
 */
async function fetchHitokoto() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('https://v1.hitokoto.cn/?c=b&c=d&c=e&c=f&c=h&c=i', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();

        let content = data.hitokoto;
        let author = data.from_who || data.from;

        if (author) {
            return escapeHTML(content) + '<br><span class="author">\u2014\u2014 ' + escapeHTML(author) + '</span>';
        } else {
            return escapeHTML(content);
        }
    } catch (error) {
        console.warn('一言获取失败，使用备用文案', error);
        return '即使乌云密布，也要相信光。<br><span class="author">\u2014\u2014 佚名</span>';
    }
}

/*
 * 初始化 Hero：从远程加载一言句子并显示
 */
async function initHero() {
    const h1 = document.getElementById('mainHeroText');
    if (!h1) return;
    const sentence = await fetchHitokoto();
    ORIGINAL_HERO = sentence;
    h1.innerHTML = sentence;
}

// ---------- 悬停交互 ----------

/*
 * 鼠标移入 Grid 项时调用
 * 延迟 0.3 秒后才切换 Hero 文字，快速划过不会触发，避免误操作
 *
 * 流程：悬停 0.3s → 文字淡出 0.28s → 切换内容 → 文字淡入
 */
function changeHeroText(text) {
    if (window.innerWidth <= 600) return;       // 移动端不触发

    const h1 = document.getElementById('mainHeroText');
    const newHTML = text;

    // 取消之前未完成的定时器，防止文字被错误替换
    clearTimeout(heroTimer);

    // 如果文字已经是对的，只清理残留动画类
    if (h1.innerHTML === newHTML) {
        endAnimation(h1);
        return;
    }

    // 第一阶段：延迟 0.3s
    heroTimer = setTimeout(() => {
        h1.classList.remove('fade-in');
        h1.classList.add('fade-out');

        // 第二阶段：淡出后切换内容
        heroTimer = setTimeout(() => {
            h1.innerHTML = newHTML;
            endAnimation(h1);
        }, 280);
    }, 300);
}

/*
 * 鼠标移出 Grid 项时调用
 * 立即执行，恢复 Hero 文字为一言句子
 */
function resetHeroText() {
    if (window.innerWidth <= 600) return;

    const h1 = document.getElementById('mainHeroText');

    clearTimeout(heroTimer);

    // 如果已是原文，只清理动画残留
    if (h1.innerHTML === ORIGINAL_HERO) {
        endAnimation(h1);
        return;
    }

    h1.classList.remove('fade-in');
    h1.classList.add('fade-out');

    heroTimer = setTimeout(() => {
        h1.innerHTML = ORIGINAL_HERO;
        endAnimation(h1);
    }, 280);
}

/*
 * 结束文字动画：去掉 fade-out 状态，触发 fade-in 恢复可见
 * 解决快速悬停导致的文字不可见 Bug
 */
function endAnimation(h1) {
    h1.classList.remove('fade-out');
    h1.classList.add('fade-in');
}

// ---------- 侧边栏逻辑 ----------

/* 切换侧边栏开关（body 上增减 sidebar-open 类） */
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

// ---------- 启动 ----------

/*
 * DOM 加载完毕后执行初始化
 * 顺序：Cookie 检查 → GA 默认拒绝 → 按同意状态加载 GA → 主题 → Hero → TOC → Cookie 横幅
 */
document.addEventListener('DOMContentLoaded', () => {
    cookieConsent = getCookieConsent();

    initGAConsentDefault();

    if (cookieConsent === 'all') {
        loadGoogleAnalytics();
    }

    initTheme();
    initHero();
    initTOC();

    // 未同意 → 显示 Cookie 横幅；已同意 → 隐藏
    if (!cookieConsent) {
        showCookieBanner();
    } else {
        hideCookieBanner();
    }
});

// ---------- TOC 目录高亮 ----------

/*
 * 初始化侧边目录（Table of Contents）
 * 使用 IntersectionObserver 检测内容页 H2 标题是否在视口内
 * 自动高亮当前阅读位置（.toc-active）
 */
function initTOC() {
    var toc = document.getElementById('toc');
    if (!toc) return;

    var headings = document.querySelectorAll('.content-body h2[id]');
    if (!headings.length) return;

    var links = toc.querySelectorAll('a');
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                links.forEach(function(link) {
                    link.classList.toggle('toc-active', link.getAttribute('href') === '#' + entry.target.id);
                });
            }
        });
    }, { rootMargin: '-20% 0px -75% 0px' });   // 顶端 20%、底端 75% 为有效区域

    headings.forEach(function(h) { observer.observe(h); });
}

// ---------- 外站跳转确认弹窗 ----------

/*
 * 拦截所有指向外站的 <a> 链接，弹出确认弹窗
 * 判断逻辑：href 的 hostname 与当前页面不同即为外站
 * 排除：# 锚点、javascript: 伪协议、无 href 的链接
 * 带 data-no-ext-confirm 属性的链接跳过确认（如侧边栏博客链接等已知的可信外链）
 */
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

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && extLinkModal && extLinkModal.classList.contains('active')) {
        closeExtLinkModal();
    }
});

// ---------- 页面转场动画 + 进度条 ----------

/*
 * IIFE 包装，避免污染全局作用域
 *
 * 功能：
 *   1. 拦截站内链接点击，显示顶部进度条后跳转
 *   2. 拦截站外链接点击，弹出确认弹窗
 *   3. 内容页面加载时自动执行淡入动画
 *   4. 页面完全加载后进度条走到 100% 然后消失
 *
 * 不使用 sessionStorage（生产环境不稳定），
 * 改为通过 body.content-page-mode 类判断是否需淡入。
 */
(function() {
    var progressBar = document.getElementById('page-progress');
    var progressInterval = null;

    /*
     * 启动进度条模拟动画
     * 0% → 30%（快速，50ms）→ 70%（慢速增长，每 100ms +5%）
     */
    function startProgress() {
        if (!progressBar) return;
        progressBar.style.width = '0%';
        setTimeout(function() { progressBar.style.width = '30%'; }, 50);
        progressInterval = setInterval(function() {
            var currentWidth = parseFloat(progressBar.style.width);
            if (currentWidth < 70) {
                progressBar.style.width = (currentWidth + 5) + '%';
            } else {
                clearInterval(progressInterval);
            }
        }, 100);
    }

    /*
     * 拦截链接点击
     * - 站内链接：进度条 + 跳转
     * - 站外链接：弹出确认弹窗
     * 排除：# 锚点、当前页面、带 data-no-ext-confirm 的外链
     */
    function handleNavigation(e) {
        var link = e.target.closest('a');
        if (!link) return;
        if (!link.href) return;

        if (link.href.startsWith('#')) return;

        var canonicalEl = document.querySelector("link[rel=canonical]");
        var canonicalHost = canonicalEl ? new URL(canonicalEl.href).hostname : "";
        var currentHost = window.location.hostname;
        function sameSite(h) { return h === currentHost || h.endsWith("." + currentHost) || h === canonicalHost || h.endsWith("." + canonicalHost); }
        var isExternal = link.hostname && !sameSite(link.hostname);

        if (isExternal) {
            if (link.getAttribute('data-no-ext-confirm') !== null) return;
            e.preventDefault();
            showExtLinkModal(link.href);
            return;
        }

        if (link.target === '_blank') return;

        var url = link.href;
        if (!url || url === window.location.href) return;

        e.preventDefault();
        startProgress();

        requestAnimationFrame(function() {
            window.location.href = url;
        });
    }

    document.addEventListener('click', handleNavigation);

    if (progressBar) {
        window.addEventListener('load', function() {
            progressBar.style.width = '100%';
            setTimeout(function() { progressBar.style.opacity = '0'; }, 300);
        });
    }
})();

// ---------- 微信二维码弹窗 ----------
//
// 概述：点击（或悬停）微信图标/卡片 → 居中弹出双二维码弹窗
//
// 交互策略：
//   - 默认（index.html 微信图标）：桌面端 hover 鼠标移入图标 → 弹出 / 移出图标 → 0.15s 延迟关闭
//   - data-wechat-trigger="click"（links.html 等）：全设备（含桌面）均走 click toggle
//   - 移动端（触屏）：统一 click toggle，hover 事件被屏蔽
//
// 弹窗内图片加载时机：
//   - HTML 中 <img loading="lazy"> 仅在弹窗 .active 后浏览器才判定为"接近视口"开始下载
//   - 弹窗隐藏时 opacity:0 + pointer-events:none，图片不下载，不消耗带宽
//   - 首次打开后图片由浏览器缓存，后续再开瞬时显示无需重新下载
//
// 关闭方式（全部设备通用）：
//   - 点击半透明遮罩 → onclick="hideWechatQR()"
//   - 点击右上角 × 按钮 → onclick="hideWechatQR()"
//   - 移动端 / clickOnly 模式下再次点击触发元素 → toggle 关闭
//   - 按下 ESC 键 → keydown 监听
//   - hover 模式下鼠标完全移出触发元素 + 弹窗 → 0.15s 后自动关闭
//
// 设备检测：
//   用一次性 window.touchstart 事件标记 isTouchDevice=true
//   标记后不再触发 mouseenter/mouseleave 逻辑，避免桌面端触屏设备误走 hover

(function() {
    // 弹窗 DOM 引用
    var overlay = document.getElementById('wechatQROverlay');
    var popup = document.getElementById('wechatQRPopup');
    if (!overlay || !popup) return;          // 页面无弹窗结构则跳过

    var triggers = document.querySelectorAll('.wechat-trigger');
    if (!triggers.length) return;            // 无触发元素则跳过

    var hideTimer = null;                    // hover 模式延迟关闭定时器
    var isTouchDevice = false;               // 触摸设备标记

    function showQR() {
        clearTimeout(hideTimer);
        overlay.classList.add('active');
        popup.classList.add('active');
    }

    function hideQR() {
        hideTimer = setTimeout(function() {
            overlay.classList.remove('active');
            popup.classList.remove('active');
        }, 150);
    }

    function hideQRImmediate() {
        clearTimeout(hideTimer);
        overlay.classList.remove('active');
        popup.classList.remove('active');
    }

    function toggleQR() {
        if (popup.classList.contains('active')) {
            hideQRImmediate();
        } else {
            showQR();
        }
    }

    window.hideWechatQR = hideQRImmediate;

    window.addEventListener('touchstart', function once() {
        isTouchDevice = true;
    }, { once: true, passive: true });

    triggers.forEach(function(trigger) {
        var clickOnly = trigger.getAttribute('data-wechat-trigger') === 'click';

        if (clickOnly) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                toggleQR();
            });
        } else {
            trigger.addEventListener('mouseenter', function() {
                if (isTouchDevice) return;
                showQR();
            });

            trigger.addEventListener('mouseleave', function() {
                if (isTouchDevice) return;
                hideQR();
            });

            trigger.addEventListener('click', function(e) {
                if (!isTouchDevice) return;
                e.preventDefault();
                toggleQR();
            });
        }
    });

    // 鼠标移入弹窗时取消关闭定时器，保持弹窗可见（hover 模式下才有意义）
    popup.addEventListener('mouseenter', function() {
        if (isTouchDevice) return;
        clearTimeout(hideTimer);
    });

    // 鼠标移出弹窗时重新开始延迟关闭
    popup.addEventListener('mouseleave', function() {
        if (isTouchDevice) return;
        hideQR();
    });

    // ESC 键立即关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            hideQRImmediate();
        }
    });
})();
