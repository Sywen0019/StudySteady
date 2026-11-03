<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
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
const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);
const { state, openProject } = useStudyStore();
const sidebar = ref(null);
const closeButton = ref(null);
const mobileQuery = window.matchMedia("(max-width: 760px)");
const isMobile = ref(mobileQuery.matches);
let previousFocus = null;
let previousOverflow = "";
let scrollLocked = false;

function unlockScroll() {
  if (!scrollLocked) return;
  document.body.style.overflow = previousOverflow;
  scrollLocked = false;
}

function syncViewport(event) {
  isMobile.value = event.matches;
  if (!event.matches && props.open) emit("close");
}

function handleKey(event) {
  if (!props.open || !isMobile.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab") return;
  const nodes = Array.from(
    sidebar.value.querySelectorAll('a[href], button:not([disabled])'),
  ).filter((node) => node.getClientRects().length);
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

async function createProject() {
  emit("close");
  // 先释放抽屉的滚动锁和焦点，再由项目弹窗接管。
  await nextTick();
  openProject();
}

watch(
  () => props.open && isMobile.value,
  async (active, wasActive) => {
    if (active) {
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      scrollLocked = true;
      await nextTick();
      // 等待浏览器应用 visibility 过渡，避免向仍隐藏的抽屉请求焦点。
      await new Promise(requestAnimationFrame);
      if (props.open && isMobile.value)
        closeButton.value?.focus({ preventScroll: true });
    } else {
      unlockScroll();
      if (wasActive) {
        await nextTick();
        if (previousFocus?.isConnected) previousFocus.focus();
      }
    }
  },
);

onMounted(() => {
  mobileQuery.addEventListener("change", syncViewport);
  document.addEventListener("keydown", handleKey);
});
onUnmounted(() => {
  unlockScroll();
  mobileQuery.removeEventListener("change", syncViewport);
  document.removeEventListener("keydown", handleKey);
});
// 侧栏角标仅统计未完成任务，完成或删除后会立即减少。
const remaining = computed(
  () => state.tasks.filter((t) => t.status !== "done").length,
);
const links = [
  { to: "/", label: "学习总览", english: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "项目与任务", english: "Projects", icon: Layers3 },
  { to: "/calendar", label: "学习日历", english: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "学习统计", english: "Insights", icon: ChartNoAxesCombined },
];
</script>
<template>
  <div v-if="open && isMobile" class="sidebar-shade" aria-hidden="true" @click="emit('close')" />
  <aside
    id="app-navigation"
    ref="sidebar"
    class="app-sidebar"
    :class="{ open }"
    :inert="isMobile && !open"
    :role="isMobile && open ? 'dialog' : undefined"
    :aria-modal="isMobile && open ? true : undefined"
    aria-label="学习空间导航"
  >
    <RouterLink to="/" class="brand" @click="emit('close')"
      ><span class="brand-mark"
        ><BookOpenCheck :size="25" :stroke-width="1.7" /></span
      ><span
        >StudySteady<span class="brand-subtitle">稳 稳 向 前</span></span
      ></RouterLink
    ><button
      ref="closeButton"
      class="icon-btn mobile-close"
      type="button"
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
        ><component :is="link.icon" :size="19" :stroke-width="1.8" /><span class="nav-label">{{
          link.label
        }}<small aria-hidden="true">{{ link.english }}</small></span
        ><span v-if="link.to === '/projects' && remaining" class="nav-count">{{
          remaining
        }}</span></RouterLink
      >
    </nav>
    <div class="sidebar-project-title">
      <span>我的项目</span
      ><button class="icon-btn" type="button" aria-label="新建项目" @click="createProject">
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

<style scoped>
.app-sidebar {
  inset: var(--shell-gap, 18px) auto var(--shell-gap, 18px) var(--shell-gap, 18px);
  width: var(--sidebar-width, 236px);
  padding: 28px 16px 18px;
  border: 1px solid var(--glass-edge, #ffffffb3);
  border-radius: 26px;
  background: linear-gradient(155deg, var(--glass-highlight, #ffffffab), transparent 68%), var(--sidebar);
  box-shadow: var(--glass-shadow, 0 18px 45px #234b3b0c), inset 0 1px 0 var(--glass-edge, #ffffffb3);
  -webkit-backdrop-filter: blur(30px) saturate(145%);
  backdrop-filter: blur(30px) saturate(145%);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
  transform: none;
  visibility: visible;
}
.app-sidebar > * {
  flex-shrink: 0;
}
.brand {
  padding: 0 7px;
  gap: 10px;
  font-size: 19px;
}
.brand-mark {
  width: 39px;
  height: 42px;
  border: 1px solid color-mix(in srgb, var(--green) 38%, transparent);
  border-radius: 13px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--green) 78%, white), var(--green-dark));
  color: var(--on-accent, #fff);
  box-shadow: 0 6px 13px var(--accent-glow, #1a75582e), inset 0 1px 0 #ffffff57;
}
.brand-subtitle {
  margin-top: 5px;
  font-size: 8px;
  letter-spacing: 2.7px;
}
.workspace-label {
  margin: 34px 12px 15px;
  font-size: 10px;
}
.workspace-label span {
  font-size: 7px;
}
.main-nav {
  gap: 6px;
}
.nav-item {
  position: relative;
  min-height: 48px;
  padding: 10px 13px;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: var(--muted);
  font-size: 12px;
}
.nav-item:hover {
  background: var(--surface-soft);
  border-color: var(--glass-edge);
  color: var(--green);
}
.main-nav .router-link-exact-active,
.sidebar-bottom > .router-link-active {
  background: linear-gradient(125deg, var(--glass-highlight), transparent), var(--green-soft);
  border-color: color-mix(in srgb, var(--green) 15%, var(--glass-edge));
  color: var(--green);
  box-shadow: 0 4px 12px var(--accent-glow, #1a755812), inset 0 1px 0 var(--glass-edge);
}
.nav-label {
  line-height: 1.5;
}
.nav-label small {
  display: block;
  font-size: 8px;
  letter-spacing: 0.3px;
  opacity: 0.65;
}
.nav-count {
  padding: 3px 7px;
  border: 1px solid var(--glass-edge);
  border-radius: 8px;
  background: var(--surface);
  color: var(--green);
  font-variant-numeric: tabular-nums;
}
.sidebar-project-title {
  margin: 25px 6px 6px 13px;
}
.sidebar-projects {
  gap: 3px;
}
.sidebar-projects > a {
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 11px;
}
.sidebar-projects i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--surface-soft);
}
.sidebar-bottom {
  margin-top: auto;
  padding-top: 22px;
}
.sidebar-note {
  position: relative;
  margin: 0 3px 17px;
  padding: 19px 16px;
  border: 1px solid var(--glass-edge);
  border-radius: 17px;
  background: linear-gradient(140deg, var(--green-soft), var(--surface));
  box-shadow: inset 0 1px 0 var(--glass-edge);
}
.sidebar-note p {
  margin-top: 8px;
  font-size: 11px;
}
.sidebar-note > span {
  font-size: 6px;
  margin-top: 12px;
  opacity: 0.8;
}
.sidebar-footer {
  padding: 17px 8px 0;
  font-size: 8px;
}
.status-dot {
  background: var(--green);
  box-shadow: 0 0 0 3px var(--green-soft);
}
.sidebar-shade {
  position: fixed;
  inset: 0;
  z-index: 39;
  background: #102e294d;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
@media (max-width: 1190px) and (min-width: 761px) {
  .app-sidebar {
    padding-right: 13px;
    padding-left: 13px;
  }
  .brand {
    font-size: 16px;
    gap: 8px;
    padding: 0 4px;
  }
  .brand-mark {
    width: 35px;
    height: 38px;
  }
  .nav-item {
    gap: 10px;
    padding-right: 10px;
    padding-left: 10px;
  }
  .workspace-label span {
    display: none;
  }
}
@media (max-width: 760px) {
  .app-sidebar {
    inset: 10px auto 10px 10px;
    width: min(280px, calc(100vw - 34px));
    max-height: calc(100dvh - 20px);
    padding: 27px 17px 18px;
    border-radius: 23px;
    background: var(--surface-strong, #eff8f4f2);
    transform: translateX(calc(-100% - 24px));
    visibility: hidden;
    pointer-events: none;
    transition: transform 0.28s ease, visibility 0s 0.28s;
  }
  .app-sidebar.open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
    transition: transform 0.28s ease, visibility 0s;
  }
  .brand {
    padding-right: 25px;
    font-size: 19px;
  }
  .mobile-close {
    display: flex;
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    border-radius: 11px;
  }
  .workspace-label {
    margin-top: 28px;
  }
  .workspace-label span {
    display: inline;
  }
}
@media (max-height: 860px) {
  .workspace-label {
    margin-top: 24px;
  }
  .sidebar-note {
    display: none;
  }
  .sidebar-bottom {
    padding-top: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .app-sidebar {
    transition: none;
  }
}
</style>
