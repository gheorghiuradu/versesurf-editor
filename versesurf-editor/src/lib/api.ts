import nhost from '@/lib/nhost'
import type { Playlist } from '@shared/playlist'
import type { Song } from '@shared/song'
import type { DbPlaylist } from '@shared/db-playlist'
import type { DbSong } from '@shared/db-song'

// ── Model Mappers ──────────────────────────────────

function toDbPlaylist(playlist: Playlist): Omit<DbPlaylist, 'created_at' | 'created_by'> {
  return {
    id: playlist.Id,
    name: playlist.Name,
    enabled: playlist.Enabled,
    picture_url: playlist.PictureUrl || '',
  }
}

function toDbSong(song: Song, playlistId: string): DbSong {
  return {
    id: song.Id,
    spotify_id: song.SpotifyId || null,
    title: song.Title || null,
    artist: song.Artist || null,
    snippet: song.Snippet || null,
    start_second: song.StartSecond,
    end_second: song.EndSecond,
    is_explicit: song.IsExplicit,
    preview_url: song.PreviewUrl || null,
    picture_url: song.PictureUrl || null,
    enabled: song.Enabled,
    playlist_id: playlistId,
  }
}

interface DbPlaylistRow {
  id: string
  name: string
  enabled: boolean
  picture_url: string | null
  spotify_id: string | null
  created_by: string
  created_by_name?: string
  created_by_avatar_url?: string
  created_at: string
  songs: DbSongRow[]
  songs_aggregate?: { aggregate: { count: number } }
}

interface DbSongRow {
  id: string
  spotify_id: string | null
  title: string | null
  artist: string | null
  snippet: string | null
  start_second: number
  end_second: number
  is_explicit: boolean
  preview_url: string | null
  picture_url: string | null
  enabled: boolean
  playlist_id: string
}

function fromDbPlaylistRow(row: DbPlaylistRow): Playlist {
  return {
    Id: row.id,
    Name: row.name,
    Enabled: row.enabled,
    PictureUrl: row.picture_url || '',
    Songs: (row.songs || []).map(fromDbSongRow),
  }
}

function fromDbSongRow(row: DbSongRow): Song {
  return {
    Id: row.id,
    SpotifyId: row.spotify_id || '',
    Title: row.title || '',
    Artist: row.artist || '',
    Snippet: row.snippet || '',
    StartSecond: row.start_second,
    EndSecond: row.end_second,
    IsExplicit: row.is_explicit,
    PreviewUrl: row.preview_url || '',
    PictureUrl: row.picture_url || '',
    Enabled: row.enabled,
  }
}

// ── GraphQL Queries ────────────────────────────────

const GET_PUBLIC_PLAYLISTS = `
  query GetPublicPlaylists {
    playlists(where: { enabled: { _eq: true } }, order_by: { created_at: desc }) {
      id
      name
      enabled
      picture_url
      created_by
      created_by_name
      created_by_avatar_url
      created_at
      songs_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`

const GET_PLAYLIST_BY_ID = `
  query GetPlaylistById($id: uuid!) {
    playlists_by_pk(id: $id) {
      id
      name
      enabled
      picture_url
      spotify_id
      created_by
      created_by_name
      created_by_avatar_url
      created_at
      songs(order_by: { title: asc }) {
        id
        spotify_id
        title
        artist
        snippet
        start_second
        end_second
        is_explicit
        preview_url
        picture_url
        enabled
        playlist_id
      }
    }
  }
`

const GET_MY_PLAYLISTS = `
  query GetMyPlaylists($userId: uuid!) {
    playlists(where: { created_by: { _eq: $userId } }, order_by: { created_at: desc }) {
      id
      name
      enabled
      picture_url
      created_by
      created_at
      songs_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`

const DELETE_PLAYLIST = `
  mutation DeletePlaylist($id: uuid!) {
    delete_playlists_by_pk(id: $id) {
      id
    }
  }
`

const DELETE_SONG = `
  mutation DeleteSong($id: uuid!) {
    delete_songs_by_pk(id: $id) {
      id
    }
  }
`

// ── Public Types ───────────────────────────────────

export interface PlaylistSummary {
  id: string
  name: string
  pictureUrl: string
  songCount: number
  createdBy: string
  createdAt: string
  creatorName: string
  creatorAvatar: string
}

// ── API Functions ──────────────────────────────────

export async function fetchPublicPlaylists(): Promise<PlaylistSummary[]> {
  const response = await nhost.graphql.request<{
    playlists: DbPlaylistRow[]
  }>({ query: GET_PUBLIC_PLAYLISTS })

  if (response.body?.errors && response.body.errors != undefined) {
    throw new Error(response.body.errors.join(', '))
  }

  return (response.body?.data?.playlists ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    pictureUrl: row.picture_url || '',
    songCount: row.songs_aggregate?.aggregate.count ?? 0,
    createdBy: row.created_by,
    createdAt: row.created_at,
    creatorName: row.created_by_name ?? '',
    creatorAvatar: row.created_by_avatar_url ?? '',
  }))
}

export async function fetchPlaylistById(id: string): Promise<Playlist | null> {
  const { body } = await nhost.graphql.request<{
    playlists_by_pk: DbPlaylistRow | null
  }>({ query: GET_PLAYLIST_BY_ID, variables: { id } })

  if (body.errors?.length) {
    throw new Error(body.errors[0].message)
  }

  const row = body.data?.playlists_by_pk
  if (!row) return null
  return fromDbPlaylistRow(row)
}

export interface MyPlaylistSummary {
  id: string
  name: string
  pictureUrl: string
  songCount: number
  createdAt: string
  enabled: boolean
}

export async function fetchMyPlaylists(userId: string): Promise<MyPlaylistSummary[]> {
  const { body } = await nhost.graphql.request<{
    playlists: DbPlaylistRow[]
  }>({ query: GET_MY_PLAYLISTS, variables: { userId } })

  if (body.errors?.length) {
    throw new Error(body.errors[0].message)
  }

  return (body.data?.playlists ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    pictureUrl: row.picture_url || '',
    songCount: row.songs_aggregate?.aggregate.count ?? 0,
    createdAt: row.created_at,
    enabled: row.enabled,
  }))
}

export async function fetchMyPlaylistById(id: string): Promise<Playlist | null> {
  return fetchPlaylistById(id)
}

export async function deletePlaylist(id: string): Promise<void> {
  const { body } = await nhost.graphql.request<{
    delete_playlists_by_pk: { id: string } | null
  }>({ query: DELETE_PLAYLIST, variables: { id } })

  if (body.errors?.length) {
    throw new Error(body.errors[0].message)
  }
}

export async function deleteSong(id: string): Promise<void> {
  const { body } = await nhost.graphql.request<{
    delete_songs_by_pk: { id: string } | null
  }>({ query: DELETE_SONG, variables: { id } })

  if (body.errors?.length) {
    throw new Error(body.errors[0].message)
  }
}

// ── Function Calls (Create/Update) ─────────────────

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const dbPlaylist = toDbPlaylist(playlist)
  const { body, status } = await nhost.functions.post('/playlists', dbPlaylist)
  if (status >= 400) {
    throw new Error(typeof body === 'string' ? body : 'Failed to save playlist')
  }
}

export async function saveSongs(playlistId: string, songs: Song[]): Promise<void> {
  if (songs.length === 0) return
  const dbSongs = songs.map((s) => toDbSong(s, playlistId))
  const { body, status } = await nhost.functions.post('/songs', dbSongs)
  if (status >= 400) {
    throw new Error(typeof body === 'string' ? body : 'Failed to save songs')
  }
}

export { fromDbPlaylistRow, fromDbSongRow }
