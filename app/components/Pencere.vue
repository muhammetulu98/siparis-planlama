<script setup lang="ts">
defineProps<{ baslik: string, genis?: boolean }>()
const emit = defineEmits<{ kapat: [] }>()
</script>
<template>
  <div class="scrim" @mousedown.self="emit('kapat')">
    <div class="modal" :class="{ genis }" role="dialog" aria-modal="true" :aria-label="baslik">
      <header>{{ baslik }}<button class="ikb" aria-label="Kapat" @click="emit('kapat')"><Ikon ad="x" :boyut="16" /></button></header>
      <div class="gov"><slot /></div>
      <div v-if="$slots.alt" class="foot"><slot name="alt" /></div>
    </div>
  </div>
</template>
