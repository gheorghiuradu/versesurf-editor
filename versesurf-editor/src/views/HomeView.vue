<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import logo from '@/assets/logo.png'
import vinyl from '@/assets/vinyl.png'
import heroImg from '@/assets/hero-bg.webp'

const router = useRouter()
const store = usePlaylistStore()

const showCreateForm = ref(false)
const playlistName = ref('')
const showSpotifyForm = ref(false)
const spotifyUrl = ref('')
const isImporting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function createPlaylist() {
  if (!playlistName.value.trim()) return
  store.createPlaylist(playlistName.value.trim())
  router.push('/playlist')
}

function triggerImport() {
  fileInput.value?.click()
}

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const json = e.target?.result as string
    if (store.importJson(json)) {
      router.push('/playlist')
    }
  }
  reader.readAsText(file)
}

async function handleSpotifyImport() {
  const url = spotifyUrl.value.trim()
  if (!url) return

  isImporting.value = true
  let success = false

  if (url.includes('/playlist/')) {
    success = (await store.importSpotifyPlaylistUrl(url)) === true
  } else if (url.includes('/track/')) {
    success = (await store.importSpotifyTrackUrl(url)) === true
  } else {
    store.showToast('Invalid Spotify URL. Must be a track or playlist.', 'error')
  }

  isImporting.value = false

  if (success) {
    spotifyUrl.value = ''
    showSpotifyForm.value = false
    router.push('/playlist')
  }
}
</script>

<template src="./HomeView.html"></template>

<style scoped src="./HomeView.css"></style>
