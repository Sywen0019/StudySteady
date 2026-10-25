<script setup>
import { computed } from "vue";
import { dateKey, addDays, startOfWeek } from "../../utils/date";
const props = defineProps({ modelValue: String, today: String, tasks: Array });
defineEmits(["update:modelValue"]);
const days = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(props.today), i);
    return {
      date,
      number: new Date(date + "T12:00:00").getDate(),
      label: ["一", "二", "三", "四", "五", "六", "日"][i],
      count: props.tasks.filter(
        (t) => t.dueDate === date && t.status !== "done",
      ).length,
    };
  }),
);
</script>
<template>
  <div class="week-strip" aria-label="本周日期">
    <button
      v-for="day in days"
      :key="day.date"
      :class="{
        selected: day.date === modelValue,
        'is-today': day.date === today,
      }"
      :aria-label="`${day.date}，${day.count}项待办`"
      :aria-pressed="day.date === modelValue"
      @click="$emit('update:modelValue', day.date)"
    >
      <span>周{{ day.label }}</span
      ><strong>{{ day.number }}</strong
      ><i :class="{ active: day.count > 0 }" />
    </button>
  </div>
</template>
