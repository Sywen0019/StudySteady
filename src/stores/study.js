import { reactive, watch } from "vue";
import { createDemoData } from "../data/demo.js";
import { dateKey } from "../utils/date.js";

export const STORAGE_KEY = "studysteady:v1";
export const STATUS_OPTIONS = [
  { value: "todo", label: "待开始" },
  { value: "in-progress", label: "进行中" },
  { value: "done", label: "已完成" },
];
export const PRIORITY_OPTIONS = [
  { value: "high", label: "高优先级" },
  { value: "medium", label: "中优先级" },
  { value: "low", label: "低优先级" },
];

const today = dateKey();
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const statuses = STATUS_OPTIONS.map((option) => option.value);
const priorities = PRIORITY_OPTIONS.map((option) => option.value);
const isDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  dateKey(value) === value;
const isTimestamp = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const text = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

/** Validate before replacing state, so a broken backup never destroys existing work. */
export function validateData(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.projects) ||
    !Array.isArray(input.tasks) ||
    !Array.isArray(input.sessions) ||
    !input.settings
  ) {
    throw new Error("备份格式不正确，请选择 StudySteady 导出的 JSON 文件。");
  }
  const checkIds = (items, label) => {
    const ids = items.map((item) => item?.id);
    if (
      ids.some((id) => typeof id !== "string" || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new Error(`${label}编号缺失或重复。`);
  };
  checkIds(input.projects, "项目");
  checkIds(input.tasks, "任务");
  checkIds(input.sessions, "专注记录");
  const projects = input.projects.map((project) => {
    if (
      !text(project.name) ||
      !/^#[0-9a-fA-F]{6}$/.test(project.color) ||
      (project.dueDate && !isDate(project.dueDate)) ||
      !isTimestamp(project.createdAt)
    )
      throw new Error("项目数据包含无效的名称、颜色或日期。");
    return {
      id: project.id,
      name: text(project.name),
      description: text(project.description),
      color: project.color,
      icon: text(project.icon, "book-open"),
      category: text(project.category, "个人学习"),
      dueDate: project.dueDate || "",
      createdAt: project.createdAt,
    };
  });
  const projectIds = new Set(projects.map((project) => project.id));
  const tasks = input.tasks.map((task) => {
    if (
      !text(task.title) ||
      !statuses.includes(task.status) ||
      !priorities.includes(task.priority) ||
      (task.dueDate && !isDate(task.dueDate)) ||
      (task.projectId && !projectIds.has(task.projectId)) ||
      !Number.isFinite(task.estimatedMinutes) ||
      task.estimatedMinutes < 0 ||
      task.estimatedMinutes > 1440 ||
      !isTimestamp(task.createdAt) ||
      (task.status === "done" && !isTimestamp(task.completedAt))
    )
      throw new Error("任务数据包含无效的状态、日期、时长或项目关联。");
    return {
      id: task.id,
      title: text(task.title),
      description: text(task.description),
      projectId: task.projectId || "",
      dueDate: task.dueDate || "",
      priority: task.priority,
      status: task.status,
      estimatedMinutes: task.estimatedMinutes,
      createdAt: task.createdAt,
      completedAt: task.status === "done" ? task.completedAt : null,
    };
  });
  const taskIds = new Set(tasks.map((task) => task.id));
  const sessions = input.sessions.map((session) => {
    if (
      !isDate(session.date) ||
      !Number.isFinite(session.minutes) ||
      session.minutes <= 0 ||
      session.minutes > 1440 ||
      (session.taskId && !taskIds.has(session.taskId))
    )
      throw new Error("专注记录包含无效的日期、时长或任务关联。");
    return {
      id: session.id,
      date: session.date,
      minutes: session.minutes,
      taskId: session.taskId || "",
    };
  });
  const { settings } = input;
  if (
    !text(settings.name) ||
    !["light", "dark", "system"].includes(settings.theme) ||
    !Number.isFinite(settings.dailyGoal) ||
    settings.dailyGoal < 15 ||
    settings.dailyGoal > 720 ||
    !Number.isFinite(settings.focusMinutes) ||
    settings.focusMinutes < 1 ||
    settings.focusMinutes > 120
  )
    throw new Error("偏好设置中的目标或专注时长不正确。");
  return {
    version: 1,
    projects,
    tasks,
    sessions,
    settings: {
      name: text(settings.name),
      dailyGoal: settings.dailyGoal,
      focusMinutes: settings.focusMinutes,
      theme: settings.theme,
    },
  };
}

let initialData = createDemoData(today);
let loadFailed = false;
try {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (raw) initialData = validateData(JSON.parse(raw));
} catch {
  loadFailed = true;
}

const state = reactive(initialData);
const ui = reactive({
  taskModal: false,
  editingTask: null,
  taskDefaults: {},
  projectModal: false,
  editingProject: null,
  toast: loadFailed
    ? {
        id: uid(),
        message:
          "本地数据无法读取，已载入演示数据。损坏的原数据暂未覆盖，可从设置导入备份。",
        type: "error",
      }
    : null,
  confirmation: null,
  storageError: loadFailed,
  dataRevision: 0,
});

let toastTimer;
function notify(message, type = "success") {
  if (ui.storageError && type === "success") {
    message += "；本地保存失败，请先导出备份。";
    type = "error";
  }
  clearTimeout(toastTimer);
  ui.toast = { id: uid(), message, type };
  toastTimer = setTimeout(() => {
    ui.toast = null;
  }, 4200);
  toastTimer.unref?.();
}

function persist() {
  try {
    if (!globalThis.localStorage) return;
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    ui.storageError = false;
  } catch {
    ui.storageError = true;
    notify("设备存储空间不足，当前更改尚未保存。请先导出备份。", "error");
  }
}

let replacing = false;
watch(
  state,
  () => {
    if (!replacing) persist();
  },
  { deep: true, flush: "sync" },
);
if (!loadFailed) persist();

const projectById = (id) => state.projects.find((project) => project.id === id);
const tasksForProject = (id) =>
  state.tasks.filter((task) => task.projectId === id);
function projectProgress(id) {
  const tasks = tasksForProject(id);
  return tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === "done").length / tasks.length) *
          100,
      )
    : 0;
}
function openTask(task = null, defaults = {}) {
  ui.editingTask = task ? { ...task } : null;
  ui.taskDefaults = { ...defaults };
  ui.taskModal = true;
}
function openProject(project = null) {
  ui.editingProject = project ? { ...project } : null;
  ui.projectModal = true;
}
function saveTask(payload) {
  if (!text(payload.title)) throw new Error("请填写任务名称。");
  if (
    !statuses.includes(payload.status) ||
    !priorities.includes(payload.priority)
  )
    throw new Error("请选择有效的状态和优先级。");
  if (payload.dueDate && !isDate(payload.dueDate))
    throw new Error("请选择有效的截止日期。");
  if (payload.projectId && !projectById(payload.projectId))
    throw new Error("所选项目已不存在，请重新选择。");
  const estimatedMinutes = Number(payload.estimatedMinutes ?? 30);
  if (
    !Number.isFinite(estimatedMinutes) ||
    estimatedMinutes < 0 ||
    estimatedMinutes > 1440
  )
    throw new Error("预计时长应在 0 到 1440 分钟之间。");
  const existing = state.tasks.find((task) => task.id === payload.id);
  const now = new Date().toISOString();
  const task = {
    id: existing?.id || uid(),
    title: text(payload.title),
    description: text(payload.description),
    projectId: payload.projectId || "",
    dueDate: payload.dueDate || "",
    priority: payload.priority,
    status: payload.status,
    estimatedMinutes,
    createdAt: existing?.createdAt || now,
    completedAt:
      payload.status === "done" ? existing?.completedAt || now : null,
  };
  if (existing) Object.assign(existing, task);
  else state.tasks.unshift(task);
  ui.taskModal = false;
  notify(existing ? "任务已更新" : "新任务已加入你的计划");
  return task;
}
function setTaskStatus(id, status) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task || !statuses.includes(status) || task.status === status) return;
  task.status = status;
  task.completedAt = status === "done" ? new Date().toISOString() : null;
  notify(
    status === "done" ? "又完成了一件事，继续稳步向前！" : "任务状态已更新",
  );
}
function toggleTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (task) setTaskStatus(id, task.status === "done" ? "todo" : "done");
}
function deleteTask(id) {
  const index = state.tasks.findIndex((task) => task.id === id);
  if (index < 0) return;
  state.tasks.splice(index, 1);
  state.sessions.forEach((session) => {
    if (session.taskId === id) session.taskId = "";
  });
  ui.taskModal = false;
  notify("任务已删除");
}
function saveProject(payload) {
  if (!text(payload.name)) throw new Error("请填写项目名称。");
  if (!/^#[0-9a-fA-F]{6}$/.test(payload.color))
    throw new Error("请选择有效的项目颜色。");
  if (payload.dueDate && !isDate(payload.dueDate))
    throw new Error("请选择有效的项目截止日期。");
  const existing = projectById(payload.id);
  const project = {
    id: existing?.id || uid(),
    name: text(payload.name),
    description: text(payload.description),
    color: payload.color,
    icon: text(payload.icon, "book-open"),
    category: text(payload.category, "个人学习"),
    dueDate: payload.dueDate || "",
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  if (existing) Object.assign(existing, project);
  else state.projects.unshift(project);
  ui.projectModal = false;
  notify(existing ? "项目已更新" : "新项目已创建");
  return project;
}
function deleteProject(id) {
  const index = state.projects.findIndex((project) => project.id === id);
  if (index < 0) return;
  state.tasks.forEach((task) => {
    if (task.projectId === id) task.projectId = "";
  });
  state.projects.splice(index, 1);
  ui.projectModal = false;
  notify("项目已删除，相关任务已保留在全部任务中");
}
function addSession(minutes, taskId = "", options = {}) {
  const duration = Number(minutes);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1440)
    throw new Error("专注时长应在 1 到 1440 分钟之间。");
  const id = options.id || uid();
  if (state.sessions.some((session) => session.id === id)) return false;
  const date = options.date || dateKey();
  if (!isDate(date)) throw new Error("专注记录日期不正确。");
  state.sessions.push({
    id,
    date,
    minutes: duration,
    taskId: state.tasks.some((task) => task.id === taskId) ? taskId : "",
  });
  notify(`已记录 ${duration} 分钟专注，积累让努力看得见。`);
  return true;
}
function confirmAction(options) {
  ui.confirmation = options;
}
function exportData() {
  return JSON.stringify(state, null, 2);
}
function replaceData(data) {
  replacing = true;
  Object.assign(state, data);
  replacing = false;
  persist();
  ui.dataRevision += 1;
}
function importData(contents) {
  let parsed;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("文件无法读取，请选择有效的 JSON 备份。");
  }
  const data = validateData(parsed);
  replaceData(data);
  notify(`已导入 ${data.projects.length} 个项目与 ${data.tasks.length} 个任务`);
  return data;
}
function resetDemo() {
  replaceData(createDemoData(dateKey()));
  notify("已恢复演示数据，可以重新开始探索");
}
function clearData() {
  replaceData({
    version: 1,
    projects: [],
    tasks: [],
    sessions: [],
    settings: { ...state.settings },
  });
  notify("学习数据已清空，偏好设置已保留");
}

const store = {
  state,
  ui,
  today,
  projectById,
  tasksForProject,
  projectProgress,
  saveTask,
  deleteTask,
  toggleTask,
  setTaskStatus,
  saveProject,
  deleteProject,
  addSession,
  openTask,
  openProject,
  notify,
  confirmAction,
  exportData,
  importData,
  resetDemo,
  clearData,
};
export function useStudyStore() {
  return store;
}
