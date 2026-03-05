<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import SnippetDisplay from '@/components/SnippetDisplay.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import genericAlbum from '@/assets/generic-album.png'
import type { Song } from '@/types'

const route = useRoute()
const router = useRouter()
const store = usePlaylistStore()

const songId = computed(() => route.params.id as string)
const song = computed(() => store.getSong(songId.value))
const audioPlayer = ref<InstanceType<typeof AudioPlayer> | null>(null)

// Editable fields
const editTitle = ref('')
const editArtist = ref('')
const editSnippet = ref('')
const editPreviewUrl = ref('')
const editStartSecond = ref(0)
const editEndSecond = ref(5)
const editIsExplicit = ref(false)

// Round simulator state
type RoundPhase = 'idle' | 'listening' | 'snippet' | 'revealed'
const roundPhase = ref<RoundPhase>('idle')

// Quality validation
const qualityWarnings = computed(() => {
  const warnings: string[] = []
  const answer = getAnswerText(editSnippet.value)
  const startSecond = editStartSecond.value
  const endSecond = editEndSecond.value
  if (answer && song.value) {
    if (song.value.Title.toLowerCase().includes(answer.toLowerCase())) {
      warnings.push('Answer is contained in the song title — too easy to guess!')
    }
    if (answer.length < 4) {
      warnings.push('Answer is shorter than 4 characters — might be too short')
    }
  }
  if (endSecond - startSecond < 5) {
    warnings.push('End second is less than 5 seconds from start — might be too short')
  }
  return warnings
})

function getAnswerText(snippet: string): string {
  const match = snippet.match(/\{([^}]+)\}/)
  return match ? (match[1] ?? '') : ''
}

function getSongAlbumArt(s: Song): string {
  return s.PictureUrl ?? genericAlbum
}

onMounted(() => {
  if (!store.hasPlaylist || !song.value) {
    router.replace('/playlist')
    return
  }
  loadSongData()
})

watch(songId, loadSongData)

function loadSongData() {
  if (!song.value) return
  editTitle.value = song.value.Title
  editArtist.value = song.value.Artist
  editSnippet.value = song.value.Snippet
  editPreviewUrl.value = song.value.PreviewUrl
  editStartSecond.value = song.value.StartSecond
  editEndSecond.value = song.value.EndSecond
  editIsExplicit.value = song.value.IsExplicit
}

function saveSong() {
  if (!song.value) return
  store.updateSong(songId.value, {
    Title: editTitle.value.trim(),
    Artist: editArtist.value.trim(),
    Snippet: editSnippet.value.trim(),
    PreviewUrl: editPreviewUrl.value.trim(),
    StartSecond: editStartSecond.value,
    EndSecond: editEndSecond.value,
    IsExplicit: editIsExplicit.value,
  })
  store.showToast('Song saved!', 'success')
}

function autoSetEnd() {
  editEndSecond.value = Math.round((editStartSecond.value + 5) * 100) / 100
}

// Round simulation
function startRound() {
  saveSong() // Save current edits first
  roundPhase.value = 'listening'
  audioPlayer.value?.playSegment()
}

function onSegmentEnd() {
  roundPhase.value = 'snippet'
}

function nextPhase() {
  roundPhase.value = 'revealed'
  audioPlayer.value?.fadeOut()
}

function reEdit() {
  roundPhase.value = 'idle'
  audioPlayer.value?.stop()
}

function resetRound() {
  roundPhase.value = 'idle'
  audioPlayer.value?.stop()
}

function goBack() {
  saveSong()
  router.push('/playlist')
}
</script>

<template>
  <div class="song-view" v-if="song">
    <div class="container">
      <!-- Top bar -->
      <div class="top-bar">
        <button class="btn btn-ghost" @click="goBack">
          ← Back to Playlist
        </button>
        <button class="btn btn-primary btn-sm" @click="saveSong">
          💾 Save
        </button>
      </div>

      <div class="song-layout">
        <!-- Left: Song Info & Editor -->
        <div class="editor-panel">
          <!-- Song identity -->
          <div class="song-identity">
            <img :src="getSongAlbumArt(song)" :alt="song.Title" class="song-album-art" />
            <div>
              <h2 class="song-title-display">{{ editTitle || 'Untitled' }}</h2>
              <p class="text-secondary">{{ editArtist || 'Unknown Artist' }}</p>
            </div>
          </div>

          <!-- Edit Form -->
          <div class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label>Title</label>
                <input v-model="editTitle" placeholder="Song title" />
              </div>
              <div class="form-group">
                <label>Artist</label>
                <input v-model="editArtist" placeholder="Artist name" />
              </div>
            </div>

            <div class="form-group">
              <label>Preview URL</label>
              <input v-model="editPreviewUrl" placeholder="Audio preview URL" />
              <audio v-if="editPreviewUrl" :src="editPreviewUrl" controls class="w-full" />
            </div>

            <div class="form-group">
              <label>
                Snippet
                <span class="label-hint">Use {curly braces} around the answer word(s)</span>
              </label>
              <input
                v-model="editSnippet"
                placeholder='e.g. Never gonna {give} you up'
                class="snippet-input"
              />
            </div>

            <!-- Timing -->
            <div class="form-row">
              <div class="form-group">
                <label>Start Second</label>
                <div class="timing-input">
                  <input
                    v-model.number="editStartSecond"
                    type="number"
                    step="0.01"
                    min="0"
                    @change="autoSetEnd"
                  />
                  <span class="timing-unit">s</span>
                </div>
              </div>
              <div class="form-group">
                <label>End Second</label>
                <div class="timing-input">
                  <input
                    v-model.number="editEndSecond"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                  <span class="timing-unit">s</span>
                </div>
              </div>
              <div class="form-group timing-auto">
                <button class="btn btn-ghost btn-sm" @click="autoSetEnd" title="Set end to start + 5s">
                  ↻ Auto 5s
                </button>
              </div>
            </div>

            <!-- Explicit toggle -->
            <label class="toggle-row">
              <input type="checkbox" v-model="editIsExplicit" />
              <span>Explicit content</span>
            </label>
          </div>

          <!-- Quality Warnings -->
          <div v-if="qualityWarnings.length" class="quality-section">
            <h3 class="quality-title">⚠️ Quality Warnings</h3>
            <div v-for="(warning, i) in qualityWarnings" :key="i" class="quality-warning">
              {{ warning }}
            </div>
          </div>
        </div>

        <!-- Right: Round Simulator -->
        <div class="simulator-panel">
          <h3 class="simulator-title">🎮 Round Simulator</h3>
          <p class="text-secondary simulator-desc">
            Preview how this song will play in the game
          </p>

          <!-- Audio Player (hidden) -->
          <AudioPlayer
            ref="audioPlayer"
            :src="editPreviewUrl"
            :start-second="editStartSecond"
            :end-second="editEndSecond"
            @segment-end="onSegmentEnd"
          />

          <!-- Simulator Display -->
          <div class="sim-stage">
            <!-- Phase: Idle -->
            <div v-if="roundPhase === 'idle'" class="sim-idle">
              <div class="sim-vinyl">🎵</div>
              <p class="text-muted">Press play to simulate a round</p>
              <button
                class="btn btn-primary btn-lg"
                @click="startRound"
                :disabled="!editSnippet || !editPreviewUrl"
              >
                ▶ Start Round
              </button>
              <p v-if="!editPreviewUrl" class="text-muted" style="font-size: 0.8rem; margin-top: 8px;">
                Add a preview URL to test audio
              </p>
            </div>

            <!-- Phase: Listening -->
            <div v-if="roundPhase === 'listening'" class="sim-listening">
              <div class="listening-pulse">🎧</div>
              <p class="listening-text">Listen to this...</p>
            </div>

            <!-- Phase: Snippet shown -->
            <div v-if="roundPhase === 'snippet'" class="sim-snippet">
              <SnippetDisplay :snippet="editSnippet" :revealed="false" />
              <div class="sim-snippet-actions">
                <button class="btn btn-primary" @click="nextPhase">
                  Reveal Answer →
                </button>
                <button class="btn btn-ghost" @click="reEdit">
                  ✏️ Re-edit
                </button>
              </div>
            </div>

            <!-- Phase: Revealed -->
            <div v-if="roundPhase === 'revealed'" class="sim-revealed">
              <SnippetDisplay :snippet="editSnippet" :revealed="true" />
              <p class="fade-hint text-muted">🔉 Music fading out...</p>
              <button class="btn btn-ghost" @click="resetRound" style="margin-top: var(--space-lg)">
                ↻ Reset
              </button>
            </div>
          </div>

          <!-- Phase indicator -->
          <div class="phase-dots">
            <span class="dot" :class="{ active: roundPhase === 'idle' }"></span>
            <span class="dot" :class="{ active: roundPhase === 'listening' }"></span>
            <span class="dot" :class="{ active: roundPhase === 'snippet' }"></span>
            <span class="dot" :class="{ active: roundPhase === 'revealed' }"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.song-view {
  padding-bottom: var(--space-3xl);
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) 0;
}

.song-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
  margin-top: var(--space-md);
}

/* ── Editor Panel ────────────────────────────── */
.editor-panel {
  /* left side */
}

.song-identity {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.song-album-art {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
  box-shadow: var(--shadow-md);
}

.song-title-display {
  font-size: 1.35rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-row {
  display: flex;
  gap: var(--space-md);
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: var(--font-display);
}

.label-hint {
  font-weight: 400;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-left: 4px;
}

.snippet-input {
  font-family: var(--font-mono), monospace;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.timing-input {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.timing-input input {
  width: 100%;
}

.timing-unit {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.timing-auto {
  display: flex;
  align-items: flex-end;
  flex: 0 0 auto;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.toggle-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-terracotta);
}

/* ── Quality ─────────────────────────────────── */
.quality-section {
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: rgba(230, 184, 110, 0.08);
  border: 1px solid rgba(230, 184, 110, 0.2);
  border-radius: var(--radius-md);
}

.quality-title {
  font-size: 0.95rem;
  margin-bottom: var(--space-sm);
  color: var(--color-warning);
}

.quality-warning {
  font-size: 0.85rem;
  color: var(--color-warning);
  padding: var(--space-xs) 0;
}

/* ── Simulator Panel ─────────────────────────── */
.simulator-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  position: sticky;
  top: 80px;
}

.simulator-title {
  font-size: 1.1rem;
  margin-bottom: var(--space-xs);
}

.simulator-desc {
  font-size: 0.85rem;
  margin-bottom: var(--space-lg);
}

.sim-stage {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-lg);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.sim-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.sim-vinyl {
  font-size: 3rem;
  animation: float 3s ease-in-out infinite;
}

/* Listening phase */
.sim-listening {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.listening-pulse {
  font-size: 3rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.listening-text {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-peach);
  animation: pulse 1.5s ease-in-out infinite;
}

/* Snippet phase */
.sim-snippet {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
}

.sim-snippet-actions {
  display: flex;
  gap: var(--space-md);
}

/* Revealed phase */
.sim-revealed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.fade-hint {
  font-size: 0.85rem;
  animation: pulse 2s ease-in-out infinite;
}

/* Phase dots */
.phase-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  transition: all var(--transition-base);
}

.dot.active {
  background: var(--color-terracotta);
  box-shadow: 0 0 8px rgba(199, 127, 106, 0.5);
  transform: scale(1.3);
}

@media (max-width: 768px) {
  .song-layout {
    grid-template-columns: 1fr;
  }
  .simulator-panel {
    position: static;
  }
  .form-row {
    flex-direction: column;
  }
}

.w-full {
  width: 100%;
}

</style>
