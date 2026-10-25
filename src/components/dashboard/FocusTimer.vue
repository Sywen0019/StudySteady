<script setup>
import { Play, Pause, RotateCcw, Coffee, Leaf } from "lucide-vue-next";
import { useFocusTimer } from "../../composables/useFocusTimer.js";
const {
  duration,
  remaining,
  running,
  taskId,
  label,
  progress,
  tasks,
  storageError,
  toggle,
  confirmReset,
} = useFocusTimer();
</script>
<template>
  <section class="panel focus-panel">
    <div class="panel-title">
      <h2><Leaf :size="18" />留一段时间，给专注</h2>
      <span class="tiny-tag">FOCUS TIME</span>
    </div>
    <div class="timer-face" :class="{ running }">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="87" class="timer-track" />
        <circle
          cx="100"
          cy="100"
          r="87"
          class="timer-progress"
          :style="{ strokeDashoffset: 547 - (547 * progress) / 100 }"
        />
      </svg>
      <div>
        <span class="timer-caption">{{
          running
            ? "正在专注"
            : remaining < duration
              ? "暂歇一下"
              : "准备好就开始"
        }}</span
        ><strong>{{ label }}</strong
        ><span class="timer-bottom"><i />一次只做一件事</span>
      </div>
    </div>
    <label class="timer-select-label" for="focus-task">本次专注任务</label
    ><select
      id="focus-task"
      v-model="taskId"
      class="input timer-select"
      :disabled="running"
    >
      <option value="">自由专注 · 给自己一点时间</option>
      <option v-for="task in tasks" :key="task.id" :value="task.id">
        {{ task.title }}
      </option>
    </select>
    <div class="timer-buttons">
      <button class="btn btn-primary" @click="toggle">
        <component
          :is="running ? Pause : Play"
          :size="16"
          :fill="running ? 'none' : 'currentColor'"
        />{{
          running ? "暂停专注" : remaining < duration ? "继续专注" : "开始专注"
        }}</button
      ><button
        class="btn btn-secondary timer-reset"
        aria-label="重置专注计时"
        @click="confirmReset"
      >
        <RotateCcw :size="17" />
      </button>
    </div>
    <p v-if="storageError" class="focus-tip" role="status">
      当前设备无法保存计时，关闭页面后可能需要重新开始。
    </p>
    <p v-else class="focus-tip">
      <Coffee :size="14" />专注结束后，记得给大脑放个小假。
    </p>
  </section>
</template>
