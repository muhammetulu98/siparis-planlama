<script setup lang="ts">
const { mesajlar } = useToast()
</script>
<template>
  <div class="toasts"><div v-for="m in mesajlar" :key="m.id" class="toast" :class="m.tip">{{ m.metin }}</div></div>
</template>
