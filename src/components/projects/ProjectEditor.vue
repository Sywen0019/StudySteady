<script setup>
import { onMounted, reactive, ref } from "vue";
import { Trash2 } from "lucide-vue-next";
import BaseModal from "../ui/BaseModal.vue";
import { useStudyStore } from "../../stores/study";
const { ui, today, saveProject, deleteProject, confirmAction, notify } =
  useStudyStore();
// 将项目字段复制到表单，输入只修改草稿，提交时才交给 store 保存。
const form = reactive({
  name: "",
  description: "",
  category: "课程学习",
  color: "#38745c",
  icon: "code",
  dueDate: today,
  ...ui.editingProject,
});
const colors = [
  "#38745c",
  "#b87645",
  "#6e7b9a",
  "#b36670",
  "#8b8248",
  "#457f8b",
];
const nameInput = ref(null);
onMounted(() => nameInput.value?.focus());
function submit() {
  try {
    saveProject({ ...form, name: form.name.trim() });
  } catch (error) {
    notify(error.message, "error");
  }
}
function remove() {
  const id = form.id;
  ui.projectModal = false;
  confirmAction({
    title: "删除这个学习项目？",
    description: `「${form.name}」将被移除，其任务会保留为未归类任务，学习记录也会保留。`,
    confirmLabel: "删除项目",
    action: () => deleteProject(id),
  });
}
</script>
<template>
  <BaseModal
    :title="ui.editingProject ? '编辑学习项目' : '开启一个新项目'"
    description="有方向的小步积累，会带你走得更远。"
    @close="ui.projectModal = false"
    ><form id="project-form" class="editor-form" @submit.prevent="submit">
      <label class="field"
        >项目名称 <span class="required">*</span
        ><input
          ref="nameInput"
          v-model="form.name"
          class="input"
          placeholder="例如：Web 全栈开发"
          required
          maxlength="60" /></label
      ><label class="field"
        >项目描述<textarea
          v-model="form.description"
          class="input"
          rows="3"
          placeholder="这个项目想要实现什么？"
          maxlength="1000"
        />
      </label>
      <div class="form-grid">
        <label class="field"
          >项目类型<select v-model="form.category" class="input">
            <option>课程学习</option>
            <option>考试备考</option>
            <option>个人成长</option>
            <option>实践项目</option>
          </select></label
        ><label class="field"
          >目标日期<input
            v-model="form.dueDate"
            class="input"
            type="date"
            min="2000-01-01"
            max="2099-12-31"
            required
        /></label>
      </div>
      <fieldset class="color-field">
        <legend>项目颜色</legend>
        <button
          v-for="color in colors"
          :key="color"
          class="color-option"
          :class="{ selected: form.color === color }"
          :style="{ background: color }"
          :aria-label="'选择颜色 ' + color"
          :aria-pressed="form.color === color"
          type="button"
          @click="form.color = color"
        >
          <span v-if="form.color === color">✓</span>
        </button>
      </fieldset>
    </form>
    <template #footer
      ><button
        v-if="ui.editingProject"
        type="button"
        class="btn btn-ghost danger-text delete-action"
        @click="remove"
      >
        <Trash2 :size="16" />删除项目</button
      ><button class="btn btn-secondary" @click="ui.projectModal = false">
        取消</button
      ><button class="btn btn-primary" form="project-form" type="submit">
        {{ ui.editingProject ? "保存修改" : "创建项目" }}
      </button></template
    ></BaseModal
  >
</template>
