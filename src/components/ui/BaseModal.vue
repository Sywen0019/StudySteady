<script setup>
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import { X } from "lucide-vue-next";
defineProps({ title: String, description: String, wide: Boolean });
const emit = defineEmits(["close"]);
const dialog = ref(null);
const previousFocus = document.activeElement;
function handleKey(event) {
  if (event.key === "Escape") emit("close");
  if (event.key !== "Tab") return;
  const nodes = dialog.value?.querySelectorAll(
    'button:not([disabled]),input:not([disabled]),textarea,select,a[href],[tabindex="0"]',
  );
  if (!nodes?.length) return;
  const first = nodes[0],
    last = nodes[nodes.length - 1];
  // 在首尾可聚焦元素间循环，防止 Tab 或 Shift+Tab 把焦点移到弹窗外。
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKey);
  await nextTick();
  // 子表单可能已主动聚焦输入框；仅在焦点仍在弹窗外时使用容器兜底。
  if (!dialog.value?.contains(document.activeElement)) dialog.value?.focus();
});
onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKey);
  previousFocus?.focus?.();
});
</script>
<template>
  <Teleport to="body"
    ><div class="modal-backdrop" @click.self="emit('close')">
      <section
        ref="dialog"
        class="modal panel"
        :class="{ wide }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">MAKE ROOM FOR PROGRESS</p>
            <h2>{{ title }}</h2>
            <p v-if="description" class="muted">{{ description }}</p>
          </div>
          <button
            class="icon-btn"
            type="button"
            aria-label="关闭弹窗"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>
        </header>
        <slot />
        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </section></div
  ></Teleport>
</template>
