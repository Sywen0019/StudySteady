import test from "node:test";
import assert from "node:assert/strict";
import { reactive, nextTick } from "vue";
import {
  createFocusTimer,
  FOCUS_STORAGE_KEY,
} from "../src/composables/useFocusTimer.js";

function fixture() {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const records = [];
  const store = {
    state: reactive({
      settings: { focusMinutes: 1 },
      tasks: [{ id: "task-one", status: "todo" }],
    }),
    ui: reactive({ dataRevision: 0 }),
    notify() {},
    addSession(minutes, taskId, options) {
      if (records.some((record) => record.id === options.id)) return false;
      records.push({ minutes, taskId, ...options });
      return true;
    },
  };
  let time = new Date("2026-10-25T23:59:30+08:00").getTime();
  const create = () =>
    createFocusTimer({ store, storage, now: () => time, autoTick: false });
  return {
    memory,
    storage,
    store,
    records,
    create,
    advance(ms) {
      time += ms;
    },
  };
}

test("running focus resumes after reload using elapsed wall time and records once on its finish date", () => {
  const f = fixture();
  let timer = f.create();
  timer.taskId.value = "task-one";
  timer.toggle();
  f.advance(20_000);
  timer.dispose();
  timer = f.create();
  assert.equal(timer.running.value, true);
  assert.equal(timer.label.value, "00:40");
  f.advance(45_000);
  timer.tick();
  assert.equal(f.records.length, 1);
  assert.equal(f.records[0].minutes, 1);
  assert.equal(f.records[0].taskId, "task-one");
  assert.equal(f.records[0].date, "2026-10-26");
  assert.equal(timer.running.value, false);
  timer.tick();
  timer.dispose();
  timer = f.create();
  assert.equal(f.records.length, 1);
  assert.equal(timer.remaining.value, 60);
  timer.dispose();
});

test("pausing survives refresh and never consumes time until resumed", () => {
  const f = fixture();
  let timer = f.create();
  timer.toggle();
  f.advance(15_000);
  timer.toggle();
  assert.equal(timer.remaining.value, 45);
  timer.dispose();
  f.advance(600_000);
  timer = f.create();
  assert.equal(timer.running.value, false);
  assert.equal(timer.remaining.value, 45);
  timer.toggle();
  f.advance(46_000);
  timer.tick();
  assert.equal(f.records.length, 1);
  timer.dispose();
});

test("a stale completion snapshot cannot create a duplicate session after recovery", () => {
  const f = fixture();
  let timer = f.create();
  timer.toggle();
  const runningSnapshot = f.memory.get(FOCUS_STORAGE_KEY);
  f.advance(61_000);
  timer.tick();
  timer.dispose();
  f.memory.set(FOCUS_STORAGE_KEY, runningSnapshot);
  timer = f.create();
  assert.equal(f.records.length, 1);
  assert.equal(timer.running.value, false);
  timer.dispose();
});

test("settings update idle timers and future sessions without cutting a running session short", async () => {
  const f = fixture();
  const timer = f.create();
  f.store.state.settings.focusMinutes = 2;
  await nextTick();
  assert.equal(timer.remaining.value, 120);
  timer.toggle();
  f.store.state.settings.focusMinutes = 3;
  await nextTick();
  assert.equal(timer.duration.value, 120);
  f.advance(121_000);
  timer.tick();
  assert.equal(f.records[0].minutes, 2);
  assert.equal(timer.remaining.value, 180);
  timer.dispose();
});

test("clearing/replacing data cancels the active timer and storage failures stay usable", () => {
  const f = fixture();
  const timer = f.create();
  timer.toggle();
  f.store.ui.dataRevision += 1;
  assert.equal(timer.running.value, false);
  assert.equal(timer.remaining.value, 60);
  timer.dispose();
  const unavailable = createFocusTimer({
    store: f.store,
    autoTick: false,
    storage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("full");
      },
    },
  });
  assert.equal(unavailable.storageError.value, true);
  assert.doesNotThrow(() => unavailable.toggle());
  assert.equal(unavailable.running.value, true);
  unavailable.dispose();
});

test("deleting the selected task keeps focus running as a free focus session", () => {
  const f = fixture();
  const timer = f.create();
  timer.taskId.value = "task-one";
  timer.toggle();
  f.store.state.tasks.splice(0, 1);
  assert.equal(timer.taskId.value, "");
  assert.equal(timer.running.value, true);
  f.advance(61_000);
  timer.tick();
  assert.equal(f.records[0].taskId, "");
  timer.dispose();
});
