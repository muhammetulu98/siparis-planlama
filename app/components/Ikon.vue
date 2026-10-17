<script setup lang="ts">
defineProps<{ ad: string; boyut?: number }>()
</script>
<template>
  <svg :width="boyut || 16" :height="boyut || 16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <template v-if="ad === 'sutunlar'"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /><path d="M15 4v16" /></template>
    <template v-else-if="ad === 'excel'"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /><path d="m9 13 4 5" /><path d="m13 13-4 5" /></template>
    <template v-else-if="ad === 'pdf'"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6" /><path d="M8 17v-4h1.5a1.2 1.2 0 0 1 0 2.4H8" /><path d="M13 17v-4h1a2 2 0 0 1 0 4Z" /></template>
    <template v-else-if="ad === 'duzenle'"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></template>
    <template v-else-if="ad === 'yenile'"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></template>
    <template v-else-if="ad === 'geri'"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></template>
    <template v-else-if="ad === 'x'"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></template>
    <template v-else-if="ad === 'ara'"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></template>
    <template v-else-if="ad === 'artı'"><path d="M12 5v14" /><path d="M5 12h14" /></template>
    <template v-else-if="ad === 'cop'"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /></template>
    <template v-else-if="ad === 'kaydet'"><path d="M5 12l5 5L20 7" /></template>
    <template v-else-if="ad === 'cikis'"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></template>
    <template v-else-if="ad === 'ilk'"><path d="m11 17-5-5 5-5" /><path d="M18 17V7" /></template>
    <template v-else-if="ad === 'onceki'"><path d="m15 18-6-6 6-6" /></template>
    <template v-else-if="ad === 'sonraki'"><path d="m9 18 6-6-6-6" /></template>
    <template v-else-if="ad === 'son'"><path d="m13 17 5-5-5-5" /><path d="M6 7v10" /></template>
    <template v-else-if="ad === 'asagi'"><path d="m6 9 6 6 6-6" /></template>
    <template v-else-if="ad === 'tarih'"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></template>
    <template v-else-if="ad === 'pdf'"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></template>
    <template v-else-if="ad === 'oneri'"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></template>
    <template v-else-if="ad === 'planla'"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></template>
    <template v-else-if="ad === 'kapat'"><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></template>
    <template v-else-if="ad === 'bol'"><path d="M12 3v18" /><path d="M5 8h5M14 16h5" /><rect x="3" y="4" width="18" height="16" rx="2" /></template>
    <template v-else-if="ad === 'tir'"><path d="M1 6h13v10H1z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></template>
    <template v-else-if="ad === 'depo'"><path d="M3 10 12 4l9 6v10H3z" /><path d="M9 20v-6h6v6" /></template>
    <template v-else-if="ad === 'secim'"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m8 12 3 3 5-6" /></template>
    <template v-else-if="ad === 'yazdir'"><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></template>
    <template v-else-if="ad === 'excel'"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></template>
    <template v-else-if="ad === 'sutun'"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></template>
    <template v-else-if="ad === 'filtre'"><path d="M3 5h18l-7 8v6l-4 2v-8Z" /></template>
    <template v-else-if="ad === 'kayit'"><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></template>
    <template v-else-if="ad === 'kisi'"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></template>
    <template v-else-if="ad === 'stand'"><path d="M3 21V9l9-6 9 6v12" /><path d="M9 21v-7h6v7" /></template>
    <template v-else-if="ad === 'liste'"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></template>
  </svg>
</template>
