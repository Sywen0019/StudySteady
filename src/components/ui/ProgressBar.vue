<script setup>
defineProps({
  value: { type: Number, default: 0 },
  color: String,
  label: { type: String, default: "完成进度" },
});
</script>
<template>
  <div
    class="progress-track"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="Math.round(value)"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <span
      :style="{
        width: Math.min(100, Math.max(0, value)) + '%',
        background: color,
      }"
    />
  </div>
</template>
