<script setup>
import { computed } from "vue";
import {
  LayoutDashboard,
  Layers3,
  CalendarDays,
  ChartNoAxesCombined,
  Settings2,
  ArrowUpRight,
  Plus,
  X,
  BookOpenCheck,
  Sprout,
} from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
defineProps({ open: Boolean });
const emit = defineEmits(["close"]);
const { state, openProject } = useStudyStore();
// 侧栏角标仅统计未完成任务，完成或删除后会立即减少。
const remaining = computed(
  () => state.tasks.filter((t) => t.status !== "done").length,
);
const links = [
  { to: "/", label: "学习总览", english: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "项目与任务", icon: Layers3 },
  { to: "/calendar", label: "学习日历", icon: CalendarDays },
  { to: "/analytics", label: "学习统计", icon: ChartNoAxesCombined },
];
</script>
<template>
  <div v-if="open" class="sidebar-shade" @click="emit('close')" />
  <aside class="app-sidebar" :class="{ open }">
    <RouterLink to="/" class="brand" @click="emit('close')"
      ><span class="brand-mark"
        ><BookOpenCheck :size="25" :stroke-width="1.7" /></span
      ><span
        >StudySteady<span class="brand-subtitle">稳 稳 向 前</span></span
      ></RouterLink
    ><button
      class="icon-btn mobile-close"
      aria-label="关闭菜单"
      @click="emit('close')"
    >
      <X :size="20" />
    </button>
    <div class="workspace-label">个人学习空间<span>PERSONAL</span></div>
    <nav class="main-nav" aria-label="主导航">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-item"
        @click="emit('close')"
        ><component :is="link.icon" :size="19" :stroke-width="1.8" /><span>{{
          link.label
        }}</span
        ><span v-if="link.to === '/projects' && remaining" class="nav-count">{{
          remaining
        }}</span></RouterLink
      >
    </nav>
    <div class="sidebar-project-title">
      <span>我的项目</span
      ><button class="icon-btn" aria-label="新建项目" @click="openProject()">
        <Plus :size="15" />
      </button>
    </div>
    <div class="sidebar-projects">
      <RouterLink
        v-for="project in state.projects.slice(0, 5)"
        :key="project.id"
        :to="{ path: '/projects', query: { project: project.id } }"
        @click="emit('close')"
        ><i :style="{ background: project.color }" /><span>{{
          project.name
        }}</span></RouterLink
      >
      <p v-if="!state.projects.length" class="muted sidebar-empty">
        你的新目标，从这里开始。
      </p>
    </div>
    <div class="sidebar-bottom">
      <div class="sidebar-note">
        <Sprout :size="25" :stroke-width="1.4" />
        <p>不必一次做到最好，<br />只要比昨天更进一步。</p>
        <span>SMALL STEPS. REAL PROGRESS.</span>
      </div>
      <RouterLink to="/settings" class="nav-item" @click="emit('close')"
        ><Settings2 :size="19" :stroke-width="1.8" /><span>偏好设置</span
        ><ArrowUpRight :size="16" class="setting-arrow"
      /></RouterLink>
      <div class="sidebar-footer">
        <span class="status-dot" /> 本地优先，安心学习<span>v1.0</span>
      </div>
    </div>
  </aside>
</template>
