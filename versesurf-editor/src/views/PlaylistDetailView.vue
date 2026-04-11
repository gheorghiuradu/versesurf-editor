<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPlaylistById } from '@/lib/api'
import type { Playlist } from '@shared/playlist'
import genericAlbum from '@/assets/generic-album.png'

const route = useRoute()
const playlist = ref<Playlist | null>(null)
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    playlist.value = await fetchPlaylistById(route.params.id as string)
    if (!playlist.value) {
      error.value = 'Playlist not found'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load playlist'
  } finally {
    isLoading.value = false
  }
})

function getSongArt(song: { PictureUrl: string }): string {
  return song.PictureUrl || genericAlbum
}

function formatTiming(start: number, end: number): string {
  return `${start.toFixed(1)}s – ${end.toFixed(1)}s`
}
</script>

<template>
  <div class="detail-view container">
    <!-- Loading -->
    <div v-if="isLoading" class="detail-loading">
      <p class="text-muted">Loading playlist...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="detail-error">
      <h2>{{ error }}</h2>
      <RouterLink to="/" class="btn btn-primary">Back to Home</RouterLink>
    </div>

    <!-- Playlist Detail -->
    <template v-else-if="playlist">
      <header class="detail-header">
        <img
          :src="playlist.PictureUrl || genericAlbum"
          alt="Playlist cover"
          class="detail-cover"
        />
        <div class="detail-info">
          <h1 class="detail-title">{{ playlist.Name }}</h1>
          <p class="text-secondary">{{ playlist.Songs.length }} {{ playlist.Songs.length === 1 ? 'song' : 'songs' }}</p>
        </div>
      </header>

      <section class="detail-songs">
        <div v-if="playlist.Songs.length === 0" class="empty-state">
          <p class="text-muted">This playlist has no songs yet.</p>
        </div>

        <div
          v-for="(song, index) in playlist.Songs"
          :key="song.Id"
          class="detail-song-card card"
          :class="{ 'song-disabled': !song.Enabled }"
        >
          <span class="song-index text-muted">{{ index + 1 }}</span>
          <img :src="getSongArt(song)" :alt="song.Title" class="song-art" />
          <div class="song-info">
            <h3 class="song-title">{{ song.Title }}</h3>
            <p class="song-artist text-secondary">{{ song.Artist }}</p>
          </div>
          <div class="song-meta">
            <span class="badge badge-success" v-if="song.StartSecond || song.EndSecond">
              {{ formatTiming(song.StartSecond, song.EndSecond) }}
            </span>
            <span class="badge badge-warning" v-if="song.IsExplicit">E</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped src="./PlaylistDetailView.css"></style>
