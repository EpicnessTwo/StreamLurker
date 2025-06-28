<template>
  <div class="space-y-4">
    <p class="text-lg text-center">Enter channels you want to monitor</p>
    <input type="text" v-model="newChannel" placeholder="Channel name" class="w-full px-4 py-2 bg-slate-700 rounded" @keyup.enter="addChannel" />
    <button class="bg-blue-600 px-4 py-2 rounded text-white" @click="addChannel">Add</button>

    <ul class="space-y-2 mt-4">
      <li v-for="(channel, index) in modelValue.channels" :key="index" class="flex justify-between items-center bg-slate-700 p-2 rounded">
        <span>{{ channel }}</span>
        <button @click="removeChannel(index)" class="text-red-400">Remove</button>
      </li>
    </ul>

    <div class="flex justify-between mt-6">
      <button class="text-slate-300" @click="$emit('back')">Back</button>
      <button class="bg-green-600 px-4 py-2 rounded text-white" @click="$emit('next')">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(["update:modelValue", "next", "back"])
const newChannel = ref("")

function addChannel() {
  if (newChannel.value.trim()) {
    emit("update:modelValue", {
      ...props.modelValue,
      channels: [...props.modelValue.channels, newChannel.value.trim()]
    })
    newChannel.value = ""
  }
}

function removeChannel(index) {
  const updated = [...props.modelValue.channels]
  updated.splice(index, 1)
  emit("update:modelValue", {
    ...props.modelValue,
    channels: updated
  })
}
</script>