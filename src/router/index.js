import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  // 动态导入按路由拆分页面代码，进入对应页面时才加载该视图。
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { title: "学习总览", english: "Overview" },
    },
    {
      path: "/projects",
      name: "projects",
      component: () => import("../views/ProjectsView.vue"),
      meta: { title: "项目与任务", english: "Projects & Tasks" },
    },
    {
      path: "/calendar",
      name: "calendar",
      component: () => import("../views/CalendarView.vue"),
      meta: { title: "学习日历", english: "Calendar" },
    },
    {
      path: "/analytics",
      name: "analytics",
      component: () => import("../views/AnalyticsView.vue"),
      meta: { title: "学习统计", english: "Analytics" },
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("../views/SettingsView.vue"),
      meta: { title: "偏好设置", english: "Settings" },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
      meta: { title: "页面未找到" },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
  document.title = `${to.meta.title} · StudySteady`;
});
export default router;
