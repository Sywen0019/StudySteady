import test from "node:test";
import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
const { useStudyStore, STORAGE_KEY, validateData } =
  await import("../src/stores/study.js");
const { dateKey, addDays, startOfWeek } = await import("../src/utils/date.js");
const store = useStudyStore();

test("calendar arithmetic keeps local dates across month/year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-03-01", -1), "2028-02-29");
  assert.equal(startOfWeek("2026-10-25"), "2026-10-19");
  assert.equal(dateKey("2026-10-25"), "2026-10-25");
});

test("demo data is internally valid and populated on first open", () => {
  store.resetDemo();
  assert.equal(store.state.projects.length, 4);
  assert.equal(store.state.tasks.length, 24);
  assert.ok(store.state.sessions.length > 20);
  assert.doesNotThrow(() => validateData(JSON.parse(store.exportData())));
  assert.equal(JSON.parse(memory.get(STORAGE_KEY)).tasks.length, 24);
});

test("task creation, status updates and edits persist immediately", () => {
  store.clearData();
  const project = store.saveProject({
    name: "课程实验",
    description: "",
    color: "#477b62",
    dueDate: "",
    category: "课程学习",
  });
  const task = store.saveTask({
    title: "完成验收",
    description: "刷新后仍然存在",
    projectId: project.id,
    dueDate: store.today,
    priority: "high",
    status: "todo",
    estimatedMinutes: 25,
  });
  assert.equal(store.projectProgress(project.id), 0);
  store.setTaskStatus(task.id, "done");
  assert.equal(store.projectProgress(project.id), 100);
  assert.ok(store.state.tasks[0].completedAt);
  const completedAt = store.state.tasks[0].completedAt;
  store.setTaskStatus(task.id, "done");
  assert.equal(store.state.tasks[0].completedAt, completedAt);
  assert.equal(JSON.parse(memory.get(STORAGE_KEY)).tasks[0].status, "done");
  store.toggleTask(task.id);
  assert.equal(store.state.tasks[0].status, "todo");
  assert.equal(store.state.tasks[0].completedAt, null);
  store.saveTask({ ...store.state.tasks[0], title: "完成并记录验收" });
  assert.equal(store.state.tasks.length, 1);
  assert.equal(
    JSON.parse(memory.get(STORAGE_KEY)).tasks[0].title,
    "完成并记录验收",
  );
});

test("deleting a project retains tasks and deleting a task retains session history", () => {
  const task = store.state.tasks[0];
  store.addSession(25, task.id, { id: "focus-stable-id", date: "2026-10-25" });
  assert.equal(
    store.addSession(25, task.id, {
      id: "focus-stable-id",
      date: "2026-10-25",
    }),
    false,
  );
  assert.equal(store.state.sessions.length, 1);
  store.deleteProject(task.projectId);
  assert.equal(store.state.tasks.length, 1);
  assert.equal(task.projectId, "");
  store.deleteTask(task.id);
  assert.equal(store.state.tasks.length, 0);
  assert.equal(store.state.sessions.length, 1);
  assert.equal(store.state.sessions[0].taskId, "");
  assert.doesNotThrow(() => validateData(JSON.parse(store.exportData())));
});

test("backup round trip is lossless; invalid imports leave all existing state intact", () => {
  store.resetDemo();
  const original = store.exportData();
  store.clearData();
  store.importData(original);
  assert.deepEqual(JSON.parse(store.exportData()), JSON.parse(original));
  const restored = store.exportData();
  assert.throws(() => store.importData("{broken"), /JSON/);
  assert.equal(store.exportData(), restored);
  const orphaned = JSON.parse(original);
  orphaned.tasks[0].projectId = "missing-project";
  assert.throws(() => store.importData(JSON.stringify(orphaned)), /任务数据/);
  assert.equal(store.exportData(), restored);
  const duplicate = JSON.parse(original);
  duplicate.tasks[1].id = duplicate.tasks[0].id;
  assert.throws(() => store.importData(JSON.stringify(duplicate)), /重复/);
  const badDate = JSON.parse(original);
  badDate.tasks[0].dueDate = "2026-02-31";
  assert.throws(() => store.importData(JSON.stringify(badDate)), /日期/);
  assert.equal(store.exportData(), restored);
});

test("a fresh store reloads saved data and corrupted storage falls back without overwriting it", async () => {
  store.state.settings.name = "持久化测试";
  const freshModule = await import("../src/stores/study.js?reload-test");
  assert.equal(freshModule.useStudyStore().state.settings.name, "持久化测试");
  memory.set(STORAGE_KEY, "{corrupted-data");
  const recoveredModule =
    await import("../src/stores/study.js?corruption-test");
  const recovered = recoveredModule.useStudyStore();
  assert.equal(recovered.state.tasks.length, 24);
  assert.equal(recovered.ui.storageError, true);
  assert.equal(memory.get(STORAGE_KEY), "{corrupted-data");
});
