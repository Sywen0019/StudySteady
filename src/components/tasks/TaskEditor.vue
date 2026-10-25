<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { Trash2 } from "lucide-vue-next";
import BaseModal from "../ui/BaseModal.vue";
import { useStudyStore } from "../../stores/study";
const { state, ui, today, saveTask, deleteTask, confirmAction, notify } =
  useStudyStore();
const editing = computed(() => !!ui.editingTask);
// 用独立表单承接编辑值；后展开的数据覆盖默认值，取消时不会提前改动原任务。
const form = reactive({
  title: "",
  description: "",
  projectId: "",
  dueDate: today,
  priority: "medium",
  status: "todo",
  estimatedMinutes: 30,
  ...ui.taskDefaults,
  ...ui.editingTask,
});
const titleInput = ref(null);
onMounted(() => titleInput.value?.focus());
function submit() {
  if (!form.title.trim()) return titleInput.value?.focus();
  try {
    saveTask({ ...form, title: form.title.trim() });
  } catch (error) {
    notify(error.message, "error");
  }
}
function remove() {
  const id = form.id;
  ui.taskModal = false;
  confirmAction({
    title: "删除这项任务？",
    description: `「${form.title}」将被删除，关联的专注记录会保留。`,
    confirmLabel: "删除任务",
    action: () => deleteTask(id),
  });
}
</script>
<template>
  <BaseModal
    :title="editing ? '编辑学习任务' : '添加学习任务'"
    description="把大目标拆成今天可以迈出的一小步。"
    @close="ui.taskModal = false"
  >
    <form id="task-form" class="editor-form" @submit.prevent="submit">
      <label class="field"
        >任务名称 <span class="required">*</span
        ><input
          ref="titleInput"
          v-model="form.title"
          class="input"
          placeholder="例如：完成 Vue 组件通信实验"
          maxlength="120"
          required /></label
      ><label class="field"
        >任务描述<textarea
          v-model="form.description"
          class="input"
          rows="3"
          placeholder="记录目标、资料链接或下一步…"
          maxlength="2000"
        />
      </label>
      <div class="form-grid">
        <label class="field"
          >所属项目<select v-model="form.projectId" class="input">
            <option value="">未归类</option>
            <option
              v-for="project in state.projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select></label
        ><label class="field"
          >截止日期<input
            v-model="form.dueDate"
            class="input"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            required /></label
        ><label class="field"
          >优先级<select v-model="form.priority" class="input">
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select></label
        ><label class="field"
          >任务状态<select v-model="form.status" class="input">
            <option value="todo">待开始</option>
            <option value="in-progress">进行中</option>
            <option value="done">已完成</option>
          </select></label
        >
      </div>
      <label class="field"
        >预计用时（分钟）<input
          v-model.number="form.estimatedMinutes"
          class="input"
          type="number"
          min="5"
          max="1440"
          step="5"
          required
      /></label>
    </form>
    <template #footer
      ><button
        v-if="editing"
        type="button"
        class="btn btn-ghost danger-text delete-action"
        @click="remove"
      >
        <Trash2 :size="16" />删除任务</button
      ><button class="btn btn-secondary" @click="ui.taskModal = false">
        取消</button
      ><button class="btn btn-primary" form="task-form" type="submit">
        {{ editing ? "保存修改" : "创建任务" }}
      </button></template
    >
  </BaseModal>
</template>
