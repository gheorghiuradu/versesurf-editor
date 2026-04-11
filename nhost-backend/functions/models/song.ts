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
