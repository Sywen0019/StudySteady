<script setup>
import { ref } from "vue";
import { onResize, onShow } from "@dcloudio/uni-app";

const websiteUrl = "https://studysteady.pages.dev/";
const webviewStyles = ref({});

// #ifdef APP-PLUS
function updateWebviewBounds() {
  if (plus.os.name !== "Android") return;

  // 原生 WebView 独立于网页布局，需直接避让沉浸式状态栏。
  const { statusBarHeight } = uni.getWindowInfo();
  const inset = plus.navigator.isImmersedStatusbar()
    ? Math.max(0, Number(statusBarHeight) || 0)
    : 0;
  const top = `${inset}px`;
  if (webviewStyles.value.top === top) return;

  // 由 top/bottom 决定高度，避免下移后仍占满屏幕而裁切底部。
  webviewStyles.value = { top, bottom: "0px" };
}

updateWebviewBounds();
onShow(updateWebviewBounds);
onResize(updateWebviewBounds);
// #endif
</script>

<template>
  <web-view
    :src="websiteUrl"
    :webview-styles="webviewStyles"
    :update-title="false"
  />
</template>
