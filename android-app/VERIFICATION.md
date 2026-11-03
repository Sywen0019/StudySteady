# 最小封装阶段验证记录

## 当前结论（截至 2026-10-30）

| 检查层级 | 已有结果 | 不能证明什么 |
| --- | --- | --- |
| App / H5 资源构建 | 当前工程的 `npm run build:app` 和 `npm run build:h5` 均成功 | App 资源不是独立 APK；构建成功不代表真机业务均可用 |
| H5 浏览器 | 记录过 iframe 加载远程网页的检查；旧域名还做过隔离浏览器业务流程 | H5 使用 iframe，不能代替 Android WebView、软键盘和文件系统验证 |
| Android 真机 | 2026-10-30 在一台 Redmi、标准运行基座上检查状态栏避让、四个页面的滚动、输入、软键盘和前后台切换，资源同步前后的已有数据保留 | 未完成独立 APK、多设备、完整任务增删改查、结束进程后重启持久化和文件导入导出验证 |

当前壳加载配置中的远程地址；本地网页工作区的修改是否已发布到该地址不由这些构建结果证明。以下保留各次检查的日期和当时条件，较早的待测清单不代表后续从未进行真机检查。

## 2026-10-30：Android 顶部状态栏重叠修复

### 最终实现

- 仅修改壳层承载页和 pages.json；保留 `navigationStyle: custom`、现有 AppID、manifest 和 https://studysteady.pages.dev/ 加载地址。
- Android 沉浸式模式下，首次渲染前及页面 onShow/onResize 时读取 `uni.getWindowInfo().statusBarHeight`，通过响应式 `webview-styles` 设置原生 WebView 的 top；非沉浸式时为 0。bottom 固定为 0px，不设置固定高度。
- 壳层背景为白色，状态栏文字为深色。真机测试发现额外配置 `app-plus.statusbar.background` 会在键盘/恢复前台时让父窗口也避让状态栏，造成两次留白；最终移除了该配置，统一由子 WebView 的 top 避让，保留壳层背景色。
- Android/HTML5+ 逻辑通过 APP-PLUS 条件编译隔离，H5 不引用 plus，也不增加顶部空白。

### 构建与 H5

- 最终版本 `npm run build:app` 与 `npm run build:h5` 均退出码 0；未进行正式 APK 打包。
- H5 浏览器检查：390×844 的 iframe 从 y=0 开始、铺满 844px 高度，加载正确网站并显示首页，pageErrors=[]。

### Android 真机结果

- 设备：Redmi 23113RKC6C，Android 16 / API 36，1440×3200；HBuilderX 5.34 已安装的标准运行基座。
- HBuilderX CLI 可编译，但 USB/ADB 连接间歇重连，运行同步多次提示 device not found。用户确认网站可打开后，检查发现仍为旧缓存资源。先备份设备原脚本，再通过 ADB 仅同步 App 构建产生的 app-service.js / app-config-service.js 至现有标准基座并重启运行时；没有卸载、清除数据或替换设备端 manifest。
- 以下验证通过真实 Android WebView 的 DevTools、原生窗口信息、触摸/输入事件和设备截图进行，不属于 H5 浏览器模拟。

| 检查 | 真机实际结果 |
| --- | --- |
| 初始顶部避让 | WebView top 约 38.86 逻辑像素（约 136 物理像素），网页可用高度从约 914 变为 875；导航、搜索、用户区域均完整位于状态栏下方 |
| 页面与菜单 | 总览、项目与任务、日历、统计均能通过菜单访问，切换后偏移一致 |
| 底部滚动 | 四个页面均达到文档底部，未因顶部偏移裁切底部内容 |
| 编辑器与搜索输入 | 编辑弹窗和搜索框可聚焦，并通过 WebView 文本输入事件接收测试文字；任务草稿取消，搜索文字清空，未提交新任务 |
| 真实软键盘 | 通过触摸及原生输入法显示/隐藏接口验证；显示后可用高度约 490，输入框在可见区域内；隐藏后恢复 875 |
| 前后台切换 | 回桌面后通过标准基座公开启动入口返回，最终高度 875、顶部约 136 物理像素，未出现双重留白；WebView target ID 与文档 timeOrigin 保持一致 |
| 数据保留 | 最终资源同步前后按字段排序后比对项目、任务、设置及已有专注记录内容，均保留；4 项目、24 任务、24 专注记录，没有卸载或清理数据 |

真机截图：`.verification/android-after.png`。布局、键盘和数据比对的临时检查结果保留在 `.verification/`，该目录已忽略。

### 未验证范围

- 未生成独立 APK，尚未验证独立安装包、其他手机/OEM、非沉浸式设备、横屏或分屏。
- 本次未实现状态栏颜色随网页主题联动；白色状态栏背景是本轮默认方案。
- 系统返回键策略、文件桥接和完整业务回归不在本次修复范围。后续恢复 HBuilderX 自动同步时，须确认使用当前源码，避免重新加载旧缓存产物。

## 2026-10-30：承载地址切换

- 按要求将 WebView 地址改为 https://studysteady.pages.dev/ ，同步 README；没有改动网站源码或部署配置。
- 新域名首页与 `/calendar` 均返回 HTTP 200，本次响应未见 X-Frame-Options 或 Content-Security-Policy 限制。
- `npm run build:app`、`npm run build:h5` 重新编译成功，生成产物已使用新地址；仍未生成 APK。
- 用临时本地服务加载新 H5 产物，在隔离 Chromium 的 390×844 视口中确认 iframe 地址正确、首页主标题“慢慢来，同学。”可见，pageErrors=[]。临时服务和浏览器已关闭。
- 这次仅验证新地址可访问及 H5 iframe 可加载，没有重新测试全部业务，也没有执行 Android 真机/模拟器验证。
- 域名变化后使用新的 LocalStorage 数据空间，旧域名数据不会自动迁移。

以下各节为 **2026-10-29 旧域名的历史验证和当时的待测计划**，不能视为新域名的全部业务验证结果；与后来的 Android 真机记录不冲突。

日期：2026-10-29（Asia/Shanghai）。本阶段仅建立远程 WebView 工程和验证当前环境允许的链路，不涉及正式 APK。

## 2026-10-29（历史）：网站与原项目

- Sites 只读查询：站点 active、public，地址为 https://studysteady-learning-desk.dreamyocean258.chatgpt.site/ 。没有重新部署或修改访问权限。
- 原项目仍为 Vue 3、Vue Router、Vite、Lucide 的纯前端网站，具有总览、项目与任务、日历、统计和设置页面；数据保存在 LocalStorage。
- 新代码全部位于 `android-app/`。原 `src/`、`public/`、package.json、package-lock.json、Vite/Netlify/Sites 配置没有修改。

## 2026-10-29（历史）：环境与构建

| 检查 | 实际结果 | 能证明什么 |
| --- | --- | --- |
| Node / npm | v24.14.1 / 11.11.0 | 可安装独立 CLI 工程依赖 |
| Java | Oracle JDK 23.0.2 | 仅确认 Java 存在，不代表 Android 打包环境就绪 |
| HBuilderX | PATH、常见安装目录、安装记录和运行进程中未找到 | 当时无法使用 HBuilderX 标准基座运行 |
| Android 工具 | 未找到 Android SDK、adb、emulator 或 Android Studio | 无法执行 adb devices 或模拟器调试 |
| 设备 | PnP 未发现 Android/ADB/MTP 设备 | 没有可用于本轮测试的 Android 设备；未启动 ADB server |
| npm install --no-audit --no-fund | 成功，仅安装在本目录；生成 package-lock.json | 独立依赖可解析 |
| npm run build:app | 退出码 0，Build complete，生成 dist/build/app/ | App 资源编译通过，不是 APK，不代表 Android 已运行 |
| npm run build:h5 | 退出码 0，Build complete，生成 dist/build/h5/ | H5 资源编译通过，不代表 Android 已运行 |

环境检查限于 PATH、常见位置、安装记录、有限软件目录和当前进程/设备，没有全盘扫描，也未安装 HBuilderX 或大型 Android 工具链。

当时 `src/manifest.json` 的 DCloud AppID 为空，与官方模板一致；当时计划在需要时登录并获取真实 AppID。现在该文件已配置 AppID，仍未据此证明已完成正式包名、签名或发行流程。

## 2026-10-29（历史）：H5 浏览器检查

使用已有 Playwright Chromium，全新隔离上下文，390×844、isMobile/hasTouch；没有读取或更改用户已有浏览器数据，没有运行原项目完整 E2E。

| 项目 | 浏览器中的实际结果 |
| --- | --- |
| 四页面 | 总览、项目与任务、日历、统计均 HTTP 200 且可见主标题 |
| 窄屏布局 | 四页面 scrollWidth=390，无横向溢出 |
| 菜单与滚动 | 从统计菜单进入项目页成功；页面可滚动，观测 scrollY=1914 |
| 任务基本操作 | 成功创建、编辑标题、完成；LocalStorage 中 status=done 且存在 completedAt |
| 页面刷新 | 测试任务仍存在 |
| 关闭标签页再打开 | 同一浏览器上下文内，任务仍为已完成；不是浏览器进程或 App 进程重启验证 |
| JSON 导出观察 | 触发浏览器下载事件，文件名 StudySteady-backup-2026-10-29.json；未检查 Android 下载目录 |
| JSON 导入观察 | 使用内存备份到达替换确认框，取消；未覆盖导入，未验证系统文件选择器 |
| 网络异常观察 | 模拟断网后刷新设置页，net::ERR_INTERNET_DISCONNECTED；远程网页无离线启动保障 |
| 运行异常 | pageErrors=[]、consoleErrors=[]；唯一请求失败来自主动断网 |

这些结果均为 H5 浏览器结果，不能作为 Android WebView 通过证据。没有真实软键盘、Android 返回键、App 安全区或 Android 文件系统参与。

另用临时 localhost 服务检查本工程 `dist/build/h5/`：外层返回 200，生成 390×844 iframe，src 指向正确公网地址；嵌入页返回 200 并显示“慢慢来，同学。”，可通过内嵌菜单跳转学习日历。此次未见 X-Frame-Options/CSP 拒绝嵌入，pageErrors、consoleErrors 和失败请求均为空。这仅验证 H5 产物的 iframe 承载链路；测试浏览器及临时服务均已关闭。

## 2026-10-29（历史）：当时未完成的 Android 验证

当时真机和模拟器均未运行，以下为当时的待测清单；其中状态栏、页面、输入和前后台切换后来已按上方 2026-10-30 的范围检查：

- App 启动、远程网站加载与设备网络可达性。
- 四个主页面在 Android WebView 中的布局、滚动、点击、输入和渲染。
- Android 中任务创建、编辑和完成。
- 结束 App/基座进程后重开，本地任务是否保留。
- Android 返回键与网页历史、菜单、弹窗的实际关系。
- 软键盘遮挡、页面刷新、JSON 文件选择/保存及断网表现。

## 2026-10-29（历史）：当时的接续优先级

视觉升级前的关键验证：准备 HBuilderX 和 Android 设备，按 README 的最短步骤补做启动、加载、任务操作和进程重启持久化；如有阻止基本使用的问题，先定位并记录。当时未发现需要改动原网站的已确认关键代码故障，Android 也尚未实测。

视觉升级完成后再处理：文件桥接、返回键细节、状态栏/安全区视觉、图标/启动页、正式包名与签名、发行 APK 和课程演示。本阶段没有实现这些内容，也没有自动切换迁移方案。

当时环境可完成的部分已完成，Android 实测受环境阻碍；保留工程与锁文件，暂停进一步 App 适配。
