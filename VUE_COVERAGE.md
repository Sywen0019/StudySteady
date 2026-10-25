# Vue 课程知识点覆盖与验收

实现采用 Vue 3 Composition API 与 `<script setup>`。已参考 [Vue 官方互动教程](https://cn.vuejs.org/tutorial/) 及其 [官方中文源码](https://github.com/vuejs-translations/docs-zh-cn/tree/main/src/tutorial/src)，并将知识点用于真实业务。下列行号按当前源码核对，文件链接使用 GitHub 行号锚点。

## 规模与真实使用

路由定义见 [src/router/index.js:3](src/router/index.js#L3)：`/`、`/projects`、`/calendar`、`/analytics`、`/settings` 共 **5 个独立主页面**，另有 404 页；使用 `createWebHistory()`，入口通过 `RouterView` 渲染。

对 `src/main.js` 出发的静态导入、动态导入及目录入口进行依赖图核对：**30 个 `.vue` 文件，30 个可达，无孤立组件**。运行时按页面和交互需要渲染；弹窗会在新建、编辑及确认操作中使用。

| 位置                        |   数量 | 实际职责                                                                              |
| --------------------------- | -----: | ------------------------------------------------------------------------------------- |
| `src/App.vue`               |      1 | 全局布局、路由出口、主题与弹窗挂载                                                    |
| `src/views/`                |      6 | Dashboard、Projects、Calendar、Analytics、Settings、404                               |
| `src/components/layout/`    |      2 | AppSidebar、AppTopbar                                                                 |
| `src/components/dashboard/` |      2 | WeekStrip、FocusTimer                                                                 |
| `src/components/projects/`  |      2 | ProjectCard、ProjectEditor                                                            |
| `src/components/tasks/`     |      5 | TaskRow、TaskCard、TaskBoard、TaskFilters、TaskEditor                                 |
| `src/components/calendar/`  |      1 | CalendarGrid                                                                          |
| `src/components/analytics/` |      3 | WeeklyChart、CompletionRing、ActivityHeatmap                                          |
| `src/components/settings/`  |      1 | ThemePicker                                                                           |
| `src/components/ui/`        |      7 | BaseModal、ConfirmDialog、EmptyState、PageHeader、ProgressBar、StatCard、ToastMessage |
| **合计**                    | **30** | **23 个子组件 + 6 个视图 + 1 个根组件**                                               |

## 教程知识点

| 知识点                        | 实际代码位置                                                                                                                                                                            | 业务用途与验收操作                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1. 声明式渲染与文本插值       | [StatCard.vue:14](src/components/ui/StatCard.vue#L14)、[TaskRow.vue:37](src/components/tasks/TaskRow.vue#L37)                                                                             | 根据数据展示统计数字、任务标题与项目名称；完成任务后查看总览数字和清单变化。                                                         |
| 2. 响应式状态管理             | [study.js:155](src/stores/study.js#L155)、[TaskEditor.vue:10](src/components/tasks/TaskEditor.vue#L10)                                                                                      | `reactive` 统一保存业务数据，`ref` 管理日期、视图等局部状态；编辑任务后切换页面，所有视图显示同一数据。                              |
| 3. 属性绑定 `v-bind`          | [ProgressBar.vue:18](src/components/ui/ProgressBar.vue#L18)、[WeekStrip.vue:24](src/components/dashboard/WeekStrip.vue#L24)                                                                 | `:style` 绑定项目颜色与进度宽度，`:class`、`:aria-pressed` 表达日期选中状态；点击周日期观察高亮变化。                                |
| 4. 事件监听 `v-on`            | [TaskEditor.vue:48](src/components/tasks/TaskEditor.vue#L48)、[TaskRow.vue:32](src/components/tasks/TaskRow.vue#L32)                                                                    | `@submit.prevent` 创建或更新任务，`@click` 切换完成状态；新建任务并勾选完成。                                                        |
| 5. 表单绑定 `v-model`         | [TaskEditor.vue:53](src/components/tasks/TaskEditor.vue#L53)、[SettingsView.vue:207](src/views/SettingsView.vue#L207)                                                                     | 文本、日期、状态、数字输入和自定义主题组件双向绑定；修改任务后保存，切换主题立即生效。                                               |
| 6. 条件渲染 `v-if` / `v-show` | [App.vue:49](src/App.vue#L49)、[SettingsView.vue:258](src/views/SettingsView.vue#L258)                                                                                                    | `v-if` 按需挂载编辑器与空态，`v-show` 保持备份说明节点并展开折叠；打开/关闭任务弹窗，展开设备迁移说明。                              |
| 7. 列表渲染 `v-for`           | [TaskBoard.vue:24](src/components/tasks/TaskBoard.vue#L24)、[TaskEditor.vue:72](src/components/tasks/TaskEditor.vue#L72)                                                                | 带稳定 `key` 渲染看板列、任务卡与所属项目选项；创建新项目后在任务编辑器中选择它。                                                    |
| 8. 计算属性 `computed`        | [ProjectsView.vue:62](src/views/ProjectsView.vue#L62)、[AnalyticsView.vue:23](src/views/AnalyticsView.vue#L23)                                                                          | 从原始数据计算组合筛选、周期统计与图表；搜索关键词并组合优先级，切换 7/30 天统计。                                                   |
| 9. 生命周期钩子               | [TaskEditor.vue:22](src/components/tasks/TaskEditor.vue#L22)、[BaseModal.vue:26](src/components/ui/BaseModal.vue#L26)                                                                   | 编辑器挂载时聚焦输入框；弹窗挂载时注册键盘监听并锁定背景，卸载时清理与恢复焦点；打开弹窗直接输入，按 Tab 切换、按 Esc 关闭。         |
| 10. 侦听器 `watch`            | [study.js:202](src/stores/study.js#L202)、[App.vue:25](src/App.vue#L25)                                                                                                                   | 深度侦听业务数据自动持久化，侦听主题更新根节点；新建任务刷新后检查保留，切换夜间主题刷新后检查保留。                                 |
| 11. 模板引用                  | [TaskEditor.vue:21](src/components/tasks/TaskEditor.vue#L21)、[SettingsView.vue:25](src/views/SettingsView.vue#L25)                                                                       | `titleInput` 在编辑器挂载后聚焦；`fileInput` 由导入按钮触发系统文件选择；打开新建弹窗直接输入，再尝试选择备份文件。                  |
| 12. 组件定义与复用            | [DashboardView.vue:262](src/views/DashboardView.vue#L262)、[CalendarView.vue:146](src/views/CalendarView.vue#L146)                                                                          | 同一 `TaskRow` 用于总览、项目列表和日历；`BaseModal` 用于任务、项目和确认弹窗，职责真实且一致。                                      |
| 13. Props                     | [ProjectCard.vue:13](src/components/projects/ProjectCard.vue#L13)、[CompletionRing.vue:3](src/components/analytics/CompletionRing.vue#L3)                                                 | 父页面向项目卡、完成率图传入项目、选中态和统计数据；切换项目或完成任务，组件由传入数据更新。                                         |
| 14. Emits                     | [TaskFilters.vue:7](src/components/tasks/TaskFilters.vue#L7)、[TaskBoard.vue:6](src/components/tasks/TaskBoard.vue#L6)、[ThemePicker.vue:4](src/components/settings/ThemePicker.vue#L4) | 筛选组件发出 `update:modelValue`，看板发出 `status-change`，主题组件实现自定义 `v-model`；筛选任务、拖动卡片或通过状态选项移动任务。 |
| 15. Slots                     | [BaseModal.vue:66](src/components/ui/BaseModal.vue#L66)、[PageHeader.vue:12](src/components/ui/PageHeader.vue#L12)、[TaskEditor.vue:112](src/components/tasks/TaskEditor.vue#L112)          | 默认插槽承载不同表单，`footer` 插槽定制弹窗按钮，`actions` 插槽定制页面操作；分别打开任务、项目编辑器比较表单与按钮。                |

专注计时通过 [useFocusTimer.js:10](src/composables/useFocusTimer.js#L10) 复用响应式状态与侦听逻辑；[App.vue:13](src/App.vue#L13) 初始化全局单例，[FocusTimer.vue:15](src/components/dashboard/FocusTimer.vue#L15) 绑定到界面。计时基于截止时间，跨页面继续运行、刷新后恢复，并通过稳定记录编号避免完成恢复时重复记账。

## 建议验收顺序

1. 从侧边栏访问五个页面，确认地址变化；刷新 `/calendar`，仍显示日历。
2. 创建项目与任务；编辑标题、优先级、状态、日期和所属项目。
3. 搜索、组合筛选并排序；切换看板，拖动或用状态选择器移动任务。
4. 在日历选择一天，新建任务，检查默认日期与清单；改变截止日期后检查移动结果。
5. 刷新页面，验证数据；在总览完成一次专注，检查记录与统计变化。
6. 设置昵称、每日目标与主题；刷新验证，导出备份，清空后导入恢复。
7. 取消一次删除确认，再执行一次删除；检查空态和提示。删除项目后任务保留为未归类。
8. 以移动窗口操作导航、任务编辑与日历；用键盘测试弹窗 Esc、Tab 与按钮。

自动检查入口：`npm test`（12 项测试）、`npm run audit`（数量与依赖图）、`npm run test:e2e`、`npm run build`。Netlify 的 SPA 回退由 `netlify.toml` 与 `public/_redirects` 提供。
