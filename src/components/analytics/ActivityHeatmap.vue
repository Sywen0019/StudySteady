<script setup>
import { computed } from "vue";
import { addDays, dateKey, startOfWeek } from "../../utils/date.js";

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  tasks: { type: Array, default: () => [] },
  today: { type: String, required: true },
});
const days = computed(() => {
  const start = addDays(startOfWeek(props.today), -77);
  const minutes = new Map();
  const completed = new Map();
  props.sessions.forEach((session) =>
    minutes.set(
      session.date,
      (minutes.get(session.date) || 0) + session.minutes,
    ),
  );
  props.tasks
    .filter((task) => task.status === "done" && task.completedAt)
    .forEach((task) => {
      const date = dateKey(new Date(task.completedAt));
      completed.set(date, (completed.get(date) || 0) + 1);
    });
  return Array.from({ length: 84 }, (_, index) => {
    const date = addDays(start, index);
    const total = minutes.get(date) || 0;
    const count = completed.get(date) || 0;
    return {
      date,
      minutes: total,
      completed: count,
      future: date > props.today,
      level:
        total >= 90
          ? 4
          : total >= 60
            ? 3
            : total >= 25
              ? 2
              : total > 0 || count > 0
                ? 1
                : 0,
    };
  });
});
const activeDays = computed(
  () => days.value.filter((day) => !day.future && day.level > 0).length,
);
const monthLabels = computed(() =>
  Array.from({ length: 12 }, (_, week) => {
    const day = days.value[week * 7];
    const previous = days.value[(week - 1) * 7];
    return week === 0 || day.date.slice(0, 7) !== previous?.date.slice(0, 7)
      ? `${Number(day.date.slice(5, 7))}月`
      : "";
  }),
);
</script>

<template>
  <section class="panel heatmap-panel">
    <div class="heatmap-heading">
      <div>
        <h2 class="section-title">坚持，留下了痕迹</h2>
        <p class="muted">
          过去 12 周，你在 {{ activeDays }} 天里为自己投入了时间。
        </p>
      </div>
      <span class="heatmap-period">近 12 周</span>
    </div>
    <div class="heatmap-scroll">
      <div class="heatmap-body">
        <div class="weekday-labels">
          <span>一</span><span>三</span><span>五</span><span>日</span>
        </div>
        <div class="heatmap-main">
          <div class="month-labels">
            <span v-for="(label, i) in monthLabels" :key="i">{{ label }}</span>
          </div>
          <div class="heatmap-grid">
            <div
              v-for="day in days"
              :key="day.date"
              class="heat-cell"
              :class="[
                `level-${day.level}`,
                { future: day.future, today: day.date === today },
              ]"
              :title="`${day.date} · ${day.minutes} 分钟专注 · ${day.completed} 项完成`"
              :aria-label="`${day.date}，${day.minutes} 分钟，完成 ${day.completed} 项任务`"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="heatmap-legend">
      <span>每一格，都是认真生活的一天</span>
      <div>
        少<i
          v-for="n in 5"
          :key="n"
          class="heat-cell"
          :class="`level-${n - 1}`"
        />多
      </div>
    </div>
  </section>
</template>

<style scoped>
.heatmap-panel {
  padding: 25px 26px;
}
.heatmap-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.heatmap-heading p {
  font-size: 12px;
  margin: 8px 0 0;
}
.heatmap-period {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 6px 9px;
  border-radius: 6px;
  white-space: nowrap;
}
.heatmap-scroll {
  overflow-x: auto;
}
.heatmap-body {
  display: flex;
  gap: 12px;
  min-width: 330px;
  margin-top: 23px;
}
.weekday-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
  padding-top: 27px;
  width: 12px;
  padding-bottom: 3px;
}
.heatmap-main {
  flex: 1;
}
.month-labels {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 7px;
  font-size: 10px;
  color: var(--muted);
  height: 24px;
}
.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 13px);
  grid-auto-flow: column;
  grid-template-columns: repeat(12, 1fr);
  gap: 7px;
}
.heat-cell {
  background: var(--bg);
  border-radius: 3px;
  min-height: 12px;
  transition: opacity 0.15s;
}
.heat-cell.level-1 {
  background: #cfdfc5;
}
.heat-cell.level-2 {
  background: #a1bf91;
}
.heat-cell.level-3 {
  background: #6a9562;
}
.heat-cell.level-4 {
  background: #2f6e55;
}
.heat-cell.future {
  opacity: 0.3;
}
.heat-cell.today {
  outline: 1px solid var(--green);
  outline-offset: 2px;
}
.heatmap-grid .heat-cell:hover {
  outline: 1px solid var(--green);
  outline-offset: 2px;
}
.heatmap-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: var(--muted);
  margin-top: 20px;
  gap: 10px;
}
.heatmap-legend > div {
  display: flex;
  gap: 5px;
  align-items: center;
}
.heatmap-legend i {
  width: 11px;
  height: 11px;
  min-height: 11px;
  border-radius: 2px;
}
.heatmap-legend > span {
  font-size: 11px;
}
@media (max-width: 600px) {
  .heatmap-panel {
    padding: 20px 16px;
  }
  .heatmap-legend > span {
    display: none;
  }
}
</style>
