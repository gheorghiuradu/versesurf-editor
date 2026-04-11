<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlaylistStore } from '@/stores/playlist'
import { fetchMyPlaylists, deletePlaylist, type MyPlaylistSummary } from '@/lib/api'
import genericAlbum from '@/assets/generic-album.png'

const router = useRouter()
const auth = useAuthStore()
const playlistStore = usePlaylistStore()

const playlists = ref<MyPlaylistSummary[]>([])
const isLoading = ref(true)
const error = ref('')
const confirmDeleteId = ref<string | null>(null)

onMounted(async () => {
  await loadPlaylists()
})

async function loadPlaylists() {
  if (!auth.user) return
  isLoading.value = true
  error.value = ''
  try {
    playlists.value = await fetchMyPlaylists(auth.user.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load playlists'
  } finally {
    isLoading.value = false
  }
}

function createNew() {
  playlistStore.createPlaylist('New Playlist')
  router.push('/editor')
}

function editPlaylist(id: string) {
  router.push(`/editor/${id}`)
}

async function confirmDelete(id: string) {
  confirmDeleteId.value = id
}

async function executeDelete() {
  if (!confirmDeleteId.value) return
  try {
    await deletePlaylist(confirmDeleteId.value)
    playlists.value = playlists.value.filter((p) => p.id !== confirmDeleteId.value)
    playlistStore.showToast('Playlist deleted', 'success')
  } catch (e) {
    playlistStore.showToast(
      e instanceof Error ? e.message : 'Failed to delete playlist',
      'error',
    )
  } finally {
    confirmDeleteId.value = null
  }
}

function getPlaylistCover(p: MyPlaylistSummary): string {
  return p.pictureUrl || genericAlbum
}
</script>

<template>
  <div class="my-playlists container">
    <div class="page-header">
      <h1 class="page-title">My Playlists</h1>
      <button class="btn btn-primary" @click="createNew">＋ New Playlist</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <p class="text-muted">Loading your playlists...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <p class="text-danger">{{ error }}</p>
      <button class="btn btn-secondary" @click="loadPlaylists">Retry</button>
    </div>

    <!-- Empty -->
    <div v-else-if="playlists.length === 0" class="empty-state">
      <div class="empty-icon">🎵</div>
      <h3>No playlists yet</h3>
      <p class="text-secondary">Create your first playlist to get started</p>
      <button class="btn btn-primary" @click="createNew">＋ Create Playlist</button>
    </div>

    <!-- Playlist Grid -->
    <div v-else class="playlist-grid">
      <div
        v-for="p in playlists"
        :key="p.id"
        class="card card-interactive playlist-card"
      >
        <div class="playlist-card-cover" @click="editPlaylist(p.id)">
          <img :src="getPlaylistCover(p)" :alt="p.name" />
          <span class="playlist-status badge" :class="p.enabled ? 'badge-success' : 'badge-warning'">
            {{ p.enabled ? 'Published' : 'Draft' }}
          </span>
        </div>
        <div class="playlist-card-body" @click="editPlaylist(p.id)">
          <h3 class="playlist-card-name">{{ p.name }}</h3>
          <p class="text-secondary playlist-card-meta">
            {{ p.songCount }} {{ p.songCount === 1 ? 'song' : 'songs' }}
          </p>
        </div>
        <div class="playlist-card-actions">
          <button class="btn btn-secondary btn-sm" @click="editPlaylist(p.id)">✏️ Edit</button>
          <button class="btn btn-ghost btn-sm" @click="confirmDelete(p.id)">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div v-if="confirmDeleteId" class="modal-overlay" @click.self="confirmDeleteId = null">
        <div class="modal">
          <h3>Delete Playlist?</h3>
          <p class="text-secondary">This will permanently delete the playlist and all its songs. This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmDeleteId = null">Cancel</button>
            <button class="btn btn-danger" @click="executeDelete">Delete</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped src="./MyPlaylistsView.css"></style>
