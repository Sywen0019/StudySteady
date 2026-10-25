<script setup>
import { computed, ref } from "vue";
import {
  Clock3,
  CheckCheck,
  TrendingUp,
  ArrowUpRight,
  Sprout,
} from "lucide-vue-next";
import PageHeader from "../components/ui/PageHeader.vue";
import StatCard from "../components/ui/StatCard.vue";
import ProgressBar from "../components/ui/ProgressBar.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import WeeklyChart from "../components/analytics/WeeklyChart.vue";
import CompletionRing from "../components/analytics/CompletionRing.vue";
import ActivityHeatmap from "../components/analytics/ActivityHeatmap.vue";
import { useStudyStore } from "../stores/study.js";
import { addDays, dateKey } from "../utils/date.js";

const store = useStudyStore();
const { state, today, projectProgress, tasksForProject } = store;
const period = ref(7);
const rangeStart = computed(() => addDays(today, 1 - period.value));
const inRange = (date) => date && date >= rangeStart.value && date <= today;
// 完成率的任务范围：截止日或完成日落在所选期间；并非只统计期间内完成的任务。
const trackedTasks = computed(() =>
  state.tasks.filter(
    (task) =>
      inRange(task.dueDate) ||
      inRange(task.completedAt ? dateKey(new Date(task.completedAt)) : ""),
  ),
);
const completedTasks = computed(
  () => trackedTasks.value.filter((task) => task.status === "done").length,
);
// “完成任务”计数单独按实际完成日统计，与上面完成率的口径区分。
const completedDuringPeriod = computed(
  () =>
    state.tasks.filter(
      (task) =>
        task.status === "done" &&
        task.completedAt &&
        inRange(dateKey(new Date(task.completedAt))),
    ).length,
);
const minutes = computed(() =>
  state.sessions
    .filter((session) => inRange(session.date))
    .reduce((sum, session) => sum + session.minutes, 0),
);
const activeDays = computed(
  () =>
    new Set(
      state.sessions
        .filter((session) => inRange(session.date))
        .map((session) => session.date),
    ).size,
);
const rate = computed(() =>
  trackedTasks.value.length
    ? Math.round((completedTasks.value / trackedTasks.value.length) * 100)
    : 0,
);
const days = computed(() =>
  Array.from({ length: period.value }, (_, index) => {
    const date = addDays(rangeStart.value, index);
    const instance = new Date(`${date}T12:00:00`);
    return {
      date,
      label:
        period.value === 7
          ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
              instance.getDay()
            ]
          : `${instance.getMonth() + 1}/${instance.getDate()}`,
      minutes: state.sessions
        .filter((session) => session.date === date)
        .reduce((sum, session) => sum + session.minutes, 0),
      completed: state.tasks.filter(
        (task) =>
          task.status === "done" &&
          task.completedAt &&
          dateKey(new Date(task.completedAt)) === date,
      ).length,
    };
  }),
);
const projectRows = computed(() =>
  state.projects.map((project) => ({
    ...project,
    tasks: tasksForProject(project.id),
    progress: projectProgress(project.id),
  })),
);
</script>

<template>
  <div class="analytics-page">
    <PageHeader
      eyebrow="YOUR PROGRESS, IN PERSPECTIVE"
      title="学习统计"
      description="把努力变成看得见的成长，找到适合自己的学习节奏。"
      ><template #actions
        ><div class="period-switch" aria-label="统计时间范围">
          <button
            v-for="length in [7, 30]"
            :key="length"
            :class="{ active: period === length }"
            :aria-pressed="period === length"
            @click="period = length"
          >
            近 {{ length }} 天
          </button>
        </div></template
      ></PageHeader
    >
    <div class="analytics-stats">
      <StatCard
        label="累计专注"
        :value="(minutes / 60).toFixed(1)"
        unit="小时"
        :icon="Clock3"
        :note="`有 ${activeDays} 天，认真投入了学习`"
      /><StatCard
        label="完成任务"
        :value="completedDuringPeriod"
        unit="项"
        :icon="CheckCheck"
        tone="orange"
        :note="`近 ${period} 天完成的小目标`"
      /><StatCard
        label="任务完成率"
        :value="rate"
        unit="%"
        :icon="TrendingUp"
        :note="`${trackedTasks.length} 项到期或完成的任务`"
      />
    </div>
    <div class="analytics-charts">
      <WeeklyChart :days="days" /><CompletionRing
        :completed="completedTasks"
        :total="trackedTasks.length"
      />
    </div>
    <div class="analytics-bottom">
      <ActivityHeatmap
        :sessions="state.sessions"
        :tasks="state.tasks"
        :today="today"
      />
      <section class="panel project-progress-panel">
        <div class="project-panel-header">
          <h2 class="section-title">项目成长轨迹</h2>
          <RouterLink to="/projects" class="subtle-link"
            >全部项目<ArrowUpRight :size="14"
          /></RouterLink>
        </div>
        <div v-if="projectRows.length" class="project-progress-list">
          <RouterLink
            v-for="project in projectRows"
            :key="project.id"
            class="project-progress-row"
            :to="{ path: '/projects', query: { project: project.id } }"
            ><div class="project-progress-info">
              <span
                class="project-color"
                :style="{ background: project.color }"
              /><strong>{{ project.name }}</strong
              ><span>{{ project.progress }}%</span>
            </div>
            <ProgressBar
              :value="project.progress"
              :color="project.color"
              :label="`${project.name}完成进度`"
            />
            <p>
              {{
                project.tasks.filter((task) => task.status === "done").length
              }}
              / {{ project.tasks.length }} 项任务已完成
            </p></RouterLink
          >
        </div>
        <EmptyState
          v-else
          title="成长，从一个项目开始"
          description="建立学习项目，把目标拆成一步步的行动。"
          :icon="Sprout"
          ><button class="btn btn-secondary" @click="store.openProject()">
            创建项目
          </button></EmptyState
        >
      </section>
    </div>
    <p class="analytics-footnote">
      完成率统计所选期间内截止或完成的任务；专注时长来自已保存的专注记录。
    </p>
  </div>
</template>

<style scoped>
.analytics-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 19px;
  margin-bottom: 24px;
}
.period-switch {
  display: flex;
  gap: 3px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
}
.period-switch button {
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
}
.period-switch button.active {
  color: var(--green);
  background: var(--green-soft);
  font-weight: 600;
}
.analytics-charts {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(250px, 1fr);
  gap: 23px;
  margin-bottom: 23px;
}
.analytics-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 1fr);
  gap: 23px;
  align-items: start;
}
.project-progress-panel {
  padding: 25px 24px;
}
.project-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 23px;
}
.subtle-link {
  font-size: 11px;
  display: flex;
  gap: 4px;
  align-items: center;
  color: var(--muted);
  text-decoration: none;
  white-space: nowrap;
}
.subtle-link:hover {
  color: var(--green);
}
.project-progress-list {
  display: flex;
  flex-direction: column;
  gap: 19px;
}
.project-progress-row {
  text-decoration: none;
  color: var(--text);
  display: block;
}
.project-progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}
.project-progress-info strong {
  font-size: 12px;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-progress-info > span:last-child {
  margin-left: auto;
  color: var(--muted);
  font-size: 11px;
}
.project-color {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
}
.project-progress-row p {
  font-size: 10px;
  color: var(--muted);
  margin: 6px 0 0;
}
.analytics-footnote {
  font-size: 10px;
  color: var(--muted);
  margin: 19px 0 0;
  line-height: 1.7;
}
.analytics-page {
  padding-bottom: 15px;
}
@media (max-width: 1050px) {
  .analytics-bottom {
    grid-template-columns: 1fr;
  }
  .project-progress-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
}
@media (max-width: 800px) {
  .analytics-charts {
    grid-template-columns: 1fr;
  }
  .analytics-stats {
    gap: 12px;
  }
}
@media (max-width: 550px) {
  .analytics-stats {
    grid-template-columns: 1fr;
  }
  .project-progress-list {
    grid-template-columns: 1fr;
  }
  .period-switch button {
    padding: 7px 14px;
  }
}
</style>
