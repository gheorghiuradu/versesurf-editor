export interface DbSong {
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
