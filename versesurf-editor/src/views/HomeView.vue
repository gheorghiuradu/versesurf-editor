<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchPublicPlaylists, type PlaylistSummary } from '@/lib/api'
import logo from '@/assets/logo.png'
import vinyl from '@/assets/vinyl.png'
import heroImg from '@/assets/hero-bg.webp'
import genericAlbum from '@/assets/generic-album.png'

const auth = useAuthStore()

// Public playlists
const publicPlaylists = ref<PlaylistSummary[]>([])
const isLoadingPlaylists = ref(true)

onMounted(async () => {
  try {
    publicPlaylists.value = await fetchPublicPlaylists();
  } catch {
    // silently fail for public browsing
  } finally {
    isLoadingPlaylists.value = false
  }
})

function getPlaylistCover(p: PlaylistSummary): string {
  return p.pictureUrl || genericAlbum
}
</script>

<template src="./HomeView.html"></template>

<style scoped src="./HomeView.css"></style>
