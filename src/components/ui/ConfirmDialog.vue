<script setup>
import BaseModal from "./BaseModal.vue";
import { useStudyStore } from "../../stores/study";
const { ui, notify } = useStudyStore();
async function confirm() {
  const action = ui.confirmation.action;
  ui.confirmation = null;
  try {
    await action();
  } catch (error) {
    notify(error.message, "error");
  }
}
</script>
<template>
  <BaseModal
    v-if="ui.confirmation"
    :title="ui.confirmation.title"
    @close="ui.confirmation = null"
    ><p class="confirm-description">{{ ui.confirmation.description }}</p>
    <template #footer
      ><button class="btn btn-secondary" @click="ui.confirmation = null">
        取消</button
      ><button class="btn btn-danger" @click="confirm">
        {{ ui.confirmation.confirmLabel || "确认" }}
      </button></template
    ></BaseModal
  >
</template>
