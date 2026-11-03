# StudySteady

StudySteady 是一个学习计划管理项目，可以按项目整理任务、安排截止日期、记录专注时长和查看学习统计。网页使用 Vue 3 开发，Android 端通过 uni-app 的 WebView 加载网页。学习数据保存在浏览器或 App 的 LocalStorage 中，无需注册账号。

仓库包含两个工程，分别安装依赖、运行和构建：

| 工程    | 目录             | 技术栈                                                  |
| ------- | ---------------- | ------------------------------------------------------- |
| 网页    | 仓库根目录       | Vue 3、Vue Router 4、Vite 7、Lucide，图表使用 SVG / CSS |
| Android | `android-app/` | uni-app Vue 3、Vite 5、原生 WebView                     |

- [网页运行](#网页运行)
- [Android 运行](#android-运行)
- [页面功能](#页面功能)
- [代码结构](#代码结构)
- [数据与计时](#数据与计时)
- [测试与构建](#测试与构建)
- [源码阅读与练习](#源码阅读与练习)
- [相关文档](#相关文档)

## 网页运行

环境要求：Node.js 22.12.0 或更新版本，`.nvmrc` 中指定了 22.12.0。

在仓库根目录执行：

```sh
npm ci
npm run dev
```

打开终端给出的地址，默认是 `http://localhost:5173`。首次打开会生成 4 个项目、24 个任务和专注记录，日期按当天计算。可以直接编辑这些内容，也可以在设置页清空学习数据。

端口被占用时，可用 `npm run dev -- --port 5174` 指定端口。

## Android 运行

`android-app/` 是独立的 uni-app Vue 3 CLI 工程，启动页用 `<web-view>` 加载 `https://studysteady.pages.dev/`。任务、日历、统计和计时由网页处理，uni-app 负责显示网页和调整原生窗口。

网页地址配置在 [index.vue](android-app/src/pages/index/index.vue) 的 `websiteUrl` 中。本地修改网页后，需要发布到该地址，再重新加载 App。当前工程在线加载网页，冷启动需要网络。

### 安装与编译

从仓库根目录进入 Android 工程：

```sh
cd android-app
npm ci
npm run build:app
```

`build:app` 生成 `android-app/dist/build/app/` 下的 App 资源。运行到手机和打包 APK 使用 HBuilderX。

在 `android-app/` 中还可以运行：

| 命令                                               | 用途                                     |
| -------------------------------------------------- | ---------------------------------------- |
| `npm run dev:app`                                | 开发编译 App 资源                        |
| `npm run build:h5`                               | 构建 H5，输出到 `dist/build/h5/`       |
| `npm run dev:h5 -- --host 127.0.0.1 --port 5174` | 在浏览器预览承载页，网页通过 iframe 加载 |

DCloud 编译包统一固定为 `3.0.0-5020620260917001`，完整依赖版本见 [package-lock.json](android-app/package-lock.json)。

### 运行到 Android 手机

1. 使用 HBuilderX App 开发版打开 `android-app/`。
2. 登录对应的 DCloud 账号，使用 [manifest.json](android-app/src/manifest.json) 中已有的 AppID。
3. 手机开启开发者选项和 USB 调试，连接电脑并允许调试；也可以使用 Android 模拟器。
4. 选择“运行 → 运行到手机或模拟器 → Android”，使用与编译器版本配套的标准运行基座。
5. 打开各页面，创建、编辑并完成一项任务；结束基座进程后重新打开，检查任务是否保留。

连接失败时，检查设备授权、驱动和 HBuilderX / ADB 连接；提示基座版本不一致时，更新配套基座。

### WebView 适配

[pages.json](android-app/src/pages.json) 注册一个启动页，导航栏设为自定义样式。网页内部的五个页面仍使用 Vue Router 切换。

[index.vue](android-app/src/pages/index/index.vue) 在 Android 沉浸式状态栏下读取状态栏高度，设置原生 WebView 的 `top`；`bottom` 固定为 `0px`，让内容铺满剩余区域。首次渲染前、回到前台和窗口尺寸变化时都会更新。原生逻辑通过 `APP-PLUS` 条件编译，H5 使用普通 iframe 布局。

壳层使用白色背景和深色状态栏文字。状态栏颜色随网页主题切换、原生文件桥接、返回键定制和离线缓存尚未实现。

2026-10-30 已在一台 Redmi 手机的标准基座上检查状态栏、滚动、输入、软键盘和前后台切换。独立 APK、多设备、完整任务操作、结束进程后的数据恢复和文件导入导出待验证。设备信息和操作记录见 [Android 验证记录](android-app/VERIFICATION.md)。

## 页面功能

| 路径           | 页面       | 功能                                                         |
| -------------- | ---------- | ------------------------------------------------------------ |
| `/`          | 学习总览   | 今日清单、周日期切换、项目进度、近期安排、逾期任务、专注计时 |
| `/projects`  | 项目与任务 | 项目和任务增删改查、搜索筛选、排序、列表与看板切换           |
| `/calendar`  | 学习日历   | 月份切换、按天查看和新建任务、修改截止日期                   |
| `/analytics` | 学习统计   | 7 / 30 天统计、专注柱图、完成率、活动热图、项目进度          |
| `/settings`  | 偏好设置   | 昵称、学习目标、专注时长、主题、JSON 备份恢复、清空数据      |

其他地址显示 404 页面。窄屏下从顶栏菜单打开导航；看板支持拖动任务卡，也可以通过状态选择器修改任务。弹窗支持 `Tab` / `Shift+Tab` 切换焦点、`Esc` 关闭。

## 代码结构

```text
src/
  main.js                 网页入口
  App.vue                 页面布局、主题、全局弹窗、计时器初始化
  router/index.js         网页路由，按需加载页面
  views/                  五个主页面和 404 页面
  stores/study.js         业务状态、数据操作、持久化、导入校验
  composables/
    useFocusTimer.js      共享专注计时器
  utils/date.js           本地日历日期处理
  data/demo.js            演示数据
  components/
    layout/               侧栏、顶栏
    dashboard/            周日期条、计时面板
    projects/             项目卡片、项目编辑器
    tasks/                任务列表、看板、筛选器、任务编辑器
    calendar/             月历网格
    analytics/            柱状图、完成率环、活动热图
    settings/             主题选择器
    ui/                   弹窗、确认框、提示等公共组件
  assets/styles.css       主题变量、全局布局、响应式样式
public/                   静态文件和 SPA 路由回退配置
tests/                    单元测试、浏览器流程测试
scripts/                  页面数量和组件依赖检查
android-app/
  src/main.js             uni-app 入口
  src/App.vue             应用生命周期
  src/pages/index/
    index.vue             WebView 地址和 Android 状态栏适配
  src/pages.json          启动页配置
  src/manifest.json       应用信息、AppID、Android 联网权限
  vite.config.js          uni-app 编译配置
  VERIFICATION.md         Android 验证记录
```

两个工程各有 `package.json` 和锁文件。依赖与构建输出分别放在各自目录的 `node_modules/` 和 `dist/` 中。

## 数据与计时

### 状态管理

[study.js](src/stores/study.js) 用模块级 `reactive` 对象保存共享状态。所有页面调用 `useStudyStore()` 获取同一份数据。

| 数据         | 内容                                                             |
| ------------ | ---------------------------------------------------------------- |
| `projects` | 项目名称、描述、颜色、图标、分类、截止日期                       |
| `tasks`    | 标题、描述、所属项目、截止日期、优先级、状态、预计时长、完成时间 |
| `sessions` | 专注日期、时长、关联任务                                         |
| `settings` | 昵称、每日目标、专注时长、主题                                   |

任务状态为 `todo`、`in-progress`、`done`；优先级为 `high`、`medium`、`low`；主题为 `light`、`dark`、`system`。弹窗、提示和确认框放在 `ui` 中，仅用于当前界面。

以新建任务为例：

```text
TaskEditor 提交表单
  → saveTask() 校验并更新 state
  → 总览、项目、日历和统计随数据变化更新
  → 深度 watch 将 state 写入 LocalStorage
```

任务和项目通过 `saveTask()`、`saveProject()` 等方法修改，设置页和主题组件直接更新 `state.settings`。删除项目会保留任务并解除项目关联；删除任务会保留已有专注记录并解除任务关联。

日期使用本地日历的 `YYYY-MM-DD`，创建和完成时间使用 ISO 时间戳。“逾期”按截止日期和当前状态计算，“今日完成”按 `completedAt` 统计。日期工具集中在 [date.js](src/utils/date.js)。

### 专注计时

[useFocusTimer.js](src/composables/useFocusTimer.js) 在 `App.vue` 中初始化，切换页面时继续计时。运行时记录截止时间戳，并用当前时间计算剩余秒数；暂停状态和计时进度会单独保存，刷新后恢复。

完成一轮专注后写入 `sessions`，按记录编号去重。导入、恢复演示或清空数据会重置计时器；空闲或暂停时修改专注时长，也会重置为新时长。

### 本地保存与备份

| LocalStorage 键          | 内容                             |
| ------------------------ | -------------------------------- |
| `studysteady:v1`       | 项目、任务、专注记录和设置       |
| `studysteady-focus-v1` | 当前计时进度、截止时间和关联任务 |

数据按浏览器或 WebView 的存储空间、网站来源（协议、域名、端口）分别保存。浏览器与 Android App 各自保存数据，跨设备迁移可在设置页导出、导入 JSON 备份。导入时先检查 JSON 语法，确认替换后校验字段、编号和关联关系，通过后写入。

本地数据读取失败时，页面会显示演示数据并提示。需要恢复原始内容时，应在继续操作前从开发者工具复制 `studysteady:v1` 的原值，再使用有效备份恢复；后续操作会触发保存。设置页导出的是当前页面中的数据。

## 测试与构建

以下命令在仓库根目录执行：

| 命令                 | 用途                             |
| -------------------- | -------------------------------- |
| `npm test`         | 运行数据层、日期和计时器单元测试 |
| `npm run audit`    | 检查主页面数量和 Vue 组件依赖    |
| `npm run build`    | 构建网页到 `dist/`             |
| `npm run preview`  | 本地预览网页构建结果             |
| `npm run test:e2e` | 运行 Playwright 浏览器流程测试   |

浏览器测试首次使用前执行 `npx playwright install chromium`。在一个终端启动 `npm run dev`，再在另一个终端运行 `npm run test:e2e`。默认测试地址是 `http://127.0.0.1:5173`，可通过 `BASE_URL` 环境变量修改。

网页部署时，将静态站点的构建命令设为 `npm run build`，发布目录设为 `dist/`，并配置 SPA 路由回退。仓库提供了 `netlify.toml` 和 `public/_redirects`。

已有测试结果和复现条件见 [网页验收记录](VERIFICATION.md)，App / H5 构建及真机检查见 [Android 验证记录](android-app/VERIFICATION.md)。

## 源码阅读与练习

阅读网页源码可以从 `src/main.js`、`src/router/index.js` 和 `src/App.vue` 开始，再看 `src/stores/study.js`。随后选择一个操作，结合表单组件、store 方法和对应页面追踪数据变化。

| 内容                     | 代码入口                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 表单、校验、组件通信     | [TaskEditor.vue](src/components/tasks/TaskEditor.vue)、[TaskFilters.vue](src/components/tasks/TaskFilters.vue) |
| 计算属性、筛选、URL 参数 | [ProjectsView.vue](src/views/ProjectsView.vue)、[AnalyticsView.vue](src/views/AnalyticsView.vue)               |
| 生命周期、焦点、键盘操作 | [BaseModal.vue](src/components/ui/BaseModal.vue)                                                              |
| 组合式函数、计时恢复     | [useFocusTimer.js](src/composables/useFocusTimer.js)                                                          |
| 主题、响应式布局         | [styles.css](src/assets/styles.css)、[ThemePicker.vue](src/components/settings/ThemePicker.vue)                |
| uni-app 页面与条件编译   | [pages.json](android-app/src/pages.json)、[index.vue](android-app/src/pages/index/index.vue)                   |

项目筛选与 URL 的 `project` 参数双向同步。`search`、`status` 从 URL 读取，页面内修改这两项时只更新本地筛选；顶栏搜索会跳转到带 `search` 参数的项目页。

练习可以从调整主题变量开始，再尝试为任务增加标签字段，或新增 `/review` 每周复盘页。修改数据字段时，同时检查保存、导入校验、表单和展示组件；完成后检查刷新恢复和其他页面的统计。

## 相关文档

- [设计说明](DESIGN_NOTES.md)：页面设计与交互
- [Vue 知识点索引](VUE_COVERAGE.md)：知识点与代码位置
- [课堂讲解与答辩准备](课堂讲解与答辩准备.md)：讲稿、演示步骤和问答
- [路由与功能组件重点讲解](路由与功能组件重点讲解.md)：路由、组件通信和任务操作
- [网页验收记录](VERIFICATION.md)、[Android 验证记录](android-app/VERIFICATION.md)：各次检查结果
- uni-app 官方文档：[Vue 3 CLI 工程](https://uniapp.dcloud.net.cn/quickstart-cli.html)、[web-view 组件](https://uniapp.dcloud.net.cn/component/web-view.html)、[App 真机运行](https://uniapp.dcloud.net.cn/tutorial/run/run-app.html)
