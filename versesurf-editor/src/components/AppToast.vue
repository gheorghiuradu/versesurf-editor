<script setup lang="ts">
import { usePlaylistStore } from '@/stores/playlist'

const store = usePlaylistStore()
</script>

<template>
  <Transition name="toast">
    <div v-if="store.toastVisible" class="toast" :class="'toast-' + store.toastType">
      <span class="toast-icon">
        <template v-if="store.toastType === 'success'">✓</template>
        <template v-else-if="store.toastType === 'warning'">⚠</template>
        <template v-else-if="store.toastType === 'error'">✕</template>
        <template v-else>ℹ</template>
      </span>
      <span class="toast-message">{{ store.toastMessage }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.toast-icon {
  font-size: 1rem;
  line-height: 1;
}

.toast-success {
  background: rgba(110, 207, 142, 0.2);
  color: var(--color-success);
  border: 1px solid rgba(110, 207, 142, 0.3);
}

.toast-info {
  background: rgba(199, 127, 106, 0.2);
  color: var(--color-peach-glow);
  border: 1px solid rgba(199, 127, 106, 0.3);
}

.toast-warning {
  background: rgba(230, 184, 110, 0.2);
  color: var(--color-warning);
  border: 1px solid rgba(230, 184, 110, 0.3);
}

.toast-error {
  background: rgba(224, 108, 108, 0.2);
  color: var(--color-danger);
  border: 1px solid rgba(224, 108, 108, 0.3);
}

/* Transition */
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
