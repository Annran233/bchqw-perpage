# 使用手册（v2 重构版）

> 目标：5 分钟跑起来，改一个文件就能上线。

---

## 一、快速上线

### 1. 本地跑起来

```bash
npm install    # 安装依赖（只需一次）
npm run dev    # 启动开发服务器 → http://localhost:5173
```

看到首页就说明跑通了。`npm run build` 构建产物在 `dist/`，`npm run preview` 预览构建结果。

---

### 2. 改成你自己的网站（最小改动清单）

v2 的核心改进：**站点全局信息集中在 `src/data/site.js`，改一处全站生效。**

#### ① src/data/site.js — 改站名、域名、版权、OG 图片

```js
export const site = {
  name: '你的网站名',                              // ← 改
  domain: 'https://你的域名.com',                   // ← 改
  copyright: '©2020 - 2026 你的名字 All Rights Reserved', // ← 改
  ogImage: 'https://你的CDN/og-image.webp',        // ← 改
  icp: '你的ICP备案号',                             // ← 改
};
```

**改这一个文件 → top-bar、footer、sidebar、head 全部自动同步。**

#### ② src/data/pages.js — 改各页面标题和描述

把每个页面条目里的 `title`、`description`、`url` 换成你自己的。`bodyClass`、`currentPage`、`contentTitle` 一般不需要改。

#### ③ index.html — 改首页社交图标链接

找到 `.hero-social` 容器，替换 `<a href="...">` 的链接地址。不需要的平台删掉即可。

#### ④ links.html — 改联系方式

把 `.contact-cards` 里的每个 `<a>` 换成你自己的链接和用户名。

#### ⑤ main.js — 换 GA4 测量 ID（选做）

`public/js/main.js` 顶部常量：
```js
const GA_MEASUREMENT_ID = 'G-你的测量ID';
```

---

### 3. 构建并部署

```bash
npm run build          # 生成 dist/
```

把 `dist/` 部署到 Cloudflare Pages 或其他静态托管平台。Cloudflare Pages 配置：
- 框架预设：**Vite**
- 构建命令：`npm run build`
- 输出目录：`dist`

---

## 二、v2 与原版的区别

| 改进项 | 原版 (portfolio) | v2 (portfolio-v2) |
|--------|:---:|:---:|
| 站点全局变量 | 无，站名散落在 3 个文件中 | `src/data/site.js` 一处改全站生效 |
| 页面数据位置 | `vite.config.js` 内 168 行 | `src/data/pages.js` 独立文件 |
| 404 插件位置 | `vite.config.js` 内 40 行 | `src/plugins/serve-404.js` 独立文件 |
| vite.config.js | 238 行（配置+数据+插件混一起） | 34 行（纯构建声明） |
| 首页 top-bar | 内联 HTML | 使用 `{{> top-bar}}`，改 partial 全站同步 |
| 内容页骨架 | 6 个页面各自重复 35 行骨架 | `layout-top.hbs` + `layout-bottom.hbs` 包裹 |
| main.js 结构 | 单文件 639 行 | 单文件，按功能分区注释组织 |
| partial 硬编码 | top-bar/footer/sidebar/head 各有硬编码 | 全部变量化 `{{siteName}}` `{{copyright}}` `{{ogImage}}` |

---

## 三、模块详解

### 模块 1：数据层（src/data/）

**涉及文件**：

| 文件 | 作用 |
|------|------|
| `src/data/site.js` | 全站共享变量：站名、域名、版权、OG 图、ICP |
| `src/data/pages.js` | 每页 title/description/url 等，构建时自动注入 site 变量 |

site.js 的每一个字段都会作为 Handlebars 变量传入所有页面和 partial：

| 变量 | 来源 |
|------|------|
| `{{siteName}}` | `site.name` |
| `{{domain}}` | `site.domain` |
| `{{copyright}}` | `site.copyright` |
| `{{ogImage}}` | `site.ogImage` |
| `{{icp}}` | `site.icp` |

**新增页面**：在 `pages.js` 的 `rawPages` 中添加条目 + 在 `vite.config.js` 的 `rollupOptions.input` 中添加入口 + 创建 HTML。

---

### 模块 2：布局层（partials/）

**涉及文件**：

| 文件 | 作用 |
|------|------|
| `partials/head.hbs` | `<head>` meta/OG/字体预加载（OG 图来自 `{{ogImage}}`） |
| `partials/top-bar.hbs` | 顶部导航栏（logo 文字来自 `{{siteName}}`） |
| `partials/footer.hbs` | 页脚（版权来自 `{{copyright}}`，ICP 来自 `{{icp}}`） |
| `partials/sidebar.hbs` | 侧边栏导航 + 版权 |
| `partials/layout-top.hbs` | 内容页上半部骨架（doctype → `<h1>`） |
| `partials/layout-bottom.hbs` | 内容页下半部骨架（`</main>` → `</html>`） |
| `partials/cookie-banner.hbs` | Cookie 同意横幅 |
| `partials/wechat-popup.hbs` | 微信二维码弹窗 |
| `partials/external-link-modal.hbs` | 外站跳转确认弹窗 |

#### layout-top / layout-bottom 用法

**普通内容页**（about / projects / statements）：
```html
{{> layout-top}}
            <div class="content-body">
                <p>你的内容</p>
            </div>
{{> layout-bottom}}
```

**带 TOC 目录页**（privacy / AIGC-Statement）：
```html
{{> layout-top}}
                <div class="content-body">
                    <h2 id="sec-xxx">标题</h2>
                    <p>...</p>
                </div>
                <nav class="toc" id="toc">
                    <ul>
                        <li><a href="#sec-xxx">标题</a></li>
                    </ul>
                </nav>
{{> layout-bottom}}
```

> `layout-top.hbs` 根据 pageData 中的 `toc: true` 自动添加 `content-main--with-toc` 类和 `.content-layout` 包裹。

---

### 模块 3：首页（index.html）

**涉及文件**：`index.html`、`public/css/style.css`

使用 `{{> top-bar}}` 而非内联 HTML，Hero 标题也使用 `{{siteName}}` 变量：
```html
<h1 id="mainHeroText">{{siteName}}</h1>
```

社交图标在 `.hero-social` 中直接编辑 `<a href="...">`。

---

### 模块 4：联系方式页（links.html）

与首页社交图标类似，直接在 `.contact-cards` 中编辑链接和用户名。

Font Awesome 图标速查：

| 平台 | class |
|------|-------|
| GitHub | `fa-brands fa-github` |
| YouTube | `fa-brands fa-youtube` |
| Telegram | `fa-brands fa-telegram` |
| X/Twitter | `fa-brands fa-x-twitter` |
| 微博 | `fa-brands fa-weibo` |
| Bilibili | `fa-brands fa-bilibili` |
| 抖音 | `fa-brands fa-tiktok` |
| 微信 | `fa-brands fa-weixin` |
| Email | `fa-solid fa-envelope` |

---

### 模块 5：微信二维码弹窗

**涉及文件**：`partials/wechat-popup.hbs`

替换二维码图片：修改两处 `<img src="...">`。弹窗逻辑在 `public/js/main.js` 底部 IIFE 中。

触发方式：`data-wechat-trigger="click"` → 全设备 click；不加属性 → 桌面 hover / 移动 click。

---


### 模块 6：外站跳转确认弹窗

**涉及文件**：`partials/external-link-modal.hbs`、`public/js/main.js`

**作用**：点击指向其他域名的链接时，弹出确认弹窗防止钓鱼。

#### 域名豁免规则

`main.js` 中的 `sameSite()` 决定哪些域名**不弹窗**：

| 条件 | 示例 |
|------|------|
| 与当前页完全相同 | `chatongxue.top` → `chatongxue.top` |
| 当前域名的子域名 | `blog.chatongxue.top`（以 `.chatongxue.top` 结尾） |
| 页面 canonical 域名及其子域 | dev 模式 `localhost` 下也能正确豁免生产域名 |

代码位置 `main.js` 第 492-497 行：
```js
var canonicalEl = document.querySelector("link[rel=canonical]");
var canonicalHost = canonicalEl ? new URL(canonicalEl.href).hostname : "";
var currentHost = window.location.hostname;
function sameSite(h) { return h === currentHost || h.endsWith("." + currentHost) || h === canonicalHost || h.endsWith("." + canonicalHost); }
var isExternal = link.hostname && !sameSite(link.hostname);
```

> **修改方法**：如果你有多个域名（如 `.com` + `.cn`），在 `sameSite()` 中追加 `|| h.endsWith(".你的其他域名")` 即可。

#### 单链接跳过弹窗

给 `<a>` 加 `data-no-ext-confirm` 属性即可跳过（侧边栏博客链接已使用）：

```html
<a href="https://blog.chatongxue.top" data-no-ext-confirm>博客</a>
```

#### 修改弹窗文案

编辑 `partials/external-link-modal.hbs` 中的标题和提示文字。

---

### 模块 6：JavaScript

**涉及文件**：

| 文件 | 功能 |
|------|------|
| `public/js/main.js` | 主脚本（Cookie、主题、GA、一言、Hero 悬停、侧边栏、转场、TOC、外链确认、微信弹窗） |
| `public/js/404.js` | 404 页面精简脚本（Cookie、主题、侧边栏、外链确认） |

main.js 按功能分区组织，各模块通过注释分隔：
- Cookie 同意管理
- Google Analytics 加载/卸载
- 主题切换（auto/dark/light）
- 一言 API
- Hero 悬停交互
- 侧边栏
- TOC 目录高亮
- 外站跳转确认弹窗
- 页面转场动画 + 进度条
- 微信二维码弹窗

**暴露到 window 的函数**：`setCookieConsent`、`toggleDarkMode`、`toggleSidebar`、`changeHeroText`、`resetHeroText`、`hideWechatQR`、`closeExtLinkModal`

---

### 模块 7：SEO

| 文件 | 作用 |
|------|------|
| `src/data/pages.js` | 每页 title / description / canonical / OG |
| `partials/head.hbs` | 渲染 meta 标签（`{{ogImage}}` 变量化） |
| `public/robots.txt` | 爬虫规则（已排除 /404.html） |
| `public/sitemap.xml` | 站点地图 |

新增页面后需更新 `sitemap.xml`。

---

### 模块 8：404 页面

**涉及文件**：`404.html`、`public/css/404.css`、`public/js/404.js`

独立 CSS/JS，不引入公共资源。开发模式自动拦截，生产环境 Cloudflare Pages 自动使用。

---

### 模块 9：项目结构速览

```
portfolio-v2/
├── src/                        ← 构建期代码
│   ├── data/
│   │   ├── site.js             ← 全站全局变量（改这里）
│   │   └── pages.js            ← 每页 meta 数据
│   └── plugins/
│       └── serve-404.js        ← 404 中间件
│
├── partials/                   ← Handlebars 公共片段
│   ├── head.hbs
│   ├── top-bar.hbs
│   ├── footer.hbs
│   ├── sidebar.hbs
│   ├── layout-top.hbs          ← 内容页上半部骨架
│   ├── layout-bottom.hbs       ← 内容页下半部骨架
│   ├── cookie-banner.hbs
│   ├── wechat-popup.hbs
│   └── external-link-modal.hbs
│
├── public/                     ← 静态资源
│   ├── css/
│   │   ├── style.css
│   │   └── 404.css
│   ├── js/
│   │   ├── main.js             ← 主脚本（按功能分区注释组织）
│   │   └── 404.js              ← 404 页面精简脚本
│   ├── robots.txt
│   └── sitemap.xml
│
├── index.html
├── about.html
├── projects.html
├── links.html
├── statements.html
├── privacy.html
├── AIGC-Statement.html
├── 404.html
├── vite.config.js              ← 34 行纯构建声明
└── package.json
```

---

## 技术栈

| 组件 | 说明 |
|------|------|
| Vite 6 | 构建工具 |
| vite-plugin-handlebars | 模板引擎 |
| Font Awesome 6 | 图标（jsdmirror CDN） |
| Noto Sans SC | 主字体（上海交大镜像） |
| Google Analytics 4 | 可选分析 |
| 一言 API | 首页随机句子 |
