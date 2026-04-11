import type { Song } from './song'

export interface Playlist {
  Id: string
  Enabled: boolean
  Name: string
  PictureUrl: string
  Songs: Song[]
}
