import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Playlist, Song } from '@/types'

function generateId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const usePlaylistStore = defineStore('playlist', () => {
    const playlist = ref<Playlist | null>(null)
    const toastMessage = ref('')
    const toastType = ref<'success' | 'info' | 'warning' | 'error'>('info')
    const toastVisible = ref(false)

    const hasPlaylist = computed(() => playlist.value !== null)
    const songCount = computed(() => playlist.value?.Songs.length ?? 0)
    const coverUrl = computed(() => {
        if (!playlist.value) return ''
        return playlist.value.PictureUrl || ''
    })

    function showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
        toastMessage.value = message
        toastType.value = type
        toastVisible.value = true
        setTimeout(() => {
            toastVisible.value = false
        }, 3000)
    }

    function createPlaylist(name: string) {
        playlist.value = {
            Id: generateId(),
            Enabled: true,
            Name: name,
            PictureUrl: '',
            Songs: [],
        }
        showToast(`Playlist "${name}" created!`, 'success')
    }

    function setPlaylist(p: Playlist) {
        playlist.value = p
    }

    function updatePlaylistName(name: string) {
        if (playlist.value) {
            playlist.value.Name = name
        }
    }

    function addSong(song?: Partial<Song>): Song {
        const newSong: Song = {
            Id: generateId(),
            SpotifyId: '',
            Title: song?.Title ?? 'New Song',
            Artist: song?.Artist ?? '',
            Snippet: song?.Snippet ?? '',
            StartSecond: song?.StartSecond ?? 0,
            EndSecond: song?.EndSecond ?? 5,
            IsExplicit: song?.IsExplicit ?? false,
            PreviewUrl: song?.PreviewUrl ?? '',
            Enabled: song?.Enabled ?? true,
        }
        if (playlist.value) {
            playlist.value.Songs.push(newSong)
        }
        return newSong
    }

    function updateSong(id: string, patch: Partial<Song>) {
        if (!playlist.value) return
        const idx = playlist.value.Songs.findIndex((s) => s.Id === id)
        if (idx !== -1) {
            playlist.value.Songs[idx] = { ...playlist.value.Songs[idx], ...patch } as Song
        }
    }

    function deleteSong(id: string) {
        if (!playlist.value) return
        playlist.value.Songs = playlist.value.Songs.filter((s) => s.Id !== id)
        showToast('Song deleted', 'info')
    }

    function toggleSong(id: string) {
        if (!playlist.value) return
        const song = playlist.value.Songs.find((s) => s.Id === id)
        if (song) {
            song.Enabled = !song.Enabled
        }
    }

    function getSong(id: string): Song | undefined {
        return playlist.value?.Songs.find((s) => s.Id === id)
    }

    function setCoverFromSong(songId: string) {
        if (!playlist.value) return
        const song = playlist.value.Songs.find((s) => s.Id === songId)
        if (song) {
            // Use Spotify CDN album art URL derived from SpotifyId if available
            playlist.value.PictureUrl = `https://i.scdn.co/image/ab67616d00001e02${song.SpotifyId}`
            showToast('Cover updated!', 'success')
        }
    }

    function setCoverUrl(url: string) {
        if (playlist.value) {
            playlist.value.PictureUrl = url
        }
    }

    function exportJson(): string {
        if (!playlist.value) return '{}'
        return JSON.stringify(playlist.value, null, 4)
    }

    function importJson(json: string): boolean {
        try {
            const data = JSON.parse(json) as Playlist
            if (!data.Name || !Array.isArray(data.Songs)) {
                showToast('Invalid playlist format', 'error')
                return false
            }
            // Ensure all songs have IDs
            data.Songs = data.Songs.map((s) => ({
                ...s,
                Id: s.Id || generateId(),
            }))
            if (!data.Id) data.Id = generateId()
            playlist.value = data
            showToast(`Imported "${data.Name}" with ${data.Songs.length} songs`, 'success')
            return true
        } catch {
            showToast('Failed to parse JSON', 'error')
            return false
        }
    }

    function importSpotifyPlaylistUrl(_url: string) {
        showToast('Spotify import coming soon!', 'warning')
    }

    function importSpotifyTrackUrl(_url: string) {
        showToast('Spotify track import coming soon!', 'warning')
    }

    return {
        playlist,
        hasPlaylist,
        songCount,
        coverUrl,
        toastMessage,
        toastType,
        toastVisible,
        showToast,
        createPlaylist,
        setPlaylist,
        updatePlaylistName,
        addSong,
        updateSong,
        deleteSong,
        toggleSong,
        getSong,
        setCoverFromSong,
        setCoverUrl,
        exportJson,
        importJson,
        importSpotifyPlaylistUrl,
        importSpotifyTrackUrl,
    }
})
