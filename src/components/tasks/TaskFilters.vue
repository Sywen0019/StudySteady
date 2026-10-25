<script setup>
import { Search, SlidersHorizontal, X } from "lucide-vue-next";
const props = defineProps({
  modelValue: { type: Object, required: true },
  projects: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:modelValue"]);
function update(key, value) {
  // 保留其余筛选项并发出新对象，由父组件的 v-model 接收，避免直接修改 prop。
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>

<template>
  <div class="task-filters">
    <label class="search-field"
      ><Search :size="16" /><input
        :value="modelValue.search"
        aria-label="搜索任务"
        placeholder="搜索任务名称或描述…"
        @input="update('search', $event.target.value)" /><button
        v-if="modelValue.search"
        class="icon-btn"
        aria-label="清除搜索"
        @click="update('search', '')"
      >
        <X :size="14" /></button
    ></label>
    <span class="filter-indicator"><SlidersHorizontal :size="15" />筛选</span>
    <select
      class="input"
      aria-label="按项目筛选"
      :value="modelValue.project"
      @change="update('project', $event.target.value)"
    >
      <option value="all">全部项目</option>
      <option value="none">未归类</option>
      <option v-for="project in projects" :key="project.id" :value="project.id">
        {{ project.name }}
      </option>
    </select>
    <select
      class="input"
      aria-label="按状态筛选"
      :value="modelValue.status"
      @change="update('status', $event.target.value)"
    >
      <option value="all">全部状态</option>
      <option value="todo">待开始</option>
      <option value="in-progress">进行中</option>
      <option value="done">已完成</option>
      <option value="overdue">已逾期</option>
    </select>
    <select
      class="input"
      aria-label="按优先级筛选"
      :value="modelValue.priority"
      @change="update('priority', $event.target.value)"
    >
      <option value="all">全部优先级</option>
      <option value="high">高优先级</option>
      <option value="medium">中优先级</option>
      <option value="low">低优先级</option>
    </select>
  </div>
</template>

<style scoped>
.task-filters {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.search-field {
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e5e8e0);
  border-radius: 9px;
  padding: 0 12px;
  height: 39px;
  color: var(--muted, #7d837c);
}
.search-field input {
  width: 100%;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: var(--text, #253c30);
  font-size: 12px;
}
.filter-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--muted, #7d837c);
  font-size: 11px;
  margin-left: 9px;
}
.task-filters select {
  width: auto;
  font-size: 11px;
  height: 39px;
  max-width: 150px;
}
@media (max-width: 760px) {
  .search-field {
    flex-basis: 100%;
  }
  .filter-indicator {
    display: none;
  }
  .task-filters select {
    flex: 1;
    max-width: none;
    min-width: 0;
  }
}
</style>
