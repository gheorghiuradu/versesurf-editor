<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  snippet: string
  revealed: boolean
}>()

/**
 * Parses snippet like "Never gonna give you {up}" into segments.
 * When not revealed, {answer} is shown as ____
 */
const segments = computed(() => {
  const parts: { text: string; isBlank: boolean }[] = []
  const regex = /\{([^}]+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(props.snippet)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: props.snippet.slice(lastIndex, match.index), isBlank: false })
    }
    parts.push({ text: match[1] ?? '', isBlank: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < props.snippet.length) {
    parts.push({ text: props.snippet.slice(lastIndex), isBlank: false })
  }

  return parts
})

const answerText = computed(() => {
  const match = props.snippet.match(/\{([^}]+)\}/)
  return match ? match[1] : ''
})

defineExpose({ answerText })
</script>

<template>
  <span class="snippet-display">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="!seg.isBlank" class="snippet-text">{{ seg.text }}</span>
      <span v-else class="snippet-blank" :class="{ revealed: revealed }">
        <span v-if="revealed" class="snippet-answer">{{ seg.text }}</span>
        <span v-else class="snippet-underline">____</span>
      </span>
    </template>
  </span>
</template>

<style scoped>
.snippet-display {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.6;
  color: var(--color-text);
}

.snippet-text {
  /* Normal text */
}

.snippet-blank {
  display: inline-block;
  position: relative;
}

.snippet-underline {
  color: var(--color-terracotta);
  letter-spacing: 2px;
  font-weight: 700;
}

.snippet-answer {
  color: var(--color-success);
  animation: revealPop 0.4s ease both;
}

.revealed {
  /* container for revealed answer */
}

@keyframes revealPop {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
