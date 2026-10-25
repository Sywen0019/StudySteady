<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import AppSidebar from "./components/layout/AppSidebar.vue";
import AppTopbar from "./components/layout/AppTopbar.vue";
import TaskEditor from "./components/tasks/TaskEditor.vue";
import ProjectEditor from "./components/projects/ProjectEditor.vue";
import ConfirmDialog from "./components/ui/ConfirmDialog.vue";
import ToastMessage from "./components/ui/ToastMessage.vue";
import { useStudyStore } from "./stores/study";
import { useFocusTimer } from "./composables/useFocusTimer.js";
const { state, ui, notify } = useStudyStore();
useFocusTimer();
const menuOpen = ref(false);
const media = window.matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  document.documentElement.dataset.theme =
    state.settings.theme === "system"
      ? media.matches
        ? "dark"
        : "light"
      : state.settings.theme;
}
watch(() => state.settings.theme, applyTheme, { immediate: true });
onMounted(() => {
  media.addEventListener("change", applyTheme);
  if (ui.storageError)
    notify("浏览器存储不可用或数据损坏，请到设置中导出备份。", "error");
});
onUnmounted(() => media.removeEventListener("change", applyTheme));
</script>
<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳到主要内容</a
    ><AppSidebar :open="menuOpen" @close="menuOpen = false" />
    <div class="app-main">
      <AppTopbar @menu="menuOpen = !menuOpen" />
      <div v-if="ui.storageError" class="storage-alert" role="alert">
        本地数据暂时无法保存或读取，请先备份当前学习记录。
        <RouterLink to="/settings">前往数据备份 →</RouterLink>
      </div>
      <main id="main-content" class="page-content"><RouterView /></main>
      <footer class="app-footer">
        <span>一点点积累，慢慢成为更好的自己。</span
        ><span>Made for your next small step. <i>✳</i></span>
      </footer>
    </div>
    <TaskEditor v-if="ui.taskModal" /><ProjectEditor
      v-if="ui.projectModal"
    /><ConfirmDialog /><ToastMessage />
  </div>
</template>
