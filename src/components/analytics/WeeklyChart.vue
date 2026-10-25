<script setup>
import { computed, ref } from "vue";
import { Clock3, CheckCheck } from "lucide-vue-next";

const props = defineProps({ days: { type: Array, required: true } });
const metric = ref("minutes");
// 为纵轴保留最低量程，避免记录很少时柱形被过度放大。
const maximum = computed(() =>
  Math.max(
    metric.value === "minutes" ? 60 : 4,
    ...props.days.map((day) => day[metric.value]),
  ),
);
const unit = computed(() => (metric.value === "minutes" ? "分钟" : "项"));
const ticks = computed(() =>
  [1, 0.75, 0.5, 0.25, 0].map((value) => Math.round(maximum.value * value)),
);
const hasActivity = computed(() =>
  props.days.some((day) => day[metric.value] > 0),
);
</script>

<template>
  <section class="panel trend-panel" aria-labelledby="activity-title">
    <div class="chart-header">
      <div>
        <h2 id="activity-title" class="section-title">每一天，都算数</h2>
        <p class="muted">一点点积累，看见自己的节奏</p>
      </div>
      <div class="chart-switch" aria-label="统计指标">
        <button
          :class="{ active: metric === 'minutes' }"
          :aria-pressed="metric === 'minutes'"
          @click="metric = 'minutes'"
        >
          <Clock3 :size="14" />专注时长</button
        ><button
          :class="{ active: metric === 'completed' }"
          :aria-pressed="metric === 'completed'"
          @click="metric = 'completed'"
        >
          <CheckCheck :size="14" />完成任务
        </button>
      </div>
    </div>
    <div class="chart-unit">{{ unit }}</div>
    <div
      class="bar-chart"
      :class="{ dense: days.length > 7 }"
      role="img"
      :aria-label="
        days.map((day) => `${day.date}：${day[metric]}${unit}`).join('；')
      "
    >
      <div class="chart-axis">
        <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
      </div>
      <div class="plot-area">
        <div class="grid-lines"><span v-for="n in 5" :key="n" /></div>
        <div class="bars">
          <div v-for="(day, index) in days" :key="day.date" class="bar-column">
            <div class="bar-slot">
              <div
                class="chart-bar"
                :style="{ height: `${(day[metric] / maximum) * 100}%` }"
                :title="`${day.date} · ${day[metric]} ${unit}`"
              >
                <span class="bar-tooltip">{{ day[metric] }} {{ unit }}</span>
              </div>
            </div>
            <span class="bar-label">{{
              days.length <= 7 || index % 5 === 0 || index === days.length - 1
                ? day.label
                : ""
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <p v-if="!hasActivity" class="chart-empty">
      {{
        metric === "minutes"
          ? "完成一次专注，记录会从这里开始。"
          : "完成一项任务，给今天一个小小的勾。"
      }}
    </p>
    <div class="chart-legend">
      <i />{{ metric === "minutes" ? "专注学习时长" : "已完成的任务"
      }}<span>以本地日期记录</span>
    </div>
  </section>
</template>

<style scoped>
.trend-panel {
  padding: 25px 26px;
  position: relative;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.chart-header p {
  font-size: 12px;
  margin: 8px 0 0;
}
.chart-switch {
  display: flex;
  padding: 3px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  flex-shrink: 0;
}
.chart-switch button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  font-size: 11px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.chart-switch button.active {
  background: var(--surface);
  box-shadow: 0 1px 4px #0000000b;
  color: var(--green);
}
.chart-unit {
  font-size: 10px;
  color: var(--muted);
  margin: 28px 0 9px;
}
.bar-chart {
  height: 202px;
  display: flex;
  gap: 15px;
}
.chart-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
  width: 26px;
  height: 178px;
  text-align: right;
}
.plot-area {
  flex: 1;
  min-width: 0;
  position: relative;
}
.grid-lines {
  position: absolute;
  inset: 0 0 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.grid-lines span {
  border-top: 1px dashed var(--border);
  width: 100%;
}
.bars {
  display: flex;
  height: 100%;
  gap: clamp(9px, 3vw, 29px);
  padding: 0 13px;
  position: relative;
}
.bar-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}
.bar-slot {
  width: 100%;
  height: 178px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.chart-bar {
  max-width: 39px;
  min-height: 3px;
  width: 100%;
  background: var(--green);
  border-radius: 5px 5px 0 0;
  position: relative;
  transition:
    height 0.25s,
    background 0.15s;
}
.bar-column:nth-child(even) .chart-bar {
  background: #a4bc9b;
}
.chart-bar:hover {
  background: var(--orange);
}
.bar-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--surface);
  font-size: 10px;
  padding: 5px 7px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 2;
}
.chart-bar:hover .bar-tooltip {
  display: block;
}
.bar-label {
  font-size: 10px;
  color: var(--muted);
  height: 14px;
  white-space: nowrap;
}
.dense .bars {
  gap: 5px;
  padding: 0 4px;
}
.dense .chart-bar {
  border-radius: 3px 3px 0 0;
}
.dense .bar-label {
  font-size: 9px;
}
.chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 11px;
  color: var(--muted);
  margin-top: 20px;
}
.chart-legend i {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--green);
}
.chart-legend span {
  margin-left: 12px;
  color: var(--muted);
  font-size: 10px;
}
.chart-empty {
  position: absolute;
  top: 53%;
  left: 25%;
  font-size: 12px;
  color: var(--muted);
  background: var(--surface);
  padding: 7px 10px;
}
@media (max-width: 600px) {
  .trend-panel {
    padding: 20px 16px;
  }
  .chart-header {
    flex-direction: column;
  }
  .chart-switch {
    margin-top: 4px;
  }
  .bars {
    gap: 14px;
    padding: 0 4px;
  }
  .chart-empty {
    left: 17%;
    font-size: 10px;
  }
  .chart-legend span {
    display: none;
  }
}
</style>
