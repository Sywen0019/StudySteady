<script setup>
import { Sun, Moon, Monitor, Check } from "lucide-vue-next";
defineProps({ modelValue: { type: String, default: "light" } });
defineEmits(["update:modelValue"]);
const themes = [
  { value: "light", label: "日间 · 温暖纸白", icon: Sun },
  { value: "dark", label: "夜间 · 静谧深林", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];
</script>

<template>
  <div class="theme-options" role="group" aria-label="选择界面主题">
    <button
      v-for="theme in themes"
      :key="theme.value"
      type="button"
      class="theme-option"
      :class="{ selected: modelValue === theme.value }"
      :aria-pressed="modelValue === theme.value"
      @click="$emit('update:modelValue', theme.value)"
    >
      <div class="theme-preview" :class="theme.value">
        <div class="preview-sidebar"><span /><span /><span /></div>
        <div class="preview-content">
          <i />
          <div><span /><span /></div>
          <b /><b />
        </div>
        <Check
          v-if="modelValue === theme.value"
          class="theme-check"
          :size="16"
        />
      </div>
      <span class="theme-label"
        ><component :is="theme.icon" :size="15" />{{ theme.label }}</span
      >
    </button>
  </div>
</template>

<style scoped>
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}
.theme-option {
  background: transparent;
  padding: 0;
  border: 0;
  text-align: left;
  cursor: pointer;
  color: var(--text);
}
.theme-preview {
  height: 102px;
  border: 2px solid var(--border);
  border-radius: 9px;
  display: flex;
  background: #faf9f6;
  overflow: hidden;
  position: relative;
  transition: border-color 0.15s;
}
.selected .theme-preview {
  border-color: var(--green);
}
.preview-sidebar {
  width: 24%;
  border-right: 1px solid #e9e8e2;
  background: #f2f3ed;
  padding: 19px 8px;
}
.preview-sidebar span {
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #cfd6c8;
  margin-bottom: 8px;
}
.preview-sidebar span:first-child {
  background: #51806a;
}
.preview-content {
  flex: 1;
  padding: 17px 12px;
}
.preview-content > i {
  display: block;
  width: 47%;
  height: 6px;
  border-radius: 2px;
  background: #b7c0af;
  margin-bottom: 11px;
}
.preview-content > div {
  display: flex;
  gap: 6px;
  margin-bottom: 9px;
}
.preview-content > div span {
  height: 18px;
  background: #e5eadd;
  flex: 1;
  border-radius: 3px;
}
.preview-content > b {
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e3e5dd;
  margin: 6px 0;
}
.dark {
  background: #232b25;
  border-color: #40493f;
}
.dark .preview-sidebar {
  background: #1c241f;
  border-color: #394238;
}
.dark .preview-sidebar span {
  background: #53634f;
}
.dark .preview-sidebar span:first-child {
  background: #a4bc9b;
}
.dark .preview-content > i {
  background: #7b8a73;
}
.dark .preview-content > div span {
  background: #374233;
}
.dark .preview-content > b {
  background: #394537;
}
.system {
  background: linear-gradient(120deg, #faf9f6 0 54%, #232b25 54% 100%);
}
.theme-check {
  position: absolute;
  right: 7px;
  bottom: 7px;
  border-radius: 50%;
  background: var(--green);
  color: white;
  padding: 2px;
  box-sizing: content-box;
}
.theme-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-top: 10px;
}
.selected .theme-label {
  color: var(--green);
  font-weight: 600;
}
@media (max-width: 550px) {
  .theme-options {
    gap: 9px;
  }
  .theme-preview {
    height: 84px;
  }
  .preview-content {
    padding: 15px 8px;
  }
  .theme-label {
    font-size: 10px;
    gap: 4px;
  }
  .theme-label svg {
    width: 12px;
  }
  .preview-sidebar {
    padding: 17px 5px;
  }
}
</style>
