export interface DbPlaylist {
    id: string
    name: string
    enabled: boolean
    picture_url: string
    created_by: string
    created_by_name?: string
    created_by_avatar_url?: string
    created_at: Date
    spotify_id?: string | null

}