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

/* iPhone and mobile responsiveness */
@media (max-width: 640px) {
  .toast {
    top: max(10px, env(safe-area-inset-top));
    right: max(10px, env(safe-area-inset-right));
    left: max(10px, env(safe-area-inset-left));
    max-width: none;
    min-width: auto;
    border-radius: 8px;
  }
  
  .toast-content {
    padding: 12px;
    gap: 10px;
  }
  
  .toast-icon {
    font-size: 1.25rem;
  }
  
  .toast-title {
    font-size: 0.8rem;
  }
  
  .toast-description {
    font-size: 0.7rem;
    line-height: 1.3;
  }
  
  .toast-close {
    width: 18px;
    height: 18px;
    font-size: 1rem;
  }
}

/* iPhone specific optimizations */
@media (max-width: 480px) {
  .toast {
    top: max(8px, env(safe-area-inset-top));
    right: max(8px, env(safe-area-inset-right));
    left: max(8px, env(safe-area-inset-left));
    border-radius: 6px;
  }
  
  .toast-content {
    padding: 10px;
    gap: 8px;
  }
  
  .toast-icon {
    font-size: 1.1rem;
  }
  
  .toast-title {
    font-size: 0.75rem;
  }
  
  .toast-description {
    font-size: 0.65rem;
  }
  
  .toast-close {
    width: 16px;
    height: 16px;
    font-size: 0.9rem;
  }
}

/* Landscape orientation for iPhone */
@media (max-width: 640px) and (orientation: landscape) {
  .toast {
    top: max(5px, env(safe-area-inset-top));
    right: max(5px, env(safe-area-inset-right));
    left: max(5px, env(safe-area-inset-left));
  }
  
  .toast-content {
    padding: 8px;
    gap: 8px;
  }
  
  .toast-title {
    font-size: 0.75rem;
  }
  
  .toast-description {
    font-size: 0.65rem;
  }
}
</style>
