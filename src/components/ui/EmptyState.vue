<script setup>
import { Sprout } from "lucide-vue-next";
defineProps({
  title: { type: String, default: "给新的进步留一点空间" },
  description: String,
  icon: { type: [Object, Function], default: () => Sprout },
});
</script>
<template>
  <div class="empty-state">
    <component :is="icon" :size="32" :stroke-width="1.5" />
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>
