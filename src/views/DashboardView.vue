<script setup>
import { computed, ref } from "vue";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  CheckCheck,
  Clock3,
  Layers3,
  TrendingUp,
  Sparkles,
  CalendarDays,
  Code2,
  BookOpen,
  Sigma,
  Sprout,
  Check,
} from "lucide-vue-next";
import PageHeader from "../components/ui/PageHeader.vue";
import StatCard from "../components/ui/StatCard.vue";
import ProgressBar from "../components/ui/ProgressBar.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import TaskRow from "../components/tasks/TaskRow.vue";
import FocusTimer from "../components/dashboard/FocusTimer.vue";
import WeekStrip from "../components/dashboard/WeekStrip.vue";
import { useStudyStore } from "../stores/study";
import { dateKey, formatDate, startOfWeek } from "../utils/date";
const { state, today, openTask, projectProgress } = useStudyStore();
const selectedDate = ref(today);
const todayTasks = computed(() =>
  state.tasks.filter((t) => t.dueDate === today),
);
const completedToday = computed(
  () =>
    state.tasks.filter(
      (t) =>
        t.status === "done" &&
        t.completedAt &&
        dateKey(new Date(t.completedAt)) === today,
    ).length,
);
const dayTasks = computed(() =>
  state.tasks
    .filter((t) => t.dueDate === selectedDate.value)
    .sort(
      (a, b) =>
        (a.status === "done") - (b.status === "done") ||
        { high: 0, medium: 1, low: 2 }[a.priority] -
          { high: 0, medium: 1, low: 2 }[b.priority],
    ),
);
const weekMinutes = computed(() =>
  state.sessions
    .filter((s) => s.date >= startOfWeek(today) && s.date <= today)
    .reduce((sum, s) => sum + s.minutes, 0),
);
const todayMinutes = computed(() =>
  state.sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.minutes, 0),
);
const completionRate = computed(() =>
  state.tasks.length
    ? Math.round(
        (state.tasks.filter((t) => t.status === "done").length /
          state.tasks.length) *
          100,
      )
    : 0,
);
const upcoming = computed(() =>
  state.tasks
    .filter((t) => t.status !== "done" && t.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3),
);
const overdue = computed(
  () =>
    state.tasks.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate < today,
    ).length,
);
const dateLabel = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date(today + "T12:00:00"));
const icons = [Code2, BookOpen, Sigma, Sprout];
const goalPercent = computed(() =>
  Math.min(
    100,
    Math.round((todayMinutes.value / state.settings.dailyGoal) * 100),
  ),
);
</script>
<template>
  <div class="dashboard-view">
    <PageHeader
      eyebrow="A LITTLE BETTER, EVERY DAY"
      :title="`慢慢来，${state.settings.name}。`"
      description="把目光放在今天，让每一个小小的进步都有迹可循。"
      ><template #actions
        ><span class="date-pill"
          ><CalendarDays :size="15" />{{ dateLabel }}</span
        ><button class="btn btn-primary" @click="openTask()">
          <Plus :size="17" />新建任务
        </button></template
      ></PageHeader
    >
    <section class="welcome-banner">
      <div class="welcome-copy">
        <span class="welcome-eyebrow"><span />你的每一小步，都算数</span>
        <h2>今天，也在稳稳向前。</h2>
        <p>不必填满每一分钟，为真正重要的事留一点时间。</p>
        <RouterLink to="/projects" class="banner-link"
          >开始今天的学习<ArrowRight :size="16"
        /></RouterLink>
      </div>
      <svg
        class="growth-illustration"
        viewBox="0 0 360 180"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M48 151h267"
          stroke="#93a786"
          stroke-width="1.2"
          stroke-dasharray="3 5"
        />
        <ellipse cx="237" cy="152" rx="82" ry="7" fill="#dae1c8" />
        <path
          d="m173 131 87-6 29 19-88 6-28-19Z"
          fill="#b4c899"
          stroke="#52734c"
        />
        <path
          d="m173 122 87-6 29 19-88 6-28-19Z"
          fill="#f3e9d0"
          stroke="#52734c"
        />
        <path d="M173 122v9m28 10v9m88-15v9" stroke="#52734c" />
        <path d="m184 104 77 3 20 15-78-2-19-16Z" fill="#52734c" />
        <path
          d="m184 99 77 3 20 15-78-2-19-16Z"
          fill="#f8f3df"
          stroke="#52734c"
        />
        <path
          d="M238 97V48m0 27c-25-1-33-16-32-29 23 0 34 11 32 29Z"
          fill="#91aa79"
          stroke="#52734c"
          stroke-width="1.4"
        />
        <path
          d="M239 62c-2-19 13-33 31-31-1 20-13 32-31 31Z"
          fill="#c5d4a7"
          stroke="#52734c"
          stroke-width="1.4"
        />
        <path
          d="m226 91 28 1-5 21h-18l-5-22Z"
          fill="#cc9066"
          stroke="#946e4d"
        />
        <path d="M230 96h20" stroke="#f5d7b4" />
        <path
          d="M100 75h52v66h-52z"
          fill="#faf8e9"
          stroke="#96a581"
          transform="rotate(-9 100 75)"
        />
        <path
          d="m111 88 28-4m-26 15 28-4m-26 15 19-3"
          stroke="#b0bc9c"
          stroke-width="2"
        />
        <path
          d="m147 125 26-37 5 4-26 37-7 5 2-9Z"
          fill="#d6a369"
          stroke="#a57d49"
        />
        <path
          d="m314 76 4 7 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1 4-7Z"
          fill="#c6d39f"
        />
        <path
          d="M183 40v12m-6-6h12m111 73v8m-4-4h8M92 45v8m-4-4h8"
          stroke="#98ad7e"
          stroke-width="1.7"
          stroke-linecap="round"
        />
        <circle cx="284" cy="48" r="3" fill="#c99a66" /></svg
      ><span class="banner-index">01 / ONE DAY AT A TIME</span>
    </section>
    <div class="stats-grid">
      <StatCard
        label="今日已完成"
        :value="completedToday"
        unit="项"
        :icon="CheckCheck"
        :note="`今日安排了 ${todayTasks.length} 项学习任务`"
      /><StatCard
        label="本周专注"
        :value="(weekMinutes / 60).toFixed(1)"
        unit="小时"
        :icon="Clock3"
        tone="orange"
        note="把时间花在值得的事情上"
      /><StatCard
        label="进行中项目"
        :value="
          state.projects.filter((p) => projectProgress(p.id) < 100).length
        "
        unit="个"
        :icon="Layers3"
        tone="olive"
        :note="`${state.projects.length} 个学习方向，慢慢积累`"
      /><StatCard
        label="任务完成率"
        :value="completionRate"
        unit="%"
        :icon="TrendingUp"
        tone="rose"
        note="每一次完成，都是向前一步"
      />
    </div>
    <div class="dashboard-columns">
      <div class="dashboard-left">
        <section class="panel today-panel">
          <div class="panel-title">
            <h2>
              今日学习清单<span class="count-badge">{{ dayTasks.length }}</span>
            </h2>
            <RouterLink to="/projects" class="text-link"
              >全部任务<ArrowUpRight :size="15"
            /></RouterLink>
          </div>
          <WeekStrip
            v-model="selectedDate"
            :today="today"
            :tasks="state.tasks"
          />
          <div class="task-day-heading">
            <span
              >{{ selectedDate === today ? "今天" : formatDate(selectedDate)
              }}<small
                >{{ dayTasks.filter((t) => t.status === "done").length }} /
                {{ dayTasks.length }} 已完成</small
              ></span
            ><button
              class="icon-btn"
              aria-label="为所选日期添加任务"
              @click="openTask(null, { dueDate: selectedDate })"
            >
              <Plus :size="17" />
            </button>
          </div>
          <div class="dashboard-task-list">
            <TaskRow
              v-for="task in dayTasks"
              :key="task.id"
              :task="task"
            /><EmptyState
              v-if="!dayTasks.length"
              title="这一天，留白也很好"
              description="添加一个小任务，或者给自己一点休息时间。"
            />
          </div>
          <button
            class="add-task-inline"
            @click="openTask(null, { dueDate: selectedDate })"
          >
            <Plus :size="16" />添加一项学习任务</button
          ><RouterLink
            v-if="overdue"
            :to="{ path: '/projects', query: { status: 'overdue' } }"
            class="overdue-note"
            >还有 {{ overdue }} 项任务已逾期，花一分钟重新安排<ArrowRight
              :size="13"
          /></RouterLink>
        </section>
        <section class="projects-section">
          <div class="section-heading">
            <h2>
              正在耕耘的项目 <span class="eyebrow">YOUR GROWING SPACE</span>
            </h2>
            <RouterLink to="/projects" class="text-link"
              >查看全部<ArrowUpRight :size="15"
            /></RouterLink>
          </div>
          <div class="dashboard-project-grid">
            <RouterLink
              v-for="(project, index) in state.projects.slice(0, 4)"
              :key="project.id"
              :to="{ path: '/projects', query: { project: project.id } }"
              class="mini-project panel"
              ><div class="mini-project-top">
                <span
                  class="project-icon"
                  :style="{
                    color: project.color,
                    background: project.color + '15',
                  }"
                  ><component
                    :is="icons[index % icons.length]"
                    :size="19" /></span
                ><ArrowUpRight :size="16" />
              </div>
              <h3>{{ project.name }}</h3>
              <p>
                {{
                  state.tasks.filter(
                    (t) => t.projectId === project.id && t.status === "done",
                  ).length
                }}
                /
                {{
                  state.tasks.filter((t) => t.projectId === project.id).length
                }}
                项任务完成<span>{{ projectProgress(project.id) }}%</span>
              </p>
              <ProgressBar
                :value="projectProgress(project.id)"
                :color="project.color" /></RouterLink
            ><EmptyState
              v-if="!state.projects.length"
              title="为下一个目标种下一颗种子"
              description="在项目页面创建你的第一个学习项目。"
            />
          </div>
        </section>
      </div>
      <div class="dashboard-right">
        <FocusTimer />
        <section class="panel daily-goal">
          <div class="goal-title">
            <span class="goal-icon"><Sparkles :size="17" /></span>
            <h2>今天的小目标</h2>
            <strong>{{ goalPercent }}%</strong>
          </div>
          <p>
            专注 <strong>{{ todayMinutes }}</strong
            ><span> / {{ state.settings.dailyGoal }} 分钟</span>
          </p>
          <ProgressBar :value="goalPercent" /><span class="goal-caption">{{
            goalPercent >= 100
              ? "今日目标达成，给自己一个赞！"
              : "按自己的节奏来，你已经在路上。"
          }}</span>
        </section>
        <section class="upcoming-panel">
          <div class="section-heading">
            <h2>接下来</h2>
            <RouterLink to="/calendar" class="text-link"
              >日历<ArrowUpRight :size="14"
            /></RouterLink>
          </div>
          <button
            v-for="task in upcoming"
            :key="task.id"
            class="upcoming-item"
            @click="openTask(task)"
          >
            <span class="upcoming-date"
              ><small
                >{{
                  new Date(task.dueDate + "T12:00:00").getMonth() + 1
                }}月</small
              ><strong>{{
                new Date(task.dueDate + "T12:00:00").getDate()
              }}</strong></span
            ><span class="upcoming-copy"
              ><strong>{{ task.title }}</strong
              ><small>{{
                state.projects.find((p) => p.id === task.projectId)?.name ||
                "个人任务"
              }}</small></span
            ><span class="upcoming-dot" :class="task.priority" />
          </button>
          <p v-if="!upcoming.length" class="muted upcoming-empty">
            近期没有待办，享受这份从容。
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
