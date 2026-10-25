<script setup>
import { computed } from "vue";
import {
  BookOpen,
  Code2,
  Languages,
  Sigma,
  Pencil,
  ArrowUpRight,
} from "lucide-vue-next";
import ProgressBar from "../ui/ProgressBar.vue";
import { useStudyStore } from "../../stores/study";
const props = defineProps({
  project: { type: Object, required: true },
  selected: Boolean,
});
defineEmits(["select", "edit"]);
const { tasksForProject, projectProgress } = useStudyStore();
const tasks = computed(() => tasksForProject(props.project.id));
const completed = computed(
  () => tasks.value.filter((task) => task.status === "done").length,
);
const progress = computed(() => projectProgress(props.project.id));
const icon = computed(
  () =>
    ({
      code: Code2,
      book: BookOpen,
      "book-open": BookOpen,
      languages: Languages,
      math: Sigma,
      calculator: Sigma,
    })[props.project.icon] || BookOpen,
);
</script>

<template>
  <article
    class="project-card panel"
    :class="{ selected }"
    :style="{ '--project-color': project.color }"
  >
    <div class="project-card-top">
      <span class="project-card-icon"
        ><component :is="icon" :size="21" :stroke-width="1.7"
      /></span>
      <button
        class="icon-btn"
        :aria-label="'编辑项目：' + project.name"
        @click="$emit('edit', project)"
      >
        <Pencil :size="15" />
      </button>
    </div>
    <button
      class="project-select"
      :aria-pressed="selected"
      @click="$emit('select', project.id)"
    >
      <span class="project-category">{{ project.category || "学习项目" }}</span>
      <h3>{{ project.name }}<ArrowUpRight :size="17" /></h3>
      <p>{{ project.description || "从一个小目标开始，慢慢积累。" }}</p>
      <div class="project-progress-label">
        <span>{{ completed }} / {{ tasks.length }} 个任务</span
        ><strong>{{ progress }}%</strong>
      </div>
      <ProgressBar
        :value="progress"
        :color="project.color"
        :label="project.name + '完成进度'"
      />
    </button>
  </article>
</template>

<style scoped>
.project-card {
  padding: 20px;
  position: relative;
  transition:
    border-color 0.2s,
    transform 0.2s;
  border: 1px solid var(--border, #e5e8e0);
}
.project-card:hover {
  transform: translateY(-2px);
}
.project-card.selected {
  border-color: var(--project-color);
  box-shadow: 0 0 0 1px var(--project-color);
}
.project-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.project-card-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--project-color) 11%, transparent);
  color: var(--project-color);
}
.project-select {
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  width: 100%;
  cursor: pointer;
  color: inherit;
}
.project-category {
  font-size: 10px;
  color: var(--muted, #7d837c);
  letter-spacing: 0.04em;
}
.project-select h3 {
  font-size: 16px;
  margin: 6px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.project-select h3 svg {
  color: var(--muted, #7d837c);
  flex-shrink: 0;
}
.project-select p {
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted, #7d837c);
  height: 40px;
  margin: 0 0 21px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.project-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted, #7d837c);
  margin-bottom: 9px;
}
.project-progress-label strong {
  color: var(--project-color);
  font-weight: 600;
}
</style>
