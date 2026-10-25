<script setup>
defineProps({
  label: String,
  value: [Number, String],
  unit: String,
  note: String,
  icon: [Object, Function],
  tone: { type: String, default: "green" },
});
</script>
<template>
  <article class="stat-card panel">
    <div class="stat-heading">
      <span>{{ label }}</span
      ><span class="stat-icon" :class="tone"
        ><component :is="icon" :size="17"
      /></span>
    </div>
    <div class="stat-value">
      {{ value }}<span>{{ unit }}</span>
    </div>
    <p class="stat-note">
      <slot>{{ note }}</slot>
    </p>
  </article>
</template>
