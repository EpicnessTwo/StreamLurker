<template>
  <div class="space-y-4">
    <p class="text-lg text-center">Customize your preferences</p>

    <label v-for="(label, key) in settingLabels" :key="key" class="flex justify-between items-center bg-slate-700 px-4 py-2 rounded">
      <span>{{ label }}</span>
      <input type="checkbox" v-model="modelValue.settings[key]" class="form-checkbox h-5 w-5 text-blue-500" />
    </label>

    <div class="flex justify-between mt-6">
      <button class="text-slate-300" @click="$emit('back')">Back</button>
      <button class="bg-green-600 px-4 py-2 rounded text-white" @click="$emit('finish')">Finish</button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Object
})
const emit = defineEmits(["update:modelValue", "next", "back"])

const settingLabels = {
  autoOpen: 'Automatically open streams when they go live',
  notifications: 'Enable system notifications',
  predictive: 'Predictive Go Live [Alpha]',
  startup: 'Open StreamLurker at startup'
}
</script>