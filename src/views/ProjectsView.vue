<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Plus,
  LayoutGrid,
  List,
  FolderPlus,
  X,
  ArrowDownWideNarrow,
  CircleCheck,
} from "lucide-vue-next";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import ProjectCard from "../components/projects/ProjectCard.vue";
import TaskFilters from "../components/tasks/TaskFilters.vue";
import TaskRow from "../components/tasks/TaskRow.vue";
import TaskBoard from "../components/tasks/TaskBoard.vue";
import { useStudyStore } from "../stores/study";

const route = useRoute();
const router = useRouter();
const { state, today, openTask, openProject, setTaskStatus } = useStudyStore();
const view = ref("list");
const filters = ref({
  search: typeof route.query.search === "string" ? route.query.search : "",
  project:
    typeof route.query.project === "string" ? route.query.project : "all",
  status: typeof route.query.status === "string" ? route.query.status : "all",
  priority: "all",
});
const sort = ref("due");
watch(
  () => route.query.project,
  (value) => {
    filters.value.project = typeof value === "string" ? value : "all";
  },
);
watch(
  () => route.query.search,
  (value) => {
    filters.value.search = typeof value === "string" ? value : "";
  },
);
watch(
  () => route.query.status,
  (value) => {
    filters.value.status = typeof value === "string" ? value : "all";
  },
);
// 项目筛选回写 URL 时先比较，避免与上方路由监听相互触发重复导航；保留其他查询参数。
watch(
  () => filters.value.project,
  (value) => {
    if (route.query.project !== (value === "all" ? undefined : value))
      router.replace({
        query: { ...route.query, project: value === "all" ? undefined : value },
      });
  },
);
const priorityOrder = { high: 0, medium: 1, low: 2 };
const filteredTasks = computed(() => {
  const f = filters.value;
  const search = f.search.toLocaleLowerCase().trim();
  return state.tasks
    .filter(
      (task) =>
        (!search ||
          `${task.title} ${task.description}`
            .toLocaleLowerCase()
            .includes(search)) &&
        (f.project === "all" ||
          (f.project === "none"
            ? !task.projectId
            : task.projectId === f.project)) &&
        // “逾期”是按截止日动态判断的筛选条件，不是任务实际存储的状态。
        (f.status === "all" ||
          (f.status === "overdue"
            ? task.dueDate && task.dueDate < today && task.status !== "done"
            : task.status === f.status)) &&
        (f.priority === "all" || task.priority === f.priority),
    )
    .slice()
    // 默认排序优先展示未完成任务；无截止日时用较大的占位值排在同组末尾。
    .sort((a, b) =>
      sort.value === "priority"
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : sort.value === "created"
          ? b.createdAt.localeCompare(a.createdAt)
          : (a.status === "done") - (b.status === "done") ||
            (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
    );
});
const selectedProject = computed(() =>
  state.projects.find((project) => project.id === filters.value.project),
);
const overdueCount = computed(
  () =>
    state.tasks.filter(
      (task) => task.dueDate && task.dueDate < today && task.status !== "done",
    ).length,
);
function selectProject(id) {
  filters.value.project = filters.value.project === id ? "all" : id;
}
function createTask(status = "todo") {
  openTask(null, { projectId: selectedProject.value?.id || "", status });
}
function resetFilters() {
  filters.value = {
    search: "",
    project: "all",
    status: "all",
    priority: "all",
  };
}
function changeStatus({ id, status }) {
  setTaskStatus(id, status);
}
</script>

<template>
  <div class="projects-page">
    <PageHeader
      eyebrow="MAKE ROOM FOR PROGRESS"
      title="项目与任务"
      description="把大目标拆成小步，每完成一件，都更近一点。"
      ><template #actions
        ><button class="btn btn-secondary" @click="openProject()">
          <FolderPlus :size="16" />新建项目</button
        ><button class="btn btn-primary" @click="createTask()">
          <Plus :size="16" />新建任务
        </button></template
      ></PageHeader
    >
    <div class="project-section-heading">
      <h2 class="section-title">
        我的学习项目 <span>{{ state.projects.length }}</span>
      </h2>
      <p class="muted">
        {{
          overdueCount
            ? `${overdueCount} 个任务需要你关注`
            : "一切都在稳步进行中"
        }}
      </p>
    </div>
    <div v-if="state.projects.length" class="projects-grid">
      <ProjectCard
        v-for="project in state.projects"
        :key="project.id"
        :project="project"
        :selected="filters.project === project.id"
        @select="selectProject"
        @edit="openProject"
      />
    </div>
    <div v-else class="panel">
      <EmptyState
        title="开启你的第一个学习项目"
        description="课程、考试，或是一直想读完的书，都值得一个小计划。"
        ><button class="btn btn-secondary" @click="openProject()">
          <Plus :size="15" />创建项目
        </button></EmptyState
      >
    </div>

    <section class="task-workspace">
      <div class="task-workspace-heading">
        <div class="task-section-title">
          <h2 class="section-title">
            {{ selectedProject ? selectedProject.name : "全部任务" }}
          </h2>
          <span class="count-pill">{{ filteredTasks.length }}</span
          ><button
            v-if="filters.project !== 'all'"
            class="clear-project icon-btn"
            aria-label="取消项目筛选"
            @click="filters.project = 'all'"
          >
            <X :size="14" />
          </button>
        </div>
        <div class="view-switch" role="group" aria-label="任务视图">
          <button
            :class="{ active: view === 'list' }"
            :aria-pressed="view === 'list'"
            @click="view = 'list'"
          >
            <List :size="15" />列表</button
          ><button
            :class="{ active: view === 'board' }"
            :aria-pressed="view === 'board'"
            @click="view = 'board'"
          >
            <LayoutGrid :size="14" />看板
          </button>
        </div>
      </div>
      <TaskFilters v-model="filters" :projects="state.projects" />
      <div class="task-results-bar">
        <span
          >{{
            filteredTasks.filter((task) => task.status === "done").length
          }}
          个已完成 ·
          {{
            filteredTasks.filter((task) => task.status !== "done").length
          }}
          个待推进</span
        ><label
          ><ArrowDownWideNarrow :size="13" /><select
            v-model="sort"
            aria-label="任务排序方式"
          >
            <option value="due">按截止日期</option>
            <option value="priority">按优先级</option>
            <option value="created">按创建时间</option>
          </select></label
        >
      </div>
      <TaskBoard
        v-if="view === 'board'"
        :tasks="filteredTasks"
        @status-change="changeStatus"
        @new-task="createTask"
      />
      <div v-else-if="filteredTasks.length" class="panel task-list">
        <div class="task-list-label">
          <span>任务名称</span><span>优先级</span>
        </div>
        <TaskRow v-for="task in filteredTasks" :key="task.id" :task="task" />
      </div>
      <div v-else class="panel">
        <EmptyState
          :icon="CircleCheck"
          title="这里暂时没有任务"
          description="换个筛选条件，或者为下一个目标添加任务。"
          ><div class="empty-actions">
            <button class="btn btn-ghost" @click="resetFilters">清除筛选</button
            ><button class="btn btn-secondary" @click="createTask()">
              <Plus :size="15" />新建任务
            </button>
          </div></EmptyState
        >
      </div>
    </section>
  </div>
</template>

<style scoped>
.task-list :deep(.task-row) {
  padding-left: 22px;
  padding-right: 22px;
}
@media (max-width: 600px) {
  .task-list :deep(.task-row) {
    padding-left: 16px;
    padding-right: 16px;
  }
}
.project-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 16px;
}
.project-section-heading h2 span {
  font-size: 11px;
  font-weight: 400;
  margin-left: 6px;
  color: var(--muted, #7d837c);
}
.project-section-heading p {
  font-size: 11px;
  margin: 0;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 17px;
}
.task-workspace {
  margin-top: 33px;
}
.task-workspace-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 19px;
}
.task-section-title {
  display: flex;
  align-items: center;
  gap: 9px;
}
.task-section-title h2 {
  margin: 0;
}
.count-pill {
  padding: 2px 7px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e5e8e0);
  font-size: 10px;
  border-radius: 5px;
  color: var(--muted, #7d837c);
}
.view-switch {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--border, #e5e8e0);
  border-radius: 8px;
}
.view-switch button {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: 0;
  background: transparent;
  border-radius: 5px;
  color: var(--muted, #7d837c);
  padding: 7px 11px;
  font-size: 11px;
}
.view-switch button.active {
  color: var(--green, #326650);
  background: var(--surface, #fff);
  box-shadow: 0 1px 4px #0000000a;
}
.task-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted, #7d837c);
  padding: 17px 1px 13px;
}
.task-results-bar label {
  display: flex;
  align-items: center;
  gap: 5px;
}
.task-results-bar select {
  background: transparent;
  border: 0;
  color: inherit;
  font-size: 10px;
  cursor: pointer;
  outline: 0;
}
.task-list {
  overflow: hidden;
}
.task-list-label {
  display: flex;
  justify-content: space-between;
  padding: 14px 69px 14px 23px;
  background: var(--background, #f6f7f2);
  font-size: 10px;
  color: var(--muted, #7d837c);
  border-bottom: 1px solid var(--border, #e5e8e0);
}
.empty-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
@media (max-width: 1200px) {
  .projects-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .projects-grid {
    gap: 12px;
  }
  .project-section-heading {
    align-items: flex-start;
  }
  .project-section-heading p {
    max-width: 110px;
    line-height: 1.7;
    text-align: right;
  }
  .task-list-label {
    display: none;
  }
  .task-workspace-heading {
    align-items: flex-start;
  }
  .task-section-title {
    gap: 5px;
    flex-wrap: wrap;
  }
  .task-section-title h2 {
    font-size: 16px;
  }
  .view-switch button {
    padding: 7px 8px;
  }
  .task-workspace {
    margin-top: 25px;
  }
}
@media (max-width: 360px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
