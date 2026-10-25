<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, Menu, ChevronRight, Command } from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
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
        aria-label="打开菜单"
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
