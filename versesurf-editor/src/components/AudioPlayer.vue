<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps<{
  src: string
  startSecond: number
  endSecond: number
}>()

const emit = defineEmits<{
  segmentEnd: []
}>()

const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const volume = ref(1)
let animationFrame: number | null = null
let fadeInterval: ReturnType<typeof setInterval> | null = null

function playSegment() {
  if (!audio.value || !props.src) return
  audio.value.volume = 1
  volume.value = 1
  audio.value.currentTime = props.startSecond
  audio.value.play()
  isPlaying.value = true
  trackTime()
}

function pause() {
  audio.value?.pause()
  isPlaying.value = false
  stopTracking()
}

function resume() {
  if (!audio.value) return
  audio.value.play()
  isPlaying.value = true
  trackTime()
}

function fadeOut() {
  if (!audio.value) return
  resume()
  fadeInterval = setInterval(() => {
    if (!audio.value || !isPlaying.value) {
      if (fadeInterval) clearInterval(fadeInterval)
      return
    }
    if (audio.value.volume < 0.1) {
      audio.value.volume = Math.max(0, audio.value.volume - 0.025)
    } else {
      audio.value.volume = Math.max(0, audio.value.volume - 0.1)
    }
    volume.value = audio.value.volume
    if (audio.value.volume <= 0) {
      audio.value.pause()
      isPlaying.value = false
      if (fadeInterval) clearInterval(fadeInterval)
    }
  }, 1000)
}

function stop() {
  if (audio.value) {
    audio.value.pause()
    audio.value.currentTime = 0
  }
  isPlaying.value = false
  stopTracking()
  if (fadeInterval) clearInterval(fadeInterval)
}

function trackTime() {
  const tick = () => {
    if (audio.value) {
      currentTime.value = audio.value.currentTime
      // Check if segment ended
      if (isPlaying.value && currentTime.value >= props.endSecond) {
        pause()
        emit('segmentEnd')
        return
      }
    }
    if (isPlaying.value) {
      animationFrame = requestAnimationFrame(tick)
    }
  }
  tick()
}

function stopTracking() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

watch(() => props.src, () => {
  stop()
})

onBeforeUnmount(() => {
  stop()
})

defineExpose({ playSegment, pause, resume, fadeOut, stop, isPlaying, currentTime, volume })
</script>

<template>
  <audio ref="audio" :src="src" preload="auto" />
</template>
