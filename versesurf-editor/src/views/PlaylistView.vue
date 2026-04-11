<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import genericAlbum from '@/assets/generic-album.png'
import SpotifyIcon from '@/components/SpotifyIcon.vue'

const router = useRouter()
const route = useRoute()
const store = usePlaylistStore()

const isLoadingPlaylist = ref(false)

// Load from backend if route has id, otherwise redirect if no local playlist
onMounted(async () => {
  const id = route.params.id as string | undefined
  if (id) {
    isLoadingPlaylist.value = true
    const ok = await store.loadFromBackend(id)
    isLoadingPlaylist.value = false
    if (!ok) {
      router.replace('/')
    }
  } else if (!store.hasPlaylist) {
    router.replace('/')
  }
})

const editingName = ref(false)
const editName = ref('')
const showAddSong = ref(false)
const showCoverPicker = ref(false)
const showSpotifyImport = ref(false)
const spotifyTrackUrl = ref('')
const isImporting = ref(false)

// New song form
const newTitle = ref('')
const newArtist = ref('')
const newPreviewUrl = ref('')
const newSnippet = ref('')

const playlist = computed(() => store.playlist)

function startEditName() {
  editName.value = playlist.value?.Name ?? ''
  editingName.value = true
}

function saveName() {
  store.updatePlaylistName(editName.value.trim())
  editingName.value = false
}

function addSong() {
  if (!newTitle.value.trim()) return
  const song = store.addSong({
    Title: newTitle.value.trim(),
    Artist: newArtist.value.trim(),
    PreviewUrl: newPreviewUrl.value.trim(),
    Snippet: newSnippet.value.trim(),
  })
  // Reset form
  newTitle.value = ''
  newArtist.value = ''
  newPreviewUrl.value = ''
  newSnippet.value = ''
  showAddSong.value = false
  // Navigate to edit
  router.push(`/editor/${playlist.value?.Id}/song/${song.Id}`)
}

function editSong(id: string) {
  router.push(`/editor/${playlist.value?.Id}/song/${id}`)
}

function deleteSong(id: string) {
  store.deleteSong(id)
}

function toggleSong(id: string) {
  store.toggleSong(id)
}

function exportPlaylist() {
  const json = store.exportJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${playlist.value?.Id.substring(0, 13)}_${playlist.value?.Name.replace(/\s/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
  store.showToast('Playlist exported!', 'success')
}

function publishPlaylist(){
  playlist.value!.Enabled = true
  store.saveToBackend()
}

function selectCover(songId: string) {
  store.setCoverFromSong(songId)
  showCoverPicker.value = false
}

async function handleSpotifyImport() {
  const url = spotifyTrackUrl.value.trim()
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
    spotifyTrackUrl.value = ''
    showSpotifyImport.value = false
  }
}

function getSnippetPreview(snippet: string): string {
  return snippet.replace(/\{([^}]+)\}/g, '____')
}

function getSongAlbumArt(song: { PictureUrl: string }): string {
  if (song.PictureUrl) {
    return song.PictureUrl
  }
  return genericAlbum
}
</script>

<template src="./PlaylistView.html"></template>

<style scoped src="./PlaylistView.css"></style>
