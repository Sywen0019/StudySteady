<script setup>
import { computed, ref } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  ArrowUpRight,
  CheckCheck,
} from "lucide-vue-next";
import { RouterLink } from "vue-router";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import CalendarGrid from "../components/calendar/CalendarGrid.vue";
import TaskRow from "../components/tasks/TaskRow.vue";
import { useStudyStore } from "../stores/study";
import { dateKey } from "../utils/date";

const { state, today, openTask } = useStudyStore();
const month = ref(`${today.slice(0, 7)}-01`);
const selectedDate = ref(today);
const monthText = computed(() => {
  const date = new Date(`${month.value}T12:00:00`);
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
});
const selectedText = computed(() => {
  const date = new Date(`${selectedDate.value}T12:00:00`);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
});
const selectedWeekday = computed(() =>
  new Date(`${selectedDate.value}T12:00:00`).toLocaleDateString("zh-CN", {
    weekday: "long",
  }),
);
const selectedTasks = computed(() =>
  state.tasks
    .filter((task) => task.dueDate === selectedDate.value)
    .sort((a, b) => (a.status === "done") - (b.status === "done")),
);
const monthTasks = computed(() =>
  state.tasks.filter((task) =>
    task.dueDate?.startsWith(month.value.slice(0, 7)),
  ),
);
const monthDone = computed(
  () => monthTasks.value.filter((task) => task.status === "done").length,
);
const upcoming = computed(() =>
  state.tasks
    .filter((task) => task.dueDate > today && task.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3),
);
function moveMonth(step) {
  const date = new Date(`${month.value}T12:00:00`);
  date.setMonth(date.getMonth() + step);
  month.value = dateKey(date);
}
function selectDate(date) {
  selectedDate.value = date;
  if (date.slice(0, 7) !== month.value.slice(0, 7))
    month.value = `${date.slice(0, 7)}-01`;
}
function goToday() {
  month.value = `${today.slice(0, 7)}-01`;
  selectedDate.value = today;
}
function newTask() {
  openTask(null, { dueDate: selectedDate.value });
}
</script>

<template>
  <div class="calendar-page">
    <PageHeader
      eyebrow="A LITTLE PLAN, A CALMER MIND"
      title="学习日历"
      description="让每一个截止日期，都有从容的开始。"
      ><template #actions
        ><button class="btn btn-primary" @click="newTask">
          <Plus :size="16" />安排任务
        </button></template
      ></PageHeader
    >
    <div class="calendar-layout">
      <section class="panel month-panel">
        <div class="month-toolbar">
          <h2>{{ monthText }}</h2>
          <div class="month-controls">
            <button class="btn btn-ghost today-button" @click="goToday">
              今天</button
            ><button
              class="icon-btn"
              aria-label="上个月"
              @click="moveMonth(-1)"
            >
              <ChevronLeft :size="17" /></button
            ><button class="icon-btn" aria-label="下个月" @click="moveMonth(1)">
              <ChevronRight :size="17" />
            </button>
          </div>
        </div>
        <CalendarGrid
          :month="month"
          :today="today"
          :selected-date="selectedDate"
          :tasks="state.tasks"
          :projects="state.projects"
          @select-date="selectDate"
        />
        <footer class="calendar-legend">
          <span v-for="project in state.projects" :key="project.id"
            ><i :style="{ background: project.color }" />{{
              project.name
            }}</span
          ><span v-if="!state.projects.length"
            >选择日期，为它安排一个小目标。</span
          >
        </footer>
      </section>

      <aside class="calendar-aside">
        <section class="panel day-panel">
          <div class="day-panel-heading">
            <div>
              <span class="eyebrow">{{
                selectedDate === today ? "TODAY’S PLAN" : "YOUR DAILY PLAN"
              }}</span>
              <h2>
                {{ selectedText }}<span>{{ selectedWeekday }}</span>
              </h2>
            </div>
            <CalendarDays :size="21" :stroke-width="1.5" />
          </div>
          <div class="day-count">
            <span>{{ selectedTasks.length }} 个任务</span
            ><span v-if="selectedTasks.length"
              ><CheckCheck :size="12" />{{
                selectedTasks.filter((task) => task.status === "done").length
              }}
              个已完成</span
            >
          </div>
          <div v-if="selectedTasks.length" class="day-tasks">
            <TaskRow
              v-for="task in selectedTasks"
              :key="task.id"
              :task="task"
              compact
            />
          </div>
          <EmptyState
            v-else
            title="这一天，留给新的可能"
            description="安排一个小任务，让学习有自己的节奏。"
            :icon="CalendarDays"
          /><button class="day-add-button" @click="newTask">
            <Plus :size="15" />为这一天添加任务
          </button>
          <p v-if="selectedTasks.length" class="day-tip">
            点击任务，可调整截止日期与学习安排。
          </p>
        </section>
        <section class="panel month-summary">
          <span class="eyebrow">THIS MONTH</span>
          <h3>积累，看得见</h3>
          <div class="month-summary-numbers">
            <div>
              <strong>{{ monthTasks.length }}</strong
              ><span>本月安排</span>
            </div>
            <div>
              <strong>{{ monthDone }}</strong
              ><span>已经完成</span>
            </div>
            <div>
              <strong
                >{{
                  monthTasks.length
                    ? Math.round((monthDone / monthTasks.length) * 100)
                    : 0
                }}<small>%</small></strong
              ><span>完成比例</span>
            </div>
          </div>
          <RouterLink to="/analytics"
            >看看学习趋势<ArrowUpRight :size="13"
          /></RouterLink>
        </section>
      </aside>
    </div>
    <section v-if="upcoming.length" class="upcoming-section">
      <div class="upcoming-heading">
        <h2 class="section-title">接下来的小目标</h2>
        <span class="muted">提前一点，就从容一点</span>
      </div>
      <div class="upcoming-grid">
        <button
          v-for="task in upcoming"
          :key="task.id"
          class="panel upcoming-card"
          @click="openTask(task)"
        >
          <span class="upcoming-date"
            ><CalendarDays :size="14" />{{
              task.dueDate.slice(5).replace("-", " / ")
            }}</span
          ><strong>{{ task.title }}</strong
          ><ArrowUpRight :size="17" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.upcoming-card .upcoming-date {
  width: auto;
  height: auto;
  min-width: 0;
  border: 0;
  background: transparent;
  flex-direction: row;
  justify-content: flex-start;
}
.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 295px;
  gap: 22px;
  align-items: start;
}
.month-panel {
  overflow: hidden;
}
.month-toolbar {
  padding: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.month-toolbar h2 {
  font-size: 17px;
  letter-spacing: 0.02em;
  margin: 0;
}
.month-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}
.today-button {
  font-size: 10px;
  padding: 7px 12px;
  margin-right: 5px;
  border: 1px solid var(--border, #e5e8e0);
}
.calendar-legend {
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid var(--border, #e5e8e0);
  min-height: 46px;
}
.calendar-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: var(--muted, #7d837c);
}
.calendar-legend i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.calendar-aside {
  display: flex;
  flex-direction: column;
  gap: 19px;
}
.day-panel {
  overflow: hidden;
}
.day-panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 23px 20px 13px;
}
.day-panel-heading > svg {
  color: var(--green, #326650);
}
.day-panel-heading .eyebrow {
  font-size: 8px;
  letter-spacing: 0.12em;
}
.day-panel-heading h2 {
  display: flex;
  gap: 9px;
  align-items: center;
  font-size: 19px;
  margin: 9px 0 0;
}
.day-panel-heading h2 span {
  font-size: 10px;
  font-weight: 400;
  color: var(--muted, #7d837c);
}
.day-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  color: var(--muted, #7d837c);
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--border, #e5e8e0);
}
.day-count span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.day-tasks :deep(.task-row) {
  padding-left: 16px;
  padding-right: 12px;
  gap: 9px;
}
.day-tasks :deep(.task-row-title) {
  font-size: 11px;
}
.day-tasks :deep(.task-row-meta) {
  font-size: 8px;
  gap: 5px;
  flex-wrap: wrap;
}
.day-tasks :deep(.task-edit) {
  display: none;
}
.day-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 10px;
  color: var(--green, #326650);
  background: var(--background, #f6f7f2);
  border: 1px dashed var(--border, #e5e8e0);
  border-radius: 7px;
  margin: 16px 18px;
  width: calc(100% - 36px);
  padding: 10px;
  cursor: pointer;
}
.day-tip {
  font-size: 9px;
  color: var(--muted, #7d837c);
  text-align: center;
  margin: 0 12px 17px;
  line-height: 1.8;
}
.day-panel :deep(.empty-state) {
  padding: 33px 15px 15px;
}
.day-panel :deep(.empty-state h3) {
  font-size: 12px;
}
.day-panel :deep(.empty-state p) {
  font-size: 10px;
}
.month-summary {
  padding: 23px 20px;
}
.month-summary > .eyebrow {
  font-size: 8px;
}
.month-summary h3 {
  font-size: 15px;
  margin: 9px 0 22px;
}
.month-summary-numbers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.month-summary-numbers div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-right: 1px solid var(--border, #e5e8e0);
  align-items: center;
}
.month-summary-numbers div:first-child {
  align-items: flex-start;
}
.month-summary-numbers div:last-child {
  border: 0;
}
.month-summary-numbers strong {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -1px;
}
.month-summary-numbers small {
  font-size: 12px;
}
.month-summary-numbers span {
  font-size: 9px;
  color: var(--muted, #7d837c);
}
.month-summary > a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border, #e5e8e0);
  padding-top: 17px;
  margin-top: 23px;
  text-decoration: none;
  font-size: 10px;
  color: var(--green, #326650);
}
.upcoming-section {
  margin-top: 28px;
}
.upcoming-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.upcoming-heading .muted {
  font-size: 10px;
}
.upcoming-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
}
.upcoming-card {
  text-align: left;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 13px;
  padding: 19px;
  color: var(--text, #253c30);
  cursor: pointer;
}
.upcoming-date {
  display: flex;
  align-items: center;
  gap: 6px;
  grid-column: 1/-1;
  color: var(--muted, #7d837c);
  font-size: 10px;
}
.upcoming-card strong {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.7;
}
.upcoming-card > svg {
  color: var(--green, #326650);
  align-self: center;
}
@media (max-width: 1150px) {
  .calendar-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .calendar-aside {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  }
}
@media (max-width: 650px) {
  .month-toolbar {
    padding: 17px;
  }
  .month-toolbar h2 {
    font-size: 15px;
  }
  .calendar-aside {
    grid-template-columns: 1fr;
  }
  .calendar-legend {
    gap: 10px;
  }
  .upcoming-grid {
    grid-template-columns: 1fr;
  }
  .upcoming-heading .muted {
    font-size: 9px;
  }
  .calendar-layout {
    gap: 16px;
  }
  .upcoming-card {
    padding: 16px;
  }
}
</style>
