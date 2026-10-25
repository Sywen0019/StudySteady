<script setup>
import { watch, onUnmounted } from "vue";
import { CheckCircle2, AlertCircle, X } from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
const { ui } = useStudyStore();
let timer;
watch(
  () => ui.toast,
  (value) => {
    clearTimeout(timer);
    if (value)
      timer = setTimeout(() => {
        ui.toast = null;
      }, 4000);
  },
);
onUnmounted(() => clearTimeout(timer));
</script>
<template>
  <Teleport to="body"
    ><Transition name="toast"
      ><div
        v-if="ui.toast"
        class="toast-message"
        :class="ui.toast.type"
        role="status"
        aria-live="polite"
      >
        <component
          :is="ui.toast.type === 'error' ? AlertCircle : CheckCircle2"
          :size="20"
        /><span>{{ ui.toast.message }}</span
        ><button
          class="icon-btn"
          aria-label="关闭提示"
          @click="ui.toast = null"
        >
          <X :size="16" />
        </button></div></Transition
  ></Teleport>
</template>
