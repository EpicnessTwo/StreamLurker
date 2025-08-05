import { ref, reactive } from 'vue'

// Shared notification state
const notifications = ref([])
const maxNotifications = 50 // Keep last 50 notifications

export function useNotificationStore() {
  
  function addNotification(title, body, icon = null, type = 'info') {
    const notification = {
      id: Date.now() + Math.random(),
      title,
      body,
      icon,
      type, // 'live', 'offline', 'predictive', 'info'
      timestamp: new Date(),
      read: false
    }
    
    // Add to beginning of array (newest first)
    notifications.value.unshift(notification)
    
    // Keep only the latest notifications
    if (notifications.value.length > maxNotifications) {
      notifications.value = notifications.value.slice(0, maxNotifications)
    }
  }
  
  function markAsRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }
  
  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
  }
  
  function clearAll() {
    notifications.value = []
  }
  
  function getUnreadCount() {
    return notifications.value.filter(n => !n.read).length
  }
  
  return {
    notifications: notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount
  }
}