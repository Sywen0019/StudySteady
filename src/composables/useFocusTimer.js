import { computed, ref, watch } from "vue";
import { useStudyStore } from "../stores/study.js";
import { dateKey } from "../utils/date.js";

export const FOCUS_STORAGE_KEY = "studysteady-focus-v1";
const newSessionId = () =>
  `focus-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;

/** One timer for the whole app, with a wall-clock deadline instead of interval drift. */
export function createFocusTimer({
  store = useStudyStore(),
  storage,
  now = Date.now,
  autoTick = true,
} = {}) {
  const { state, addSession, notify } = store;
  const duration = ref(state.settings.focusMinutes * 60);
  const remaining = ref(duration.value);
  const running = ref(false);
  const deadline = ref(null);
  const taskId = ref("");
  const sessionId = ref(newSessionId());
  const storageError = ref(false);
  let configuredMinutes = state.settings.focusMinutes;
  let completing = false;
  let interval;
  if (!storage) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storageError.value = true;
    }
  }
  function persist() {
    try {
      if (!storage) {
        storageError.value = true;
        return;
      }
      storage.setItem(
        FOCUS_STORAGE_KEY,
        JSON.stringify({
          duration: duration.value,
          remaining: remaining.value,
          running: running.value,
          deadline: deadline.value,
          taskId: taskId.value,
          sessionId: sessionId.value,
          configuredMinutes,
        }),
      );
      storageError.value = false;
    } catch {
      storageError.value = true;
    }
  }
  function reset() {
    running.value = false;
    deadline.value = null;
    configuredMinutes = state.settings.focusMinutes;
    duration.value = configuredMinutes * 60;
    remaining.value = duration.value;
    sessionId.value = newSessionId();
    persist();
  }
  function finish() {
    if (completing || !running.value) return;
    completing = true;
    // A stable id makes recovery safe if the tab closes after recording but before reset.
    const recorded = addSession(duration.value / 60, taskId.value, {
      id: sessionId.value,
      date: dateKey(new Date(deadline.value)),
    });
    const minutes = duration.value / 60;
    reset();
    completing = false;
    if (recorded !== false)
      notify(`真棒！完成了 ${minutes} 分钟专注，起来休息一下吧。`);
  }
  function tick() {
    if (!running.value) return;
    remaining.value = Math.max(0, Math.ceil((deadline.value - now()) / 1000));
    if (remaining.value === 0) finish();
  }
  function toggle() {
    if (running.value) {
      tick();
      if (!running.value) return;
      running.value = false;
      deadline.value = null;
    } else {
      if (remaining.value <= 0) reset();
      deadline.value = now() + remaining.value * 1000;
      running.value = true;
    }
    persist();
  }
  function confirmReset() {
    reset();
    notify("专注计时已重置");
  }

  try {
    const raw = storage?.getItem(FOCUS_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (
        saved &&
        Number.isInteger(saved.duration) &&
        saved.duration >= 60 &&
        saved.duration <= 7200 &&
        Number.isInteger(saved.remaining) &&
        saved.remaining >= 0 &&
        saved.remaining <= saved.duration &&
        typeof saved.running === "boolean" &&
        (!saved.running ||
          (Number.isFinite(saved.deadline) &&
            saved.deadline > 0 &&
            saved.deadline <= now() + saved.duration * 1000 + 1000))
      ) {
        duration.value = saved.duration;
        remaining.value = saved.remaining;
        running.value = saved.running;
        deadline.value = saved.running ? saved.deadline : null;
        taskId.value =
          typeof saved.taskId === "string" &&
          state.tasks.some((task) => task.id === saved.taskId)
            ? saved.taskId
            : "";
        sessionId.value =
          typeof saved.sessionId === "string" && saved.sessionId
            ? saved.sessionId
            : newSessionId();
        configuredMinutes = saved.configuredMinutes || saved.duration / 60;
        // Settings edited while this page was closed apply to idle/paused timers too.
        if (!running.value && configuredMinutes !== state.settings.focusMinutes)
          reset();
        else {
          persist();
          tick();
        }
      } else reset();
    }
  } catch {
    storageError.value = true;
  }

  const stopSettingsWatch = watch(
    () => state.settings.focusMinutes,
    () => {
      if (!running.value) reset();
    },
  );
  const stopTaskWatch = watch(taskId, persist, { flush: "sync" });
  const stopTaskListWatch = watch(
    () => taskId.value && state.tasks.some((task) => task.id === taskId.value),
    (exists) => {
      if (taskId.value && !exists) taskId.value = "";
    },
    { flush: "sync" },
  );
  const stopDataWatch = watch(() => store.ui?.dataRevision, reset, {
    flush: "sync",
  });
  if (autoTick) {
    interval = setInterval(tick, 500);
    interval.unref?.();
  }
  return {
    duration,
    remaining,
    running,
    deadline,
    taskId,
    storageError,
    toggle,
    reset,
    confirmReset,
    tick,
    label: computed(
      () =>
        `${String(Math.floor(remaining.value / 60)).padStart(2, "0")}:${String(remaining.value % 60).padStart(2, "0")}`,
    ),
    progress: computed(() =>
      Math.max(0, Math.min(100, (1 - remaining.value / duration.value) * 100)),
    ),
    tasks: computed(() => state.tasks.filter((task) => task.status !== "done")),
    dispose() {
      clearInterval(interval);
      stopSettingsWatch();
      stopTaskWatch();
      stopTaskListWatch();
      stopDataWatch();
    },
  };
}

let timer;
export function useFocusTimer() {
  if (!timer) timer = createFocusTimer();
  return timer;
}
