<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import SnippetDisplay from '@/components/SnippetDisplay.vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import genericAlbum from '@/assets/generic-album.png'
import type { Song } from '@/types'

import { fetchSpotifyTrack } from '@/utils/spotify'
import { loadWhisperModel, transcribeAudio, isModelLoaded, WHISPER_LANGUAGES, type WordTimestamp, type TranscriptionResult } from '@/utils/whisper'
import { fetchLrclibLyrics, parseLrc, type LrcLine, type LrclibResult } from '@/utils/lrclib'

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
const editPictureUrl = ref('')
const editSpotifyId = ref('')

// Import fields
const spotifyInputUrl = ref('')
const isImporting = ref(false)
const showSpotifyModal = ref(false)

// Whisper transcription state
const isModelLoading = ref(false)
const isTranscribing = ref(false)
const modelLoadProgress = ref('')
const transcriptionResult = ref<TranscriptionResult | null>(null)
const whisperModelReady = ref(isModelLoaded())
const selectedLanguage = ref('en')

// Lyrics panel tab
type LyricsTab = 'transcription' | 'synced'
const lyricsTab = ref<LyricsTab>('transcription')

// LRCLIB synced lyrics
const isFetchingLyrics = ref(false)
const lrclibResult = ref<LrclibResult | null>(null)
const lrclibLines = ref<LrcLine[]>([])
const lrclibError = ref('')

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
  editPictureUrl.value = song.value.PictureUrl || ''
  editSpotifyId.value = song.value.SpotifyId || ''
  if (song.value.SpotifyId) {
    spotifyInputUrl.value = `https://open.spotify.com/track/${song.value.SpotifyId}`
  }
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
    PictureUrl: editPictureUrl.value.trim(),
    SpotifyId: editSpotifyId.value.trim(),
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

async function importFromSpotify() {
  const url = spotifyInputUrl.value.trim()
  if (!url) return

  isImporting.value = true

  try {
    const trackData = await fetchSpotifyTrack(url)

    editTitle.value = trackData.title
    editArtist.value = trackData.artist
    editPreviewUrl.value = trackData.previewUrl
    if (trackData.coverUrl) editPictureUrl.value = trackData.coverUrl
    editSpotifyId.value = trackData.spotifyId

    store.showToast('Track imported successfully!', 'success')
    spotifyInputUrl.value = ''
    showSpotifyModal.value = false
  } catch (error) {
    console.error('Spotify import error:', error)
    store.showToast(error instanceof Error ? error.message : 'Error importing track', 'error')
  } finally {
    isImporting.value = false
  }
}

// Whisper transcription
async function loadModel() {
  if (whisperModelReady.value) return
  isModelLoading.value = true
  modelLoadProgress.value = 'Initializing...'
  try {
    await loadWhisperModel((info) => {
      if (info.progress != null) {
        modelLoadProgress.value = `${info.status}: ${Math.round(info.progress)}%`
      } else {
        modelLoadProgress.value = info.status
      }
    })
    whisperModelReady.value = true
    store.showToast('Whisper model loaded!', 'success')
  } catch (error) {
    console.error('Failed to load Whisper model:', error)
    store.showToast('Failed to load Whisper model', 'error')
  } finally {
    isModelLoading.value = false
    modelLoadProgress.value = ''
  }
}

async function runTranscription() {
  if (!editPreviewUrl.value) {
    store.showToast('No preview URL to transcribe', 'error')
    return
  }
  if (!whisperModelReady.value) {
    await loadModel()
    if (!whisperModelReady.value) return
  }
  isTranscribing.value = true
  try {
    transcriptionResult.value = await transcribeAudio(editPreviewUrl.value, selectedLanguage.value)
    store.showToast('Transcription complete!', 'success')
  } catch (error) {
    console.error('Transcription error:', error)
    store.showToast('Transcription failed', 'error')
  } finally {
    isTranscribing.value = false
  }
}

function useWordAsSnippet(word: WordTimestamp) {
  editSnippet.value = editSnippet.value.replace(/\{[^}]*\}/, `{${word.word}}`)
  editStartSecond.value = Math.round((word.start - 6) * 100) / 100
  if (editStartSecond.value < 0) editStartSecond.value = 0
  editEndSecond.value = Math.round((word.start - 0.2) * 100) / 100
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}

async function fetchSyncedLyrics() {
  if (!editArtist.value || !editTitle.value) {
    store.showToast('Artist and title are required to fetch lyrics', 'error')
    return
  }
  isFetchingLyrics.value = true
  lrclibError.value = ''
  lrclibResult.value = null
  lrclibLines.value = []
  try {
    const result = await fetchLrclibLyrics(editArtist.value, editTitle.value)
    lrclibResult.value = result
    if (result.syncedLyrics) {
      lrclibLines.value = parseLrc(result.syncedLyrics)
    }
    store.showToast('Lyrics fetched!', 'success')
  } catch (error) {
    lrclibError.value = error instanceof Error ? error.message : 'Failed to fetch lyrics'
    store.showToast(lrclibError.value, 'error')
  } finally {
    isFetchingLyrics.value = false
  }
}

function useLrcLine(line: LrcLine) {
  editSnippet.value = line.text
}
</script>

<template src="./SongView.html"></template>

<style scoped src="./SongView.css"></style>