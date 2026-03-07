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
            SpotifyId: song?.SpotifyId ?? '',
            Title: song?.Title ?? 'New Song',
            Artist: song?.Artist ?? '',
            Snippet: song?.Snippet ?? '',
            StartSecond: song?.StartSecond ?? 0,
            EndSecond: song?.EndSecond ?? 5,
            IsExplicit: song?.IsExplicit ?? false,
            PreviewUrl: song?.PreviewUrl ?? '',
            PictureUrl: song?.PictureUrl ?? '',
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
            playlist.value.PictureUrl = `song.PictureUrl`
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

    async function importSpotifyPlaylistUrl(url: string) {
        if (!url) return
        try {
            const playlistData = await import('@/utils/spotify').then(m => m.fetchSpotifyPlaylist(url))

            if (!playlist.value) {
                createPlaylist(playlistData.name)
                // Overwrite the toast immediately since we're about to show one for imported
                toastVisible.value = false
            } else {
                // If playlist name is default, update it
                if (!playlist.value.Name || playlist.value.Name.startsWith('My Playlist')) {
                    playlist.value.Name = playlistData.name
                }
            }
            if (playlist.value) {
                if (!playlist.value.PictureUrl) {
                    playlist.value.PictureUrl = playlistData.coverUrl
                }
            }

            let addedCount = 0
            for (const track of playlistData.tracks) {
                // Skip if no title or artist is found
                if (!track.title && !track.artist) continue

                addSong({
                    Title: track.title,
                    Artist: track.artist,
                    PreviewUrl: track.previewUrl,
                    PictureUrl: track.coverUrl,
                    SpotifyId: track.spotifyId
                })
                addedCount++
            }

            // Trigger reactivity explicitly since we modified a deep array in bulk
            if (playlist.value && addedCount > 0) {
                playlist.value.Songs = [...playlist.value.Songs]
            }

            showToast(`Imported ${addedCount} tracks from "${playlistData.name}"`, 'success')
            return true
        } catch (error) {
            console.error('Spotify playlist import error:', error)
            showToast(error instanceof Error ? error.message : 'Error importing playlist', 'error')
            return false
        }
    }

    async function importSpotifyTrackUrl(url: string) {
        if (!url) return
        try {
            const trackData = await import('@/utils/spotify').then(m => m.fetchSpotifyTrack(url))
            if (!playlist.value) {
                createPlaylist(trackData.title + ' Mix')
                toastVisible.value = false
            }
            if (playlist.value) {
                if (!playlist.value.PictureUrl) {
                    playlist.value.PictureUrl = trackData.coverUrl
                }
            }
            const song = addSong({
                Title: trackData.title,
                Artist: trackData.artist,
                PreviewUrl: trackData.previewUrl,
                PictureUrl: trackData.coverUrl,
                SpotifyId: trackData.spotifyId,
            })
            showToast(`Imported ${song.Title}`, 'success')
            return true
        } catch (error) {
            console.error('Spotify import error:', error)
            showToast(error instanceof Error ? error.message : 'Error importing track', 'error')
            return false
        }
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
