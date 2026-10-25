# StudySteady

面向大学生的个人学习工作台。以 Vue 3、Vite、Vue Router 和 Composition API 构建，提供完整的本地学习管理体验，无需登录或后端。

## 本地运行

需要 Node.js **22.12.0 或更新版本**。

```sh
npm install
npm run dev
```

打开终端显示的本地地址。生产构建与预览：

```sh
npm run build
npm run preview
```

生产文件输出到 `dist/`。

## 页面与功能

| 路径         | 页面       | 功能                                                        |
| ------------ | ---------- | ----------------------------------------------------------- |
| `/`          | 学习总览   | 今日清单、本周日期、项目进度、近期安排、专注计时与每日目标  |
| `/projects`  | 项目与任务 | 项目及任务增删改查、搜索筛选、排序、列表与可拖拽看板        |
| `/calendar`  | 学习日历   | 月份切换、按日查看任务、为选中日期安排任务与修改截止日期    |
| `/analytics` | 学习统计   | 7/30 天统计、专注柱图、完成率、活动热图与项目进度           |
| `/settings`  | 偏好设置   | 日间/夜间/系统主题、学习目标、JSON 备份恢复、演示重置与清空 |

另有真正的 404 路由。桌面与移动布局均可使用，弹窗支持 Esc、焦点管理和键盘操作；看板可通过状态选择器操作。

首次打开提供 4 个项目、24 项任务与历史专注记录，日期相对首次打开当天生成。在设置中可以清空演示后正式使用，也可以随时恢复演示。

## 数据保存

项目、任务、记录和设置自动写入 LocalStorage（`studysteady:v1`）；专注计时单独保存，刷新后可以继续。

数据属于**当前浏览器与当前网站地址**，不会自动跨设备同步。本地预览、正式域名和不同浏览器分别保存自己的数据。换设备或清理浏览器前，请在设置中导出 JSON，再在目标设备导入。导入会校验数据结构并要求确认；无效备份不会覆盖现有数据。

## 验证与课程验收

```sh
npm test
npm run audit
npm run test:e2e
npm run build
```

`npm test` 包含 12 项测试，检查任务操作、持久化、备份校验、日期运算与专注计时恢复。`npm run audit` 从入口递归核对导入依赖图，复现 5 个主页面与 30 个实际使用 SFC 的数量审计。浏览器验证使用 Playwright：首次运行 `npx playwright install chromium` 安装 Chromium，另开终端执行 `npm run dev`，确认 `http://127.0.0.1:5173` 可访问后运行 `npm run test:e2e`；也可通过 `BASE_URL` 指向正在运行的其他预览地址。

项目包含 **5 个主页面 + 1 个 404 页面、30 个实际参与渲染的 Vue SFC**。其中 23 个为职责独立的子组件，另有 6 个路由视图与根组件。教程知识点、代码位置及操作步骤见 [VUE_COVERAGE.md](VUE_COVERAGE.md)，产品取舍见 [DESIGN_NOTES.md](DESIGN_NOTES.md)，实际验证结果见 [VERIFICATION.md](VERIFICATION.md)。

## Netlify 部署

**从 Git 仓库部署：** 将此项目上传到 Git 仓库，在 Netlify 导入项目。构建命令使用 `npm run build`，发布目录使用 `dist`；项目已通过 `netlify.toml` 指定这些参数及 Node 22。

**直接拖拽部署：** 本地运行 `npm run build`，将生成的整个 `dist` 文件夹拖入 Netlify 的手动部署入口。

`netlify.toml` 与构建时复制到 `dist/_redirects` 的 `public/_redirects` 均配置了 SPA 回退。部署后直接访问或刷新 `/projects`、`/calendar` 等地址，会返回应用入口并由 Vue Router 渲染对应页面。无需设置环境变量或数据库。

## 主要目录

```text
src/
  components/    布局、任务、项目、日历、统计与通用组件
  views/         五个主页面与 404
  stores/        响应式单一数据源与 LocalStorage
  composables/   跨页面的专注计时与恢复
  data/          相对日期的演示数据
  utils/         本地日期工具
  router/        Vue Router 页面导航
  assets/        统一视觉样式
tests/           数据层与浏览器验证
```

图标使用 Lucide。图表使用 SVG 与 CSS，无外部数据服务依赖。
