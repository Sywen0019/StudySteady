<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, Menu, ChevronRight } from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
defineProps({ menuOpen: Boolean });
defineEmits(["menu"]);
const route = useRoute(),
  router = useRouter();
const { state } = useStudyStore();
const search = ref("");
const initials = computed(() => state.settings.name?.slice(0, 1) || "学");
function submit() {
  // 全局搜索不维护独立结果页，而是带上查询参数跳转，由项目页的筛选逻辑统一展示。
  if (search.value.trim()) {
    router.push({ path: "/projects", query: { search: search.value.trim() } });
    search.value = "";
  }
}
</script>
<template>
  <header class="app-topbar">
    <div class="breadcrumbs">
      <button
        class="icon-btn menu-toggle"
        type="button"
        :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
        :aria-expanded="menuOpen"
        aria-controls="app-navigation"
        @click="$emit('menu')"
      >
        <Menu :size="21" /></button
      ><span class="breadcrumb-home">我的工作台</span
      ><ChevronRight :size="14" class="breadcrumb-home" /><span>{{
        route.meta.title
      }}</span>
    </div>
    <div class="topbar-actions">
      <form class="global-search" role="search" @submit.prevent="submit">
        <Search :size="16" /><input
          v-model="search"
          aria-label="搜索任务"
          placeholder="搜索你的任务…"
        /><kbd>↵</kbd>
      </form>
      <span class="topbar-divider" /><RouterLink
        to="/settings"
        class="profile-link"
        aria-label="个人设置"
        ><span class="avatar">{{ initials }}</span
        ><span class="profile-text"
          >{{ state.settings.name }}<small>保持热爱，步履不停</small></span
        ></RouterLink
      >
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  min-height: 70px;
  height: auto;
  padding: 14px 22px;
  border: 1px solid var(--glass-edge, #ffffffb3);
  border-radius: 20px;
  background: linear-gradient(130deg, var(--glass-highlight, #ffffff85), transparent), var(--sidebar);
  box-shadow: var(--glass-shadow, 0 10px 35px #234b3b08), inset 0 1px 0 var(--glass-edge, #ffffffb3);
  -webkit-backdrop-filter: blur(26px) saturate(150%);
  backdrop-filter: blur(26px) saturate(150%);
}
.breadcrumbs {
  min-width: 0;
  gap: 11px;
  font-size: 12px;
}
.breadcrumbs > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}
.breadcrumb-home {
  font-size: 11px;
}
.topbar-actions {
  min-width: 0;
  gap: 18px;
}
.global-search {
  min-width: 0;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid var(--glass-edge);
  border-radius: 12px;
  background: var(--surface-soft);
  box-shadow: inset 0 1px 3px color-mix(in srgb, var(--green) 3%, transparent);
  transition: border-color 0.2s, background 0.2s;
}
.global-search:focus-within {
  border-color: color-mix(in srgb, var(--green) 40%, transparent);
  background: var(--surface);
  outline: 2px solid var(--accent-glow, #187b5f17);
  outline-offset: 2px;
}
.global-search input {
  width: clamp(100px, 10vw, 165px);
  font-size: 11px;
  line-height: 1.5;
}
.global-search input:focus-visible {
  outline: none;
}
.global-search kbd {
  padding: 1px 5px;
  border-color: var(--line);
  border-radius: 5px;
  background: var(--surface);
}
.topbar-divider {
  height: 27px;
}
.profile-link {
  gap: 10px;
  border-radius: 13px;
}
.avatar {
  width: 37px;
  height: 37px;
  border: 1px solid var(--glass-edge);
  background: linear-gradient(145deg, var(--surface), var(--green-soft));
  color: var(--green);
  box-shadow: 0 3px 8px var(--accent-glow, #1a755811), inset 0 1px 0 var(--glass-edge);
  font-size: 13px;
}
.profile-text {
  min-width: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}
.profile-text small {
  font-size: 9px;
}
.menu-toggle {
  width: 35px;
  height: 35px;
  border: 1px solid var(--glass-edge);
  border-radius: 11px;
  background: var(--surface);
  color: var(--green);
}
@media (max-width: 1190px) {
  .app-topbar {
    padding: 13px 18px;
  }
  .topbar-actions {
    gap: 13px;
  }
  .profile-text {
    display: none;
  }
}
@media (max-width: 980px) {
  .breadcrumbs {
    gap: 8px;
    font-size: 11px;
  }
  .breadcrumb-home {
    font-size: 10px;
  }
}
@media (max-width: 760px) {
  .app-topbar {
    min-height: 64px;
    padding: 10px 13px;
    border-radius: 18px;
    gap: 10px;
  }
  .breadcrumbs {
    flex-shrink: 0;
    gap: 9px;
    font-size: 12px;
  }
  .global-search input {
    width: clamp(85px, 22vw, 150px);
    font-size: 11px;
  }
  .global-search {
    gap: 7px;
    padding: 9px 10px;
  }
  .topbar-actions {
    gap: 10px;
  }
}
@media (max-width: 520px) {
  .app-topbar {
    padding: 9px 10px;
    gap: 8px;
  }
  .breadcrumbs {
    gap: 8px;
    font-size: 11px;
  }
  .topbar-actions {
    gap: 8px;
  }
  .global-search {
    padding: 8px;
  }
  .global-search input {
    width: clamp(55px, 17vw, 86px);
    font-size: 10px;
  }
  .global-search > svg {
    width: 14px;
  }
  .avatar {
    width: 32px;
    height: 32px;
    font-size: 11px;
  }
}
</style>
