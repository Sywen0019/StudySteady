import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, firefox, expect as baseExpect } from "@playwright/test";

// The dev/preview server must already be running. Each run gets isolated browser
// storage; it never opens or changes a user's existing browser profile.
const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
const expect = baseExpect.configure({ timeout: 10000 });
const browserType = process.env.PW_BROWSER === "firefox" ? firefox : chromium;
const browser = await browserType.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));
page.setDefaultTimeout(10000);
let passed = 0;

async function step(name, run) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${passed}: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}\nURL: ${page.url()}\n${error.stack || error}`);
    if (runtimeErrors.length)
      console.error("Browser runtime errors:", runtimeErrors);
    throw error;
  }
}
async function navigate(path, title) {
  await page.goto(`${baseURL}${path}`);
  await expect(
    page.getByRole("heading", { name: title, exact: true, level: 1 }),
  ).toBeVisible();
}
async function data() {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("studysteady:v1")),
  );
}
async function rawData() {
  return page.evaluate(() => localStorage.getItem("studysteady:v1"));
}
async function taskByTitle(title) {
  return (await data()).tasks.find((task) => task.title === title);
}
function taskRow(title) {
  return page.locator(".task-row").filter({ hasText: title }).first();
}
async function openTask(title) {
  await taskRow(title).locator(".task-row-main").click();
  return page.getByRole("dialog", { name: "编辑学习任务" });
}
async function createTask(title, overrides = {}) {
  await page
    .locator(".page-actions")
    .getByRole("button", { name: "新建任务", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "添加学习任务" });
  await dialog.getByLabel("任务名称").fill(title);
  await dialog
    .getByLabel("任务描述")
    .fill(overrides.description || "浏览器验证创建的独立测试任务");
  if (overrides.projectId !== undefined)
    await dialog.getByLabel("所属项目").selectOption(overrides.projectId);
  if (overrides.dueDate)
    await dialog.getByLabel("截止日期").fill(overrides.dueDate);
  if (overrides.priority)
    await dialog.getByLabel("优先级").selectOption(overrides.priority);
  await dialog.getByRole("button", { name: "创建任务", exact: true }).click();
  await expect(dialog).toBeHidden();
  const task = await taskByTitle(title);
  assert.ok(task, "New task must be persisted");
  return task;
}
async function uploadJSON(contents, name = "StudySteady-test.json") {
  await page.getByLabel("选择数据备份文件").setInputFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
}

try {
  let referenceDate;
  await step(
    "首次进入直接深链：展示 4 个项目、24 个演示任务并持久化",
    async () => {
      await navigate("/projects", "项目与任务");
      const initial = await data();
      assert.equal(initial.projects.length, 4);
      assert.equal(initial.tasks.length, 24);
      referenceDate = initial.tasks[0].dueDate;
      await expect(page.locator(".project-card")).toHaveCount(4);
      await expect(page.locator(".task-row")).toHaveCount(24);
    },
  );

  const initialTitle = "E2E 创建：组件通信复习";
  const editedTitle = "E2E 已编辑：组件通信复习";
  let createdId;
  await step("新建任务：表单、项目关联、优先级、描述和日期", async () => {
    const task = await createTask(initialTitle, {
      projectId: "project-web",
      priority: "high",
      dueDate: referenceDate,
    });
    createdId = task.id;
    assert.equal(task.projectId, "project-web");
    assert.equal(task.priority, "high");
    assert.equal(task.dueDate, referenceDate);
    await expect(taskRow(initialTitle)).toBeVisible();
  });
  await step("编辑任务、完成、刷新持久化、重新打开任务", async () => {
    const dialog = await openTask(initialTitle);
    await dialog.getByLabel("任务名称").fill(editedTitle);
    await dialog.getByLabel("任务状态").selectOption("in-progress");
    await dialog.getByRole("button", { name: "保存修改", exact: true }).click();
    assert.equal((await taskByTitle(editedTitle)).status, "in-progress");
    await taskRow(editedTitle)
      .getByRole("button", { name: `完成任务：${editedTitle}`, exact: true })
      .click();
    assert.equal((await taskByTitle(editedTitle)).status, "done");
    assert.ok((await taskByTitle(editedTitle)).completedAt);
    await page.reload();
    await expect(taskRow(editedTitle)).toHaveClass(/completed/);
    assert.equal((await taskByTitle(editedTitle)).status, "done");
    await taskRow(editedTitle)
      .getByRole("button", { name: `取消完成：${editedTitle}`, exact: true })
      .click();
    assert.equal((await taskByTitle(editedTitle)).status, "todo");
    assert.equal((await taskByTitle(editedTitle)).completedAt, null);
  });
  await step("删除任务：取消保护数据，确认后删除", async () => {
    let dialog = await openTask(editedTitle);
    await dialog.getByRole("button", { name: "删除任务", exact: true }).click();
    await page
      .getByRole("dialog", { name: "删除这项任务？" })
      .getByRole("button", { name: "取消", exact: true })
      .click();
    assert.ok(await taskByTitle(editedTitle));
    dialog = await openTask(editedTitle);
    await dialog.getByRole("button", { name: "删除任务", exact: true }).click();
    await page
      .getByRole("dialog", { name: "删除这项任务？" })
      .getByRole("button", { name: "删除任务", exact: true })
      .click();
    await expect(taskRow(editedTitle)).toHaveCount(0);
    assert.ok(!(await data()).tasks.some((task) => task.id === createdId));
  });

  await step("任务搜索、项目/状态/优先级筛选与逾期深链", async () => {
    const filters = page.locator(".task-filters");
    await filters
      .getByRole("textbox", { name: "搜索任务", exact: true })
      .fill("不存在的 E2E 任务");
    await expect(page.locator(".task-row")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "这里暂时没有任务", exact: true }),
    ).toBeVisible();
    await filters
      .getByRole("button", { name: "清除搜索", exact: true })
      .click();
    await filters.getByLabel("按优先级筛选").selectOption("high");
    const highCount = (await data()).tasks.filter(
      (task) => task.priority === "high",
    ).length;
    await expect(page.locator(".task-row")).toHaveCount(highCount);
    await filters.getByLabel("按优先级筛选").selectOption("all");
    await filters.getByLabel("按状态筛选").selectOption("done");
    const doneCount = (await data()).tasks.filter(
      (task) => task.status === "done",
    ).length;
    await expect(page.locator(".task-row.completed")).toHaveCount(doneCount);
    await filters.getByLabel("按状态筛选").selectOption("all");
    await filters.getByLabel("按项目筛选").selectOption("project-web");
    await expect(page).toHaveURL(/project=project-web/);
    await expect(page.locator(".task-row")).toHaveCount(
      (await data()).tasks.filter((task) => task.projectId === "project-web")
        .length,
    );
    await navigate("/projects?status=overdue", "项目与任务");
    await expect(
      page.locator(".task-filters").getByLabel("按状态筛选"),
    ).toHaveValue("overdue");
    const overdue = (await data()).tasks.filter(
      (task) =>
        task.dueDate && task.dueDate < referenceDate && task.status !== "done",
    );
    await expect(page.locator(".task-row")).toHaveCount(overdue.length);
  });
  await step("顶部全局搜索可真实定位任务", async () => {
    await page
      .locator(".global-search")
      .getByRole("textbox", { name: "搜索任务" })
      .fill("归还图书馆");
    await page
      .locator(".global-search")
      .getByRole("textbox", { name: "搜索任务" })
      .press("Enter");
    await expect(
      page.locator(".task-filters").getByRole("textbox", { name: "搜索任务" }),
    ).toHaveValue("归还图书馆");
    // A global search must start with a complete task view, not an earlier overdue filter.
    await page
      .locator(".task-filters")
      .getByLabel("按状态筛选")
      .selectOption("all");
    await expect(page.locator(".task-row")).toHaveCount(1);
    await expect(taskRow("归还图书馆借阅书籍")).toBeVisible();
  });
  await step("任务看板：下拉修改与拖拽修改状态", async () => {
    await navigate("/projects", "项目与任务");
    await page.getByRole("button", { name: "看板", exact: true }).click();
    const card = page
      .locator(".kanban-card")
      .filter({ hasText: "完成 Vue 组件拆分与 Props 传递" });
    await expect(card).toBeVisible();
    await card.getByLabel("修改任务状态").selectOption("done");
    assert.equal(
      (await taskByTitle("完成 Vue 组件拆分与 Props 传递")).status,
      "done",
    );
    await card.dragTo(
      page.getByRole("region", { name: "待开始任务", exact: true }),
    );
    await expect
      .poll(
        async () =>
          (await taskByTitle("完成 Vue 组件拆分与 Props 传递")).status,
      )
      .toBe("todo");
    await page.getByRole("button", { name: "列表", exact: true }).click();
    await expect(page.locator(".task-row")).toHaveCount(24);
  });

  const projectName = "E2E 学期阅读项目";
  const editedProjectName = "E2E 已编辑阅读项目";
  let newProjectId;
  await step("项目新建、编辑与关联任务", async () => {
    await page
      .locator(".page-actions")
      .getByRole("button", { name: "新建项目", exact: true })
      .click();
    let dialog = page.getByRole("dialog", { name: "开启一个新项目" });
    await dialog.getByLabel("项目名称").fill(projectName);
    await dialog
      .getByLabel("项目描述")
      .fill("从一个小目标开始，完成阅读计划。");
    await dialog.getByLabel("项目类型").selectOption("个人成长");
    await dialog.getByRole("button", { name: "创建项目", exact: true }).click();
    newProjectId = (await data()).projects.find(
      (project) => project.name === projectName,
    )?.id;
    assert.ok(newProjectId);
    await page
      .getByRole("button", { name: `编辑项目：${projectName}`, exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "编辑学习项目" });
    await dialog.getByLabel("项目名称").fill(editedProjectName);
    await dialog.getByRole("button", { name: "保存修改", exact: true }).click();
    assert.equal(
      (await data()).projects.find((project) => project.id === newProjectId)
        .name,
      editedProjectName,
    );
    await createTask("E2E 删除项目后保留的任务", { projectId: newProjectId });
  });
  await step("删除项目：取消不变，确认删除后保留未归类任务", async () => {
    await page
      .getByRole("button", {
        name: `编辑项目：${editedProjectName}`,
        exact: true,
      })
      .click();
    await page
      .getByRole("dialog", { name: "编辑学习项目" })
      .getByRole("button", { name: "删除项目", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "删除这个学习项目？" })
      .getByRole("button", { name: "取消", exact: true })
      .click();
    assert.ok(
      (await data()).projects.some((project) => project.id === newProjectId),
    );
    await page
      .getByRole("button", {
        name: `编辑项目：${editedProjectName}`,
        exact: true,
      })
      .click();
    await page
      .getByRole("dialog", { name: "编辑学习项目" })
      .getByRole("button", { name: "删除项目", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "删除这个学习项目？" })
      .getByRole("button", { name: "删除项目", exact: true })
      .click();
    assert.ok(
      !(await data()).projects.some((project) => project.id === newProjectId),
    );
    assert.equal((await taskByTitle("E2E 删除项目后保留的任务")).projectId, "");
    await expect(taskRow("E2E 删除项目后保留的任务")).toBeVisible();
  });

  await step("日历月切换、回到今天、按日创建及截止日期修改", async () => {
    await navigate("/calendar", "学习日历");
    const originalMonth = await page.locator(".month-toolbar h2").innerText();
    await page.getByRole("button", { name: "下个月", exact: true }).click();
    assert.notEqual(
      await page.locator(".month-toolbar h2").innerText(),
      originalMonth,
    );
    await page.getByRole("button", { name: "上个月", exact: true }).click();
    await expect(page.locator(".month-toolbar h2")).toHaveText(originalMonth);
    await page.getByRole("button", { name: "今天", exact: true }).click();
    await expect(
      page.locator(`.calendar-cell[data-date="${referenceDate}"]`),
    ).toHaveAttribute("aria-pressed", "true");
    const chosen = await page
      .locator(".calendar-cell:not(.outside)")
      .nth(10)
      .getAttribute("data-date");
    await page.locator(`.calendar-cell[data-date="${chosen}"]`).click();
    await page
      .locator(".page-actions")
      .getByRole("button", { name: "安排任务", exact: true })
      .click();
    let dialog = page.getByRole("dialog", { name: "添加学习任务" });
    await expect(dialog.getByLabel("截止日期")).toHaveValue(chosen);
    await dialog.getByLabel("任务名称").fill("E2E 日历学习安排");
    await dialog.getByRole("button", { name: "创建任务", exact: true }).click();
    assert.equal((await taskByTitle("E2E 日历学习安排")).dueDate, chosen);
    await expect(
      page.locator(".day-tasks").getByText("E2E 日历学习安排", { exact: true }),
    ).toBeVisible();
    await page
      .locator(".day-tasks .task-row-main")
      .filter({ hasText: "E2E 日历学习安排" })
      .click();
    dialog = page.getByRole("dialog", { name: "编辑学习任务" });
    await dialog.getByLabel("截止日期").fill(referenceDate);
    await dialog.getByRole("button", { name: "保存修改", exact: true }).click();
    assert.equal(
      (await taskByTitle("E2E 日历学习安排")).dueDate,
      referenceDate,
    );
  });

  await step("昵称、目标与主题：保存并刷新保持", async () => {
    await navigate("/settings", "偏好设置");
    await page.getByLabel("怎么称呼你").fill("验收同学");
    await page.getByLabel("每日专注目标").fill("150");
    await page.getByLabel("单次专注时长").fill("35");
    await page.getByRole("button", { name: "保存偏好", exact: true }).click();
    await page
      .getByRole("button", { name: "夜间 · 静谧深林", exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.getByLabel("怎么称呼你")).toHaveValue("验收同学");
    await expect(page.getByLabel("每日专注目标")).toHaveValue("150");
    await expect(page.getByLabel("单次专注时长")).toHaveValue("35");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
  await step("导出 JSON 备份与确认导入恢复", async () => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出备份", exact: true }).click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /^StudySteady-backup-.+\.json$/);
    const backup = JSON.parse(await readFile(await download.path(), "utf8"));
    assert.equal(backup.tasks.length, (await data()).tasks.length);
    backup.settings.name = "备份恢复同学";
    await uploadJSON(JSON.stringify(backup));
    const confirmation = page.getByRole("dialog", {
      name: "用备份恢复学习数据？",
    });
    await expect(confirmation).toBeVisible();
    await confirmation
      .getByRole("button", { name: "确认导入", exact: true })
      .click();
    await expect(page.getByLabel("怎么称呼你")).toHaveValue("备份恢复同学");
    assert.equal((await data()).settings.name, "备份恢复同学");
  });
  await step("无效 JSON 与无效结构导入均不破坏现有数据", async () => {
    const before = await rawData();
    await uploadJSON("{broken-json");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    assert.equal(await rawData(), before);
    await uploadJSON(JSON.stringify({ version: 1, tasks: [] }));
    await page
      .getByRole("dialog", { name: "用备份恢复学习数据？" })
      .getByRole("button", { name: "确认导入", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    assert.equal(await rawData(), before);
  });
  await step("清空数据的确认保护、空态与恢复演示", async () => {
    const before = await rawData();
    await page.getByRole("button", { name: "清空数据", exact: true }).click();
    await page
      .getByRole("dialog", { name: "清空所有学习数据？" })
      .getByRole("button", { name: "取消", exact: true })
      .click();
    assert.equal(await rawData(), before);
    await page.getByRole("button", { name: "清空数据", exact: true }).click();
    await page
      .getByRole("dialog", { name: "清空所有学习数据？" })
      .getByRole("button", { name: "清空数据", exact: true })
      .click();
    assert.equal((await data()).tasks.length, 0);
    assert.equal((await data()).projects.length, 0);
    await page.reload();
    assert.equal((await data()).tasks.length, 0);
    await navigate("/projects", "项目与任务");
    await expect(
      page.getByRole("heading", { name: "开启你的第一个学习项目" }),
    ).toBeVisible();
    for (const path of ["/", "/calendar", "/analytics"]) {
      await page.goto(`${baseURL}${path}`);
      await expect(page.locator("main h1")).toBeVisible();
    }
    await navigate("/settings", "偏好设置");
    await page.getByRole("button", { name: "恢复演示", exact: true }).click();
    await page
      .getByRole("dialog", { name: "重新开始一份演示？" })
      .getByRole("button", { name: "恢复演示数据", exact: true })
      .click();
    assert.equal((await data()).tasks.length, 24);
    assert.equal((await data()).projects.length, 4);
    assert.equal((await data()).settings.theme, "light");
  });
  await step("五个页面直接导航与手机视口均无横向溢出", async () => {
    const routes = [
      ["/", "今天，也稳稳向前。"],
      ["/projects", "项目与任务"],
      ["/calendar", "学习日历"],
      ["/analytics", "学习统计"],
      ["/settings", "偏好设置"],
    ];
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [path, title] of routes) {
      await page.goto(`${baseURL}${path}`);
      // The overview includes a personalized greeting, so only require its main heading.
      await expect(page.locator("main h1")).toBeVisible();
      if (path !== "/")
        await expect(
          page.getByRole("heading", { name: title, exact: true, level: 1 }),
        ).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      assert.ok(
        dimensions.content <= dimensions.viewport + 1,
        `${path} overflows: ${dimensions.content}px > ${dimensions.viewport}px`,
      );
    }
    await page.getByRole("button", { name: "打开菜单", exact: true }).click();
    await expect(page.locator(".app-sidebar")).toHaveClass(/open/);
    await page
      .getByRole("navigation", { name: "主导航" })
      .getByRole("link", { name: "学习日历", exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}/calendar`);
    await expect(page.locator(".app-sidebar")).not.toHaveClass(/open/);
  });
  await step("窄屏项目操作与日历可用，弹框键盘焦点完整返回", async () => {
    await page.setViewportSize({ width: 360, height: 800 });
    await navigate("/projects", "项目与任务");
    const actions = page.locator(".page-actions");
    const projectTrigger = actions.getByRole("button", {
      name: "新建项目",
      exact: true,
    });
    const taskTrigger = actions.getByRole("button", {
      name: "新建任务",
      exact: true,
    });
    await projectTrigger.click({ trial: true });
    await taskTrigger.click({ trial: true });
    for (const button of [projectTrigger, taskTrigger]) {
      const box = await button.boundingBox();
      assert.ok(
        box && box.x >= 0 && box.x + box.width <= 361,
        "Project actions must fit a 360px viewport",
      );
    }
    const titleBox = await page.locator("main h1").boundingBox();
    const actionsBox = await actions.boundingBox();
    assert.ok(
      titleBox &&
        actionsBox &&
        (actionsBox.y >= titleBox.y + titleBox.height ||
          actionsBox.x >= titleBox.x + titleBox.width),
      "Page heading and action buttons must not overlap",
    );
    await taskTrigger.focus();
    await taskTrigger.click();
    const dialog = page.getByRole("dialog", { name: "添加学习任务" });
    await expect(dialog.getByLabel("任务名称")).toBeFocused();
    const closeButton = dialog.getByRole("button", {
      name: "关闭弹窗",
      exact: true,
    });
    const lastButton = dialog.getByRole("button", {
      name: "创建任务",
      exact: true,
    });
    await lastButton.focus();
    await page.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastButton).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(taskTrigger).toBeFocused();
    await navigate("/calendar", "学习日历");
    const width = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    assert.ok(
      width.content <= width.viewport + 1,
      "Calendar must fit a 360px viewport",
    );
    await page.locator(".calendar-cell:not(.outside)").nth(15).click();
    await page
      .locator(".page-actions")
      .getByRole("button", { name: "安排任务", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "添加学习任务" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  });
  assert.deepEqual(runtimeErrors, [], "No browser runtime errors should occur");
  console.log(
    `\nStudySteady E2E: ${passed} checks passed. No browser runtime errors.`,
  );
} finally {
  await context.close();
  await browser.close();
}
