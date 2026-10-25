<script setup>
import { computed } from "vue";
import {
  CalendarDays,
  Clock3,
  GripVertical,
  Pencil,
  Check,
} from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
const props = defineProps({ task: { type: Object, required: true } });
const emit = defineEmits(["status-change"]);
const { projectById, today, openTask } = useStudyStore();
const project = computed(() => projectById(props.task.projectId));
const priorityLabels = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};
function onDrag(event) {
  event.dataTransfer.setData("text/plain", props.task.id);
  event.dataTransfer.effectAllowed = "move";
}
</script>

<template>
  <article class="kanban-card" draggable="true" @dragstart="onDrag">
    <div class="kanban-card-head">
      <span class="priority-tag" :class="task.priority"
        ><i />{{ priorityLabels[task.priority] }}</span
      ><GripVertical :size="15" class="muted" />
    </div>
    <button class="kanban-title" @click="openTask(task)">
      {{ task.title }}
    </button>
    <p v-if="task.description" class="kanban-description">
      {{ task.description }}
    </p>
    <span v-if="project" class="kanban-project"
      ><i :style="{ background: project.color }" />{{ project.name }}</span
    ><span v-else class="kanban-project">未归类</span>
    <div class="kanban-meta">
      <span
        :class="{
          late: task.dueDate && task.dueDate < today && task.status !== 'done',
        }"
        ><CalendarDays :size="12" />{{
          task.dueDate ? task.dueDate.slice(5).replace("-", "/") : "无截止日期"
        }}</span
      ><span v-if="task.estimatedMinutes"
        ><Clock3 :size="12" />{{ task.estimatedMinutes }}m</span
      ><Check v-if="task.status === 'done'" :size="14" class="done-check" />
    </div>
    <div class="kanban-card-actions">
      <select
        aria-label="修改任务状态"
        :value="task.status"
        @change="
          emit('status-change', { id: task.id, status: $event.target.value })
        "
      >
        <option value="todo">待开始</option>
        <option value="in-progress">进行中</option>
        <option value="done">已完成</option></select
      ><button
        class="icon-btn"
        :aria-label="'编辑任务：' + task.title"
        @click="openTask(task)"
      >
        <Pencil :size="13" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.kanban-card {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e5e8e0);
  padding: 15px;
  border-radius: 11px;
  cursor: grab;
  box-shadow: 0 2px 3px #182b1a03;
}
.kanban-card:active {
  cursor: grabbing;
}
.kanban-card-head,
.kanban-meta,
.kanban-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}
.kanban-title {
  display: block;
  border: 0;
  padding: 0;
  margin: 15px 0 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  background: none;
  color: var(--text, #253c30);
  cursor: pointer;
  line-height: 1.7;
}
.kanban-title:hover {
  color: var(--green, #326650);
}
.kanban-description {
  font-size: 11px;
  color: var(--muted, #7d837c);
  line-height: 1.8;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.kanban-project {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--muted, #7d837c);
  margin: 14px 0;
}
.kanban-project i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.kanban-meta {
  justify-content: flex-start;
  gap: 14px;
  font-size: 10px;
  color: var(--muted, #7d837c);
}
.kanban-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.kanban-meta .late {
  color: #b46742;
}
.done-check {
  margin-left: auto;
  color: #326650;
}
.kanban-card-actions {
  margin-top: 12px;
  padding-top: 9px;
  border-top: 1px solid var(--border, #e5e8e0);
}
.kanban-card-actions select {
  background: transparent;
  border: 0;
  color: var(--muted, #7d837c);
  font-size: 10px;
  max-width: 120px;
  cursor: pointer;
  padding: 4px 0;
}
</style>
