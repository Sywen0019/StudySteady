<script setup>
import { computed } from "vue";
const props = defineProps({
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});
const percent = computed(() =>
  props.total ? Math.round((props.completed / props.total) * 100) : 0,
);
const circumference = 2 * Math.PI * 70;
</script>

<template>
  <section class="panel completion-panel" aria-labelledby="completion-title">
    <h2 id="completion-title" class="section-title">把计划，变成完成</h2>
    <p class="muted">所选期间内的任务完成情况</p>
    <div
      class="ring-wrap"
      role="img"
      :aria-label="`完成率 ${percent}%，${completed} / ${total} 项任务`"
    >
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle
          cx="90"
          cy="90"
          r="70"
          fill="none"
          stroke="var(--bg)"
          stroke-width="14"
        />
        <circle
          cx="90"
          cy="90"
          r="70"
          fill="none"
          stroke="var(--green)"
          stroke-width="14"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="circumference * (1 - percent / 100)"
          transform="rotate(-90 90 90)"
        />
      </svg>
      <div class="ring-label">
        <strong>{{ percent }}<small>%</small></strong
        ><span>任务完成率</span>
      </div>
    </div>
    <div class="completion-counts">
      <div>
        <i /><span>已完成</span><b>{{ completed }}</b>
      </div>
      <div>
        <i class="pending" /><span>待完成</span><b>{{ total - completed }}</b>
      </div>
    </div>
    <p class="ring-note">
      {{
        total === 0
          ? "为自己安排一个小目标吧。"
          : percent === 100
            ? "计划全部达成，给自己一点奖励。"
            : "进步不必很快，稳稳向前就好。"
      }}
    </p>
  </section>
</template>

<style scoped>
.completion-panel {
  padding: 25px 24px;
}
.completion-panel > p {
  font-size: 12px;
  margin: 8px 0 0;
}
.ring-wrap {
  width: 183px;
  height: 183px;
  margin: 22px auto 19px;
  position: relative;
}
.ring-wrap svg {
  width: 100%;
  height: 100%;
}
.ring-wrap circle {
  transition: stroke-dashoffset 0.3s;
}
.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.ring-label strong {
  font-size: 40px;
  line-height: 1;
  letter-spacing: -2px;
  color: var(--text);
}
.ring-label small {
  font-size: 20px;
  letter-spacing: 0;
  margin-left: 3px;
}
.ring-label span {
  font-size: 11px;
  color: var(--muted);
}
.completion-counts {
  display: flex;
  justify-content: center;
  gap: 25px;
  font-size: 11px;
}
.completion-counts div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.completion-counts i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
}
.completion-counts i.pending {
  background: #d7ded2;
}
.completion-counts span {
  color: var(--muted);
}
.completion-counts b {
  font-size: 13px;
}
.completion-panel > .ring-note {
  border-top: 1px solid var(--border);
  padding-top: 17px;
  margin-top: 20px;
  text-align: center;
  font-size: 11px;
  color: var(--muted);
}
</style>
