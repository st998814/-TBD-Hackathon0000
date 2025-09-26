<template>
  <Transition name="toast">
    <div v-if="isVisible" class="toast" :class="type">
      <div class="toast-content">
        <div class="toast-icon">{{ icon }}</div>
        <div class="toast-message">
          <div class="toast-title">{{ title }}</div>
          <div class="toast-description" v-if="description">{{ description }}</div>
        </div>
        <button class="toast-close" @click="close">&times;</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'info', 'warning', 'error'].includes(value)
  },
  duration: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['close'])

const icon = ref('')
const autoCloseTimer = ref(null)

// Set icon based on type
const setIcon = () => {
  const icons = {
    success: '🎉',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  }
  icon.value = icons[props.type] || icons.info
}

const close = () => {
  if (autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
  emit('close')
}

onMounted(() => {
  setIcon()
  
  // Auto close after duration
  if (props.duration > 0) {
    autoCloseTimer.value = setTimeout(() => {
      close()
    }, props.duration)
  }
})

onUnmounted(() => {
  if (autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-left: 4px solid #3b82f6;
}

.toast.success {
  border-left-color: #10b981;
}

.toast.warning {
  border-left-color: #f59e0b;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.toast-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.toast-description {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #6b7280;
}

/* Animation */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    min-width: auto;
  }
}
</style>
