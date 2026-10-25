<script setup>
import { computed } from "vue";
import { dateKey } from "../../utils/date";
const props = defineProps({
  month: { type: String, required: true },
  selectedDate: String,
  today: String,
  tasks: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] },
});
defineEmits(["select-date"]);
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
const cells = computed(() => {
  const first = new Date(`${props.month}T12:00:00`);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    return {
      date: key,
      day: date.getDate(),
      outside: key.slice(0, 7) !== props.month.slice(0, 7),
      tasks: props.tasks
        .filter((task) => task.dueDate === key)
        .sort((a, b) => (a.status === "done") - (b.status === "done")),
    };
  });
});
function projectColor(task) {
  return (
    props.projects.find((project) => project.id === task.projectId)?.color ||
    "#869485"
  );
}
function accessibleLabel(cell) {
  const [year, month, day] = cell.date.split("-").map(Number);
  return `${year}年${month}月${day}日，${cell.tasks.length} 个任务`;
}
</script>

<template>
  <div class="calendar-grid" role="group" aria-label="月历">
    <div v-for="day in weekDays" :key="day" class="calendar-weekday">
      周{{ day }}
    </div>
    <button
      v-for="cell in cells"
      :key="cell.date"
      class="calendar-cell"
      :class="{
        outside: cell.outside,
        selected: cell.date === selectedDate,
        today: cell.date === today,
      }"
      :data-date="cell.date"
      :aria-label="accessibleLabel(cell)"
      :aria-pressed="cell.date === selectedDate"
      @click="$emit('select-date', cell.date)"
    >
      <span class="calendar-day"
        >{{ cell.day
        }}<span v-if="cell.date === today" class="today-word">今天</span></span
      >
      <span class="calendar-cell-tasks"
        ><span
          v-for="task in cell.tasks.slice(0, 2)"
          :key="task.id"
          class="calendar-task"
          :class="{ complete: task.status === 'done' }"
          :style="{ '--task-color': projectColor(task) }"
          ><i />{{ task.title }}</span
        ><span v-if="cell.tasks.length > 2" class="calendar-more"
          >+ {{ cell.tasks.length - 2 }} 个任务</span
        ></span
      >
      <span v-if="cell.tasks.length" class="calendar-mobile-dots"
        ><i
          v-for="task in cell.tasks.slice(0, 3)"
          :key="task.id"
          :style="{ background: projectColor(task) }"
      /></span>
    </button>
  </div>
</template>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-weekday {
  text-align: center;
  padding: 16px 2px;
  font-size: 10px;
  color: var(--muted, #7d837c);
  border-bottom: 1px solid var(--border, #e5e8e0);
}
.calendar-cell {
  border: 0;
  border-right: 1px solid var(--border, #e5e8e0);
  border-bottom: 1px solid var(--border, #e5e8e0);
  min-height: 119px;
  padding: 11px 7px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  background: var(--surface, #fff);
  cursor: pointer;
  color: var(--text, #253c30);
  min-width: 0;
  transition: background 0.15s;
  position: relative;
}
.calendar-cell:nth-child(7n) {
  border-right: 0;
}
.calendar-cell:nth-last-child(-n + 7) {
  border-bottom: 0;
}
.calendar-cell:hover {
  background: var(--background, #f6f7f2);
}
.calendar-cell.outside {
  background: color-mix(
    in srgb,
    var(--background, #f6f7f2) 65%,
    var(--surface, #fff)
  );
}
.calendar-cell.outside .calendar-day {
  opacity: 0.35;
}
.calendar-cell.selected {
  background: color-mix(in srgb, #4a8665 7%, var(--surface, #fff));
  box-shadow: inset 0 0 0 1.5px var(--green, #326650);
  z-index: 1;
}
.calendar-day {
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
  padding: 0 4px;
}
.calendar-cell.today .calendar-day {
  color: var(--green, #326650);
  font-weight: 700;
}
.today-word {
  font-size: 8px;
  padding: 2px 4px;
  background: var(--green, #326650);
  color: #fff;
  border-radius: 3px;
}
.calendar-cell-tasks {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 9px;
}
.calendar-task {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 4px;
  padding: 4px 5px;
  font-size: 9px;
  color: var(--task-color);
  background: color-mix(in srgb, var(--task-color) 9%, transparent);
  line-height: 1.5;
}
.calendar-task i {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--task-color);
  vertical-align: middle;
  margin-right: 3px;
}
.calendar-task.complete {
  opacity: 0.6;
  text-decoration: line-through;
}
.calendar-more {
  font-size: 8px;
  color: var(--muted, #7d837c);
  padding: 1px 5px;
}
.calendar-mobile-dots {
  display: none;
}
@media (max-width: 1000px) {
  .calendar-cell {
    min-height: 100px;
  }
  .calendar-task {
    font-size: 8px;
    padding: 3px;
  }
}
@media (max-width: 650px) {
  .calendar-cell {
    min-height: 75px;
    padding: 7px 3px;
  }
  .calendar-day {
    justify-content: center;
    font-size: 12px;
  }
  .calendar-cell-tasks {
    display: none;
  }
  .today-word {
    display: none;
  }
  .calendar-cell.today .calendar-day {
    background: var(--green, #326650);
    color: #fff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    align-self: center;
  }
  .calendar-mobile-dots {
    display: flex;
    gap: 3px;
    justify-content: center;
    margin-top: 10px;
  }
  .calendar-mobile-dots i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
  }
  .calendar-weekday {
    font-size: 10px;
    padding: 13px 0;
  }
}
</style>
