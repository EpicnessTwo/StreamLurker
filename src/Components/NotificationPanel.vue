<template>
  <div 
    class="fixed top-0 right-0 h-full w-80 bg-slate-800 border-l border-slate-700 transform transition-transform duration-300 ease-in-out z-50"
    :class="{ 'translate-x-full': !isOpen, 'translate-x-0': isOpen }"
  >
    <!-- Panel Header -->
    <div class="flex justify-between items-center p-4 border-b border-slate-700">
      <h2 class="text-lg font-semibold text-white">Notifications</h2>
      <div class="flex items-center gap-2">
        <button 
          @click="markAllAsRead"
          class="text-sm text-slate-400 hover:text-white transition-colors"
          :disabled="unreadCount === 0"
          :class="{ 'opacity-50 cursor-not-allowed': unreadCount === 0 }"
        >
          Mark all read
        </button>
        <button 
          @click="$emit('close')"
          class="text-slate-400 hover:text-white transition-colors p-1"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="notifications.length === 0" class="p-4 text-slate-400 text-center">
        No notifications yet
      </div>
      
      <div v-else class="p-2">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="mb-2 p-3 rounded-lg border transition-all duration-200 hover:bg-slate-700/50"
          :class="[
            notification.read ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-700/50 border-slate-600',
            getNotificationTypeClass(notification.type)
          ]"
          @click="markAsRead(notification.id)"
        >
          <div class="flex items-start gap-3">
            <!-- Icon or Type Indicator -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" 
                 :class="getTypeIndicatorClass(notification.type)">
              <img v-if="notification.icon" :src="notification.icon" alt="" class="w-6 h-6 rounded-full" />
              <span v-else>{{ getTypeIcon(notification.type) }}</span>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white text-sm" :class="{ 'opacity-70': notification.read }">
                {{ notification.title }}
              </div>
              <div class="text-slate-300 text-xs mt-1" :class="{ 'opacity-70': notification.read }">
                {{ notification.body }}
              </div>
              <div class="text-slate-500 text-xs mt-2">
                {{ formatTime(notification.timestamp) }}
              </div>
            </div>
            
            <!-- Unread indicator -->
            <div v-if="!notification.read" class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Footer -->
    <div class="p-4 border-t border-slate-700">
      <button 
        @click="clearAll"
        class="w-full text-sm text-slate-400 hover:text-red-400 transition-colors py-2"
        :disabled="notifications.length === 0"
        :class="{ 'opacity-50 cursor-not-allowed': notifications.length === 0 }"
      >
        Clear all notifications
      </button>
    </div>
  </div>
  
  <!-- Backdrop -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-30 z-40"
    @click="$emit('close')"
  ></div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '../composables/useNotificationStore.js'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const { notifications, markAsRead, markAllAsRead, clearAll, getUnreadCount } = useNotificationStore()

const unreadCount = computed(() => getUnreadCount())

function getNotificationTypeClass(type) {
  switch (type) {
    case 'live':
      return 'border-l-4 border-l-green-500'
    case 'offline':
      return 'border-l-4 border-l-red-500'
    case 'predictive':
      return 'border-l-4 border-l-yellow-500'
    default:
      return 'border-l-4 border-l-blue-500'
  }
}

function getTypeIndicatorClass(type) {
  switch (type) {
    case 'live':
      return 'bg-green-500/20 text-green-400'
    case 'offline':
      return 'bg-red-500/20 text-red-400'
    case 'predictive':
      return 'bg-yellow-500/20 text-yellow-400'
    default:
      return 'bg-blue-500/20 text-blue-400'
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'live':
      return '🔴'
    case 'offline':
      return '⭕'
    case 'predictive':
      return '🔮'
    default:
      return 'ℹ️'
  }
}

function formatTime(timestamp) {
  const now = new Date()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
</script>