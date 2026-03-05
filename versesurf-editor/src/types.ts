export interface Song {
  Id: string
  SpotifyId: string
  Title: string
  Artist: string
  Snippet: string
  StartSecond: number
  EndSecond: number
  IsExplicit: boolean
  PreviewUrl: string
  PictureUrl: string
  Enabled: boolean
}

export interface Playlist {
  Id: string
  Enabled: boolean
  Name: string
  PictureUrl: string
  Songs: Song[]
}
