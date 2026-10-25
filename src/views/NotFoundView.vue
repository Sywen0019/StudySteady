<script setup>
import EmptyState from "../components/ui/EmptyState.vue";
</script>
<template>
  <div class="panel">
    <EmptyState
      title="这条路还没有铺好"
      description="你访问的页面不存在，回到学习总览继续今天的计划吧。"
      ><RouterLink class="btn btn-primary" to="/"
        >返回学习总览</RouterLink
      ></EmptyState
    >
  </div>
</template>
