<template>
  <div class="flex justify-center gap-3 max-w-md w-full mx-auto">
    <div v-for="n in total" :key="n"
         :class="[n <= step ? 'bg-purple-500' : 'bg-slate-600', 'h-3 w-full rounded-full transition-colors duration-300']">
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ step: Number, total: Number })
</script>