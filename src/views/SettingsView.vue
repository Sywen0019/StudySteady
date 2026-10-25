<script setup>
import { computed, ref, watch } from "vue";
import {
  UserRound,
  Palette,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  ShieldCheck,
  ChevronDown,
  HardDrive,
  Leaf,
} from "lucide-vue-next";
import PageHeader from "../components/ui/PageHeader.vue";
import ThemePicker from "../components/settings/ThemePicker.vue";
import { useStudyStore } from "../stores/study.js";
import { dateKey } from "../utils/date.js";

const store = useStudyStore();
const { state, ui, notify, confirmAction } = store;
const profile = ref({ name: "", dailyGoal: 120, focusMinutes: 25 });
const fileInput = ref(null);
const showBackupHelp = ref(false);
const importing = ref(false);
watch(
  () => [
    state.settings.name,
    state.settings.dailyGoal,
    state.settings.focusMinutes,
    // 恢复数据后即使这三个设置值未变，也重新同步草稿，清除尚未保存的输入。
    ui.dataRevision,
  ],
  ([name, dailyGoal, focusMinutes]) => {
    profile.value = { name, dailyGoal, focusMinutes };
  },
  { immediate: true },
);
const dataSize = computed(() =>
  (new Blob([store.exportData()]).size / 1024).toFixed(1),
);
function savePreferences() {
  const name = profile.value.name.trim();
  const dailyGoal = Number(profile.value.dailyGoal);
  const focusMinutes = Number(profile.value.focusMinutes);
  if (!name || name.length > 30)
    return notify("昵称请填写 1–30 个字符", "error");
  if (!Number.isInteger(dailyGoal) || dailyGoal < 15 || dailyGoal > 720)
    return notify("每日目标请设为 15–720 分钟的整数", "error");
  if (!Number.isInteger(focusMinutes) || focusMinutes < 1 || focusMinutes > 120)
    return notify("单次专注请设为 1–120 分钟的整数", "error");
  Object.assign(state.settings, { name, dailyGoal, focusMinutes });
  notify("偏好已保存，让学习更适合你");
}
function downloadBackup() {
  const url = URL.createObjectURL(
    new Blob([store.exportData()], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `StudySteady-backup-${dateKey()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("备份已导出，记得妥善保存");
}
async function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("备份文件不能超过 5 MB");
    const content = await file.text();
    // 此处仅检查 JSON 语法；确认替换后再由 store.importData 校验并导入数据。
    JSON.parse(content);
    confirmAction({
      title: "用备份恢复学习数据？",
      description:
        "导入会替换当前项目、任务、专注记录和偏好设置。建议先导出一份当前备份。",
      confirmLabel: "确认导入",
      action: () => {
        try {
          store.importData(content);
          notify("学习数据已恢复");
        } catch (error) {
          notify(error.message || "导入失败，请检查备份格式", "error");
        }
      },
    });
  } catch (error) {
    notify(
      error instanceof SyntaxError
        ? "文件不是有效的 JSON 备份"
        : error.message || "无法读取备份文件",
      "error",
    );
  } finally {
    importing.value = false;
    // 清空文件选择，让下次选择同一个文件时仍能触发 change。
    event.target.value = "";
  }
}
function restoreDemo() {
  confirmAction({
    title: "重新开始一份演示？",
    description:
      "当前项目、任务和专注记录将被演示数据替换。请先导出需要保留的数据。",
    confirmLabel: "恢复演示数据",
    action: () => {
      store.resetDemo();
      notify("演示数据已恢复");
    },
  });
}
function clearAll() {
  confirmAction({
    title: "清空所有学习数据？",
    description:
      "所有项目、任务和专注记录将被移除，清空后无法撤销。请先导出备份。",
    confirmLabel: "清空数据",
    action: () => {
      store.clearData();
      notify("数据已清空，新的篇章由你开始");
    },
  });
}
</script>

<template>
  <div class="settings-page">
    <PageHeader
      eyebrow="MAKE YOURSELF AT HOME"
      title="偏好设置"
      description="调整到喜欢的样子，给自己一个舒服的学习空间。"
    />
    <div class="settings-layout">
      <div class="settings-main">
        <section class="panel settings-section">
          <div class="settings-section-heading">
            <span class="settings-section-icon"><UserRound :size="18" /></span>
            <div>
              <h2 class="section-title">你的学习节奏</h2>
              <p class="muted">不用和别人一样，适合自己就好。</p>
            </div>
          </div>
          <form @submit.prevent="savePreferences">
            <div class="settings-fields">
              <label class="field-label"
                >怎么称呼你<input
                  v-model="profile.name"
                  class="input"
                  maxlength="30"
                  autocomplete="nickname"
                  placeholder="输入你的昵称"
                  required
                /><span>这个名字会出现在每日问候里。</span></label
              >
              <div class="number-fields">
                <label class="field-label"
                  >每日专注目标
                  <div class="unit-input">
                    <input
                      v-model.number="profile.dailyGoal"
                      class="input"
                      type="number"
                      min="15"
                      max="720"
                      step="1"
                      required
                    /><span>分钟 / 天</span>
                  </div></label
                ><label class="field-label"
                  >单次专注时长
                  <div class="unit-input">
                    <input
                      v-model.number="profile.focusMinutes"
                      class="input"
                      type="number"
                      min="1"
                      max="120"
                      step="1"
                      required
                    /><span>分钟 / 次</span>
                  </div></label
                >
              </div>
            </div>
            <div class="settings-form-footer">
              <span>给每一天留一点可以完成的小目标。</span
              ><button class="btn btn-primary" type="submit">
                <Check :size="15" />保存偏好
              </button>
            </div>
          </form>
        </section>
        <section class="panel settings-section">
          <div class="settings-section-heading">
            <span class="settings-section-icon warm"
              ><Palette :size="18"
            /></span>
            <div>
              <h2 class="section-title">界面外观</h2>
              <p class="muted">白天清晰，夜晚柔和，主题会自动保存。</p>
            </div>
          </div>
          <ThemePicker v-model="state.settings.theme" />
        </section>
        <section class="panel settings-section">
          <div class="settings-section-heading">
            <span class="settings-section-icon"><Database :size="18" /></span>
            <div>
              <h2 class="section-title">数据与备份</h2>
              <p class="muted">每一步努力，都值得好好保存。</p>
            </div>
          </div>
          <div class="data-actions">
            <div class="data-action-row">
              <div>
                <h3>导出学习数据</h3>
                <p>把项目、任务、专注记录和偏好保存为 JSON 文件。</p>
              </div>
              <button class="btn btn-secondary" @click="downloadBackup">
                <Download :size="15" />导出备份
              </button>
            </div>
            <div class="data-action-row">
              <div>
                <h3>从备份恢复</h3>
                <p>选择 StudySteady 导出的 JSON 文件，恢复学习工作台。</p>
              </div>
              <input
                ref="fileInput"
                class="hidden-file-input"
                type="file"
                accept=".json,application/json"
                aria-label="选择数据备份文件"
                @change="importBackup"
              /><button
                class="btn btn-secondary"
                :disabled="importing"
                @click="fileInput?.click()"
              >
                <Upload :size="15" />{{ importing ? "读取中…" : "导入备份" }}
              </button>
            </div>
          </div>
          <button
            class="backup-help-toggle"
            :aria-expanded="showBackupHelp"
            @click="showBackupHelp = !showBackupHelp"
          >
            如何在另一台设备上继续学习？<ChevronDown
              :size="14"
              :class="{ rotated: showBackupHelp }"
            />
          </button>
          <p v-show="showBackupHelp" class="backup-help">
            在当前设备导出备份，将文件传到另一台设备后，在这里选择「导入备份」。数据保存在当前浏览器中，清理浏览器数据前请先备份。
          </p>
        </section>
        <section class="panel settings-section reset-section">
          <div class="settings-section-heading">
            <span class="settings-section-icon neutral"
              ><RotateCcw :size="18"
            /></span>
            <div>
              <h2 class="section-title">重新出发</h2>
              <p class="muted">整理好工作台，再开始下一段旅程。</p>
            </div>
          </div>
          <div class="data-action-row">
            <div>
              <h3>恢复演示数据</h3>
              <p>重新体验完整的示例项目和学习记录。</p>
            </div>
            <button class="btn btn-secondary" @click="restoreDemo">
              <RotateCcw :size="14" />恢复演示
            </button>
          </div>
          <div class="data-action-row danger-row">
            <div>
              <h3>清空学习数据</h3>
              <p>移除所有项目、任务和专注记录，从空白开始。</p>
            </div>
            <button class="btn danger-button" @click="clearAll">
              <Trash2 :size="14" />清空数据
            </button>
          </div>
        </section>
      </div>
      <aside class="settings-aside">
        <section class="panel storage-card">
          <div class="storage-icon">
            <ShieldCheck :size="25" :stroke-width="1.5" />
          </div>
          <h3>你的数据，由你掌握</h3>
          <p>
            学习记录保存在当前浏览器，修改后自动保存，无需注册，打开就能继续。
          </p>
          <div class="storage-summary">
            <span><HardDrive :size="13" />本地存储</span
            ><strong>{{ dataSize }} KB</strong>
          </div>
          <dl>
            <div>
              <dt>学习项目</dt>
              <dd>{{ state.projects.length }} 个</dd>
            </div>
            <div>
              <dt>学习任务</dt>
              <dd>{{ state.tasks.length }} 项</dd>
            </div>
            <div>
              <dt>专注记录</dt>
              <dd>{{ state.sessions.length }} 次</dd>
            </div>
          </dl>
          <div class="storage-tip">
            <span /><span>建议定期导出一份备份</span>
          </div>
        </section>
        <div class="settings-signature">
          <Leaf :size="20" :stroke-width="1.5" /><strong>StudySteady</strong
          ><span>按照自己的节奏，稳稳向前。</span
          ><small>Version 1.0 · Made for your next step</small>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 278px;
  gap: 25px;
  align-items: start;
}
.settings-main {
  display: flex;
  flex-direction: column;
  gap: 21px;
  min-width: 0;
}
.settings-section {
  padding: 26px;
}
.settings-section-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 25px;
}
.settings-section-heading p {
  font-size: 12px;
  margin: 7px 0 0;
}
.settings-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 39px;
  height: 39px;
  border-radius: 11px;
  background: var(--green-soft);
  color: var(--green);
  flex-shrink: 0;
}
.settings-section-icon.warm {
  background: #faf0e5;
  color: #b9814c;
}
.settings-section-icon.neutral {
  background: var(--bg);
  color: var(--muted);
}
.settings-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.field-label {
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.field-label > span {
  font-size: 11px;
  color: var(--muted);
  font-weight: 400;
}
.field-label > .input {
  width: 100%;
  box-sizing: border-box;
}
.number-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.unit-input {
  position: relative;
}
.unit-input input {
  width: 100%;
  box-sizing: border-box;
  padding-right: 92px;
}
.unit-input > span {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 400;
  color: var(--muted);
  pointer-events: none;
}
.settings-form-footer {
  border-top: 1px solid var(--border);
  margin-top: 25px;
  padding-top: 19px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.settings-form-footer > span {
  font-size: 11px;
  color: var(--muted);
}
.data-actions {
  display: flex;
  flex-direction: column;
}
.data-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 0;
}
.data-action-row:first-child {
  padding-top: 0;
}
.data-action-row + .data-action-row {
  border-top: 1px solid var(--border);
}
.data-action-row h3 {
  font-size: 12px;
  margin: 0 0 7px;
  font-weight: 600;
}
.data-action-row p {
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
  margin: 0;
}
.data-action-row button {
  font-size: 11px;
  padding: 9px 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.hidden-file-input {
  display: none;
}
.backup-help-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: none;
  color: var(--green);
  font-size: 11px;
  cursor: pointer;
  padding: 10px 0 0;
}
.backup-help-toggle svg {
  transition: transform 0.2s;
}
.backup-help-toggle .rotated {
  transform: rotate(180deg);
}
.backup-help {
  font-size: 11px;
  line-height: 1.9;
  color: var(--muted);
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 7px;
  margin: 12px 0 0;
}
.reset-section .settings-section-heading {
  margin-bottom: 23px;
}
.reset-section > .data-action-row:last-child {
  padding-bottom: 0;
}
.danger-button {
  color: #b65a49;
  border: 1px solid #e9c9bf;
  background: transparent;
}
.danger-button:hover {
  background: #b65a4910;
}
.danger-row h3 {
  color: #b65a49;
}
.storage-card {
  padding: 26px 23px;
}
.storage-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 47px;
  height: 47px;
  background: var(--green-soft);
  color: var(--green);
  border-radius: 13px;
  margin-bottom: 21px;
}
.storage-card h3 {
  font-size: 14px;
  margin: 0 0 11px;
}
.storage-card > p {
  font-size: 11px;
  line-height: 1.95;
  color: var(--muted);
  margin: 0;
}
.storage-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 19px 0 16px;
  border-bottom: 1px solid var(--border);
  margin-top: 10px;
  font-size: 11px;
}
.storage-summary > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
}
.storage-summary strong {
  font-size: 12px;
  font-weight: 500;
}
.storage-card dl {
  margin: 17px 0 21px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.storage-card dl > div {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}
.storage-card dt {
  color: var(--muted);
}
.storage-card dd {
  margin: 0;
}
.storage-tip {
  padding: 11px 10px;
  border-radius: 7px;
  background: var(--bg);
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 10px;
  color: var(--muted);
}
.storage-tip > span:first-child {
  height: 5px;
  width: 5px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--green);
}
.settings-signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 38px;
  color: var(--muted);
  gap: 11px;
  text-align: center;
}
.settings-signature svg {
  color: var(--green);
}
.settings-signature strong {
  font-family: Georgia, serif;
  color: var(--text);
  font-size: 21px;
  letter-spacing: -0.5px;
}
.settings-signature > span {
  font-size: 11px;
}
.settings-signature small {
  font-size: 9px;
  margin-top: 4px;
}
.settings-page {
  padding-bottom: 20px;
}
@media (max-width: 1000px) {
  .settings-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .settings-aside {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .settings-signature {
    justify-content: center;
    margin-top: 0;
  }
}
@media (max-width: 600px) {
  .settings-section {
    padding: 21px 18px;
  }
  .settings-form-footer > span {
    display: none;
  }
  .settings-form-footer {
    justify-content: flex-end;
  }
  .number-fields {
    gap: 12px;
  }
  .unit-input input {
    padding-right: 70px;
  }
  .unit-input > span {
    font-size: 10px;
    right: 10px;
  }
  .data-action-row {
    gap: 12px;
  }
  .data-action-row p {
    font-size: 10px;
  }
  .data-action-row button {
    font-size: 10px;
    padding: 8px;
  }
  .settings-aside {
    grid-template-columns: 1fr;
  }
  .settings-signature {
    padding: 20px 0 5px;
  }
  .settings-section-heading p {
    font-size: 11px;
  }
}
</style>
