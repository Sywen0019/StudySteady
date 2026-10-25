<script setup>
import { computed } from "vue";
import { Clock3, Pencil, Check } from "lucide-vue-next";
import { useStudyStore } from "../../stores/study";
const props = defineProps({
  task: { type: Object, required: true },
  compact: Boolean,
});
const emit = defineEmits(["toggle", "edit"]);
const { projectById, toggleTask, openTask, today } = useStudyStore();
const project = computed(() => projectById(props.task.projectId));
const priorities = { high: "高优先级", medium: "中优先级", low: "低优先级" };
function toggle() {
  // 状态写入 store 后再通知父组件，父组件可用这个事件做额外统计或提示。
  toggleTask(props.task.id);
  emit("toggle", props.task);
}
function edit() {
  openTask(props.task);
  emit("edit", props.task);
}
</script>
<template>
  <div class="task-row" :class="{ completed: task.status === 'done', compact }">
    <button
      class="task-check"
      :class="{ checked: task.status === 'done' }"
      :aria-label="
        (task.status === 'done' ? '取消完成：' : '完成任务：') + task.title
      "
      :aria-pressed="task.status === 'done'"
      @click="toggle"
    >
      <Check v-if="task.status === 'done'" :size="13" />
    </button>
    <button class="task-row-main" @click="edit">
      <span class="task-row-title">{{ task.title }}</span
      ><span class="task-row-meta"
        ><span v-if="project" class="project-label"
          ><i :style="{ background: project.color }" />{{ project.name }}</span
        ><span v-else>未归类</span
        ><span v-if="task.estimatedMinutes"
          ><Clock3 :size="12" />{{ task.estimatedMinutes }} 分钟</span
        ><span
          v-if="task.dueDate && task.dueDate < today && task.status !== 'done'"
          class="overdue"
          >已逾期</span
        ></span
      >
    </button>
    <span v-if="!compact" class="priority-tag" :class="task.priority"
      ><i />{{ priorities[task.priority] }}</span
    ><button class="icon-btn task-edit" aria-label="编辑任务" @click="edit">
      <Pencil :size="15" />
    </button>
  </div>
</template>
