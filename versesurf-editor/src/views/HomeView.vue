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
const showImportForm = ref(false)
const showSpotifyForm = ref(false)
const spotifyUrl = ref('')
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

function handleSpotifyImport() {
  store.importSpotifyPlaylistUrl(spotifyUrl.value)
}
</script>

<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero" :style="{ backgroundImage: `url(${heroImg})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <img :src="logo" alt="Verse Surf" class="hero-logo animate-fade-in" />
        <h2 class="hero-title animate-slide-up">Playlist Editor</h2>
        <p class="hero-subtitle animate-slide-up">
          Create custom playlists for the game
        </p>
        <img :src="vinyl" alt="" class="hero-vinyl" />
      </div>
    </section>

    <!-- Action Cards -->
    <section class="actions container">
      <h2 class="section-title">Get Started</h2>
      <div class="action-grid stagger">
        <!-- Create New Playlist -->
        <div class="card card-interactive action-card animate-slide-up" @click="showCreateForm = true">
          <div class="action-icon">🎵</div>
          <h3>Create New Playlist</h3>
          <p class="text-secondary">Start from scratch with a fresh playlist</p>
        </div>

        <!-- Import JSON -->
        <div class="card card-interactive action-card animate-slide-up" @click="triggerImport">
          <div class="action-icon">📂</div>
          <h3>Import from JSON</h3>
          <p class="text-secondary">Load an existing playlist file</p>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden-input"
            @change="handleFileImport"
          />
        </div>

        <!-- Import Spotify -->
        <div class="card card-interactive action-card animate-slide-up" @click="showSpotifyForm = true">
          <div class="action-icon">🎧</div>
          <h3>Import from Spotify</h3>
          <p class="text-secondary">Import a public Spotify playlist</p>
        </div>
      </div>
    </section>

    <!-- Create Playlist Modal -->
    <Transition name="modal">
      <div v-if="showCreateForm" class="modal-overlay" @click.self="showCreateForm = false">
        <div class="modal">
          <h3>Create New Playlist</h3>
          <div class="form-group">
            <label>Playlist Name</label>
            <input
              v-model="playlistName"
              type="text"
              placeholder="e.g. All Out 90s"
              @keyup.enter="createPlaylist"
              autofocus
            />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showCreateForm = false">Cancel</button>
            <button class="btn btn-primary" @click="createPlaylist" :disabled="!playlistName.trim()">
              Create Playlist
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Spotify Import Modal -->
    <Transition name="modal">
      <div v-if="showSpotifyForm" class="modal-overlay" @click.self="showSpotifyForm = false">
        <div class="modal">
          <h3>Import from Spotify</h3>
          <div class="form-group">
            <label>Spotify Playlist URL</label>
            <input
              v-model="spotifyUrl"
              type="url"
              placeholder="https://open.spotify.com/playlist/..."
              @keyup.enter="handleSpotifyImport"
            />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showSpotifyForm = false">Cancel</button>
            <button class="btn btn-primary" @click="handleSpotifyImport">
              Import
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
}

/* ── Hero ────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(26, 16, 22, 0.3) 0%,
    rgba(26, 16, 22, 0.7) 60%,
    var(--color-bg) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
}

.hero-logo {
  width: 220px;
  margin: 0 auto var(--space-lg);
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.4));
}

.hero-subtitle {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--color-blush);
  max-width: 400px;
  margin: 0 auto;
}

.hero-vinyl {
  position: absolute;
  right: -40px;
  bottom: -20px;
  width: 140px;
  opacity: 0.15;
  animation: spin 20s linear infinite;
}

/* ── Actions ─────────────────────────────────── */
.actions {
  padding-top: var(--space-2xl);
  padding-bottom: var(--space-3xl);
}

.section-title {
  text-align: center;
  margin-bottom: var(--space-xl);
  font-size: 1.5rem;
  color: var(--color-text-secondary);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-lg);
}

.action-card {
  text-align: center;
  padding: var(--space-xl) var(--space-lg);
}

.action-card h3 {
  margin: var(--space-md) 0 var(--space-sm);
}

.action-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.hidden-input {
  display: none;
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

.modal h3 {
  margin-bottom: var(--space-lg);
}

.form-group {
  margin-bottom: var(--space-lg);
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

@media (max-width: 600px) {
  .hero-logo {
    width: 160px;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
