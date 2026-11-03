# StudySteady 验收记录

## 2026-10-30：当前工作区复核

网页使用当前工作区源码；浏览器流程通过仅监听本机的 Vite 开发服务器和独立 Chromium 会话运行，不读取用户浏览器配置或数据。表中的 Android 构建命令在 `android-app/` 目录执行。

| 检查 | 本次结果 | 范围 |
| --- | --- | --- |
| `npm test` | 12 项通过 | 数据、日期和专注计时的单元测试 |
| `npm run audit` | 5 个主页面；30 / 30 个网页 Vue 组件在入口依赖图中可达 | 不包含独立 Android 工程，也不是依赖漏洞扫描 |
| `npm run build` | 成功 | 网页生产资源构建 |
| `npm run test:e2e` | 16 组通过，无页面运行错误 | 本机开发服务器与隔离 Chromium，覆盖主要业务、窄屏和弹窗键盘流程 |
| Android `npm run build:app` / `npm run build:h5` | 均成功 | 分别生成 App 和 H5 资源，不等于生成或验证独立 APK |

Android 既有真机检查的设备、日期和未覆盖范围见 [Android 验证记录](android-app/VERIFICATION.md)；上述构建没有重新执行真机回归，也不能证明远程网站已经包含当前本地网页修改。

## 2026-10-25：网页历史验收

验证日期：2026-10-25。浏览器测试使用独立 Chromium 会话，不影响用户浏览器数据。

| 验收项 | 实际结果 | 复现方式 |
| --- | --- | --- |
| 独立页面 ≥ 3 | 5 个主页面，另有 404 页面；Vue Router History 导航 | `npm run audit` |
| 实际使用 Vue SFC ≥ 15 | 30 / 30 个 SFC 可从入口依赖图访问，无孤立组件 | `npm run audit` |
| Vue 教程知识点 | 15 项均用于真实业务，含 Props、Emits、Slots、模板引用等 | `VUE_COVERAGE.md` |
| 数据层和计时 | 12 项测试全部通过 | `npm test` |
| 浏览器业务流程 | 16 组全部通过；开发服务和生产预览均通过，零页面运行错误 | `npm run test:e2e` |
| 生产构建 | Vite 构建成功，页面按路由分块，输出 `dist/` | `npm run build` |
| 移动端 | 390px 五页无横向溢出；360px 项目按钮、日历和任务编辑可用 | 浏览器测试第 15–16 组 |
| 键盘可访问性 | 自动聚焦、Tab/Shift+Tab 焦点循环、Esc 关闭及返回触发按钮 | 浏览器测试第 16 组 |
| Netlify 部署 | 构建参数、Node 版本与 SPA 回退已配置；`dist/_redirects` 随构建生成 | `netlify.toml`、`public/_redirects` |

浏览器验证覆盖：任务和项目增删改查、完成及重新打开、刷新恢复、搜索及组合筛选、看板拖拽和状态选择、删除项目保留任务、日历月份和截止日期、昵称及主题、JSON 导出导入、无效备份保护、取消清空、恢复演示和空数据页面。

数据层验证额外覆盖：跨月和闰年日期、损坏存储恢复、专注暂停和刷新恢复、截止日期记账、防重复记录、重置数据取消计时，以及删除关联任务后保留专注。

生产预览复测：先执行 `npm run build` 与 `npm run preview -- --port 4173`，再将 `BASE_URL` 环境变量设为 `http://127.0.0.1:4173` 并执行 `npm run test:e2e`。
