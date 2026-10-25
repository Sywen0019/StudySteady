<script setup>
import { ref } from "vue";
import { Plus } from "lucide-vue-next";
import TaskCard from "./TaskCard.vue";
defineProps({ tasks: { type: Array, default: () => [] } });
const emit = defineEmits(["status-change", "new-task"]);
const draggingOver = ref("");
const columns = [
  { value: "todo", label: "待开始", color: "#8e998d" },
  { value: "in-progress", label: "进行中", color: "#d49a56" },
  { value: "done", label: "已完成", color: "#4a8665" },
];
function drop(event, status) {
  const id = event.dataTransfer.getData("text/plain");
  if (id) emit("status-change", { id, status });
  draggingOver.value = "";
}
</script>

<template>
  <div class="task-board">
    <section
      v-for="column in columns"
      :key="column.value"
      class="kanban-column"
      :class="{ 'drag-over': draggingOver === column.value }"
      :aria-label="column.label + '任务'"
      @dragover.prevent="draggingOver = column.value"
      @dragleave.self="draggingOver = ''"
      @drop.prevent="drop($event, column.value)"
    >
      <header class="kanban-column-head">
        <h3>
          <i :style="{ background: column.color }" />{{ column.label
          }}<span>{{
            tasks.filter((task) => task.status === column.value).length
          }}</span>
        </h3>
        <button
          class="icon-btn"
          :aria-label="'新建' + column.label + '任务'"
          @click="emit('new-task', column.value)"
        >
          <Plus :size="16" />
        </button>
      </header>
      <div class="kanban-cards">
        <TaskCard
          v-for="task in tasks.filter((task) => task.status === column.value)"
          :key="task.id"
          :task="task"
          @status-change="emit('status-change', $event)"
        />
        <div
          v-if="!tasks.some((task) => task.status === column.value)"
          class="kanban-empty"
        >
          暂时没有任务<br /><span>把任务拖到这里，或点击 + 添加</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.task-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
}
.kanban-column {
  background: var(--background, #f6f7f2);
  border: 1px solid transparent;
  border-radius: 13px;
  padding: 13px;
  min-height: 310px;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.kanban-column.drag-over {
  border-color: var(--green, #326650);
  background: color-mix(in srgb, #326650 6%, var(--surface, #fff));
}
.kanban-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 13px;
}
.kanban-column-head h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  margin: 0;
}
.kanban-column-head h3 i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.kanban-column-head h3 span {
  font-size: 10px;
  border: 1px solid var(--border, #e5e8e0);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--muted, #7d837c);
  margin-left: 2px;
}
.kanban-cards {
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.kanban-empty {
  text-align: center;
  font-size: 11px;
  color: var(--muted, #7d837c);
  line-height: 2.2;
  padding: 50px 5px;
}
.kanban-empty span {
  font-size: 10px;
  opacity: 0.7;
}
@media (max-width: 800px) {
  .task-board {
    grid-template-columns: 1fr;
  }
  .kanban-column {
    min-height: 140px;
  }
  .kanban-empty {
    padding: 20px 5px;
  }
}
</style>
