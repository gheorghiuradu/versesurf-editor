<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import genericAlbum from '@/assets/generic-album.png'

const router = useRouter()
const store = usePlaylistStore()

// Redirect if no playlist loaded
onMounted(() => {
  console.log("PlaylistView onMounted, hasPlaylist:", store.hasPlaylist, "playlist.value:", store.playlist);
  if (!store.hasPlaylist) {
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
  router.push(`/playlist/song/${song.Id}`)
}

function editSong(id: string) {
  router.push(`/playlist/song/${id}`)
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

<template>
  <div class="playlist-view" v-if="playlist">
    <!-- Playlist Header -->
    <header class="playlist-header">
      <div class="container">
        <div class="header-inner">
          <!-- Cover -->
          <div class="cover-wrapper" @click="showCoverPicker = true">
            <img
              :src="playlist.PictureUrl || genericAlbum"
              alt="Playlist cover"
              class="cover-image"
            />
            <div class="cover-overlay">
              <span>Change Cover</span>
            </div>
          </div>

          <div class="header-info">
            <!-- Playlist Name -->
            <div class="name-row">
              <template v-if="!editingName">
                <h1 class="playlist-name" @click="startEditName">{{ playlist.Name }}</h1>
                <button class="btn btn-icon btn-ghost" @click="startEditName" title="Edit name">✏️</button>
              </template>
              <template v-else>
                <input
                  v-model="editName"
                  class="name-input"
                  @keyup.enter="saveName"
                  @blur="saveName"
                  autofocus
                />
              </template>
            </div>

            <p class="text-secondary">
              {{ store.songCount }} {{ store.songCount === 1 ? 'song' : 'songs' }}
            </p>

            <div class="header-actions">
              <button class="btn btn-primary btn-sm" @click="showAddSong = true">
                ＋ Add Song
              </button>
              <button class="btn btn-secondary btn-sm" @click="showSpotifyImport = true">
                🎧 Spotify Import
              </button>
              <button class="btn btn-secondary btn-sm" @click="exportPlaylist">
                📦 Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Song List -->
    <section class="songs-section container">
      <div v-if="playlist.Songs.length === 0" class="empty-state">
        <div class="empty-icon">🎶</div>
        <h3>No songs yet</h3>
        <p class="text-secondary">Add your first song to get started</p>
        <button class="btn btn-primary" @click="showAddSong = true">＋ Add Song</button>
      </div>

      <TransitionGroup name="list" tag="div" class="song-list" v-else>
        <div
          v-for="(song, index) in playlist.Songs"
          :key="song.Id"
          class="song-card card"
          :class="{ 'song-disabled': !song.Enabled }"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="song-art" @click="editSong(song.Id)">
            <img :src="getSongAlbumArt(song)" :alt="song.Title" />
          </div>

          <div class="song-info" @click="editSong(song.Id)">
            <h3 class="song-title">{{ song.Title }}</h3>
            <p class="song-artist text-secondary">{{ song.Artist }}</p>
            <p class="song-snippet text-muted" v-if="song.Snippet">
              {{ getSnippetPreview(song.Snippet) }}
            </p>
          </div>

          <div class="song-meta">
            <span class="song-timing badge badge-success" v-if="song.StartSecond || song.EndSecond">
              {{ song.StartSecond.toFixed(1) }}s – {{ song.EndSecond.toFixed(1) }}s
            </span>
            <span class="badge badge-warning" v-if="song.IsExplicit">E</span>
          </div>

          <div class="song-actions">
            <button
              class="btn btn-icon btn-ghost"
              @click="toggleSong(song.Id)"
              :title="song.Enabled ? 'Disable' : 'Enable'"
            >
              {{ song.Enabled ? '👁️' : '🚫' }}
            </button>
            <button class="btn btn-icon btn-ghost" @click="editSong(song.Id)" title="Edit">
              ✏️
            </button>
            <button class="btn btn-icon btn-ghost" @click="deleteSong(song.Id)" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </TransitionGroup>
    </section>

    <!-- Add Song Modal -->
    <Transition name="modal">
      <div v-if="showAddSong" class="modal-overlay" @click.self="showAddSong = false">
        <div class="modal">
          <h3>Add New Song</h3>
          <div class="form-group">
            <label>Title</label>
            <input v-model="newTitle" placeholder="Song title" @keyup.enter="addSong" autofocus />
          </div>
          <div class="form-group">
            <label>Artist</label>
            <input v-model="newArtist" placeholder="Artist name" />
          </div>
          <div class="form-group">
            <label>Preview URL</label>
            <input v-model="newPreviewUrl" placeholder="Audio preview URL" />
          </div>
          <div class="form-group">
            <label>Snippet</label>
            <input v-model="newSnippet" placeholder='e.g. Never gonna {give} you up' />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showAddSong = false">Cancel</button>
            <button class="btn btn-primary" @click="addSong" :disabled="!newTitle.trim()">
              Add & Edit
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Spotify Import Modal -->
    <Transition name="modal">
      <div v-if="showSpotifyImport" class="modal-overlay" @click.self="showSpotifyImport = false">
        <div class="modal">
          <h3>Import from Spotify</h3>
          <div class="form-group">
            <label>Spotify Track URL</label>
            <input
              v-model="spotifyTrackUrl"
              placeholder="https://open.spotify.com/track/..."
              @keyup.enter="handleSpotifyImport"
            />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showSpotifyImport = false">Cancel</button>
            <button class="btn btn-primary" @click="handleSpotifyImport" :disabled="isImporting">
              {{ isImporting ? '⏳ Importing...' : 'Import' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Cover Picker Modal -->
    <Transition name="modal">
      <div v-if="showCoverPicker" class="modal-overlay" @click.self="showCoverPicker = false">
        <div class="modal modal-wide">
          <h3>Choose Playlist Cover</h3>
          <p class="text-secondary" style="margin-bottom: var(--space-lg)">
            Select a song's album art as the playlist cover
          </p>
          <div class="cover-grid" v-if="playlist.Songs.length">
            <div
              v-for="song in playlist.Songs"
              :key="song.Id"
              class="cover-option"
              :class="{ 'cover-active': playlist.PictureUrl && playlist.PictureUrl.includes(song.SpotifyId) }"
              @click="selectCover(song.Id)"
            >
              <img :src="getSongAlbumArt(song)" :alt="song.Title" />
              <span class="cover-label">{{ song.Title }}</span>
            </div>
          </div>
          <p v-else class="text-muted">Add songs first to choose a cover</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showCoverPicker = false">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.playlist-view {
  padding-bottom: var(--space-3xl);
}

/* ── Header ──────────────────────────────────── */
.playlist-header {
  padding: var(--space-xl) 0;
  background: linear-gradient(180deg, rgba(142, 73, 66, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-xl);
}

.header-inner {
  display: flex;
  gap: var(--space-xl);
  align-items: flex-start;
}

.cover-wrapper {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: var(--shadow-lg);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: white;
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
}

.cover-wrapper:hover .cover-overlay {
  opacity: 1;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.playlist-name {
  cursor: pointer;
  transition: color var(--transition-fast);
}

.playlist-name:hover {
  color: var(--color-terracotta);
}

.name-input {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--color-terracotta);
  border-radius: 0;
  padding: 0;
  color: var(--color-text);
  width: 100%;
}

.name-input:focus {
  box-shadow: none;
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  flex-wrap: wrap;
}

/* ── Song List ───────────────────────────────── */
.songs-section {
  /* container */
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.empty-state h3 {
  margin-bottom: var(--space-sm);
}

.empty-state .btn {
  margin-top: var(--space-lg);
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.song-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  animation: fadeIn 0.3s ease both;
}

.song-disabled {
  opacity: 0.45;
}

.song-art {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.song-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.song-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.song-title {
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 0.85rem;
  margin-top: 2px;
}

.song-snippet {
  font-size: 0.8rem;
  margin-top: 4px;
  font-style: italic;
}

.song-meta {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.song-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* ── Modal ───────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.modal {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-lg);
}

.modal-wide {
  max-width: 600px;
}

.modal h3 {
  margin-bottom: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
  font-family: var(--font-display);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

/* Cover picker grid */
.cover-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-md);
  max-height: 300px;
  overflow-y: auto;
}

.cover-option {
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
}

.cover-option:hover {
  border-color: var(--color-terracotta);
  transform: scale(1.05);
}

.cover-active {
  border-color: var(--color-success);
}

.cover-option img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.cover-label {
  display: block;
  font-size: 0.7rem;
  padding: 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-secondary);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to .modal {
  transform: scale(0.95) translateY(10px);
}

/* List transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 600px) {
  .header-inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .cover-wrapper {
    width: 120px;
    height: 120px;
  }
  .header-actions {
    justify-content: center;
  }
  .song-meta {
    display: none;
  }
}
</style>
