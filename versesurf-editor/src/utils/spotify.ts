import nhost from "@/lib/nhost"

export interface SpotifyTrackData {
  title: string
  artist: string
  previewUrl: string
  coverUrl: string
  spotifyId: string
}

export async function fetchSpotifyTrack(url: string): Promise<SpotifyTrackData> {
  const match = url.match(/track\/([a-zA-Z0-9]+)/)
  if (!match || !match[1]) {
    throw new Error('Invalid Spotify track URL')
  }

  const trackId = match[1]

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`
  const response = await nhost.functions.fetch<string>(`?url=${embedUrl}`);

  if (!response.status || response.status >= 400) {
    throw new Error('Failed to fetch from Spotify')
  }

  const htmlText = response.body;
  const jsonMatch = htmlText.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">(.*?)<\/script>/s,
  )

  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Track data not found on the page')
  }

  // Unescape HTML entities
  const rawJson = jsonMatch[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  const nextData = JSON.parse(rawJson)

  const entity = nextData.props?.pageProps?.state?.data?.entity
  if (!entity) {
    throw new Error('Entity data is missing in JSON')
  }

  // Artists
  const artists = entity.artists || []
  const artistNames = artists.map((a: { name: string }) => a.name).join(' & ')

  // Cover image
  let coverUrl = ''
  const images = entity.visualIdentity?.image || []
  if (images.length > 0) {
    coverUrl = images[images.length - 1].url || images[0].url
  }

  // Preview URL
  const previewUrl = entity.audioPreview?.url || ''

  return {
    title: entity.name || '',
    artist: artistNames,
    previewUrl,
    coverUrl,
    spotifyId: trackId,
  }
}

export interface SpotifyPlaylistData {
  name: string
  coverUrl: string
  tracks: SpotifyTrackData[]
}

export async function fetchSpotifyPlaylist(url: string): Promise<SpotifyPlaylistData> {
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/)
  if (!match || !match[1]) {
    throw new Error('Invalid Spotify playlist URL')
  }

  const playlistId = match[1]
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`
  const response = await fetch(embedUrl)

  if (!response.ok) {
    throw new Error('Failed to fetch from Spotify')
  }

  const htmlText = await response.text()
  const jsonMatch = htmlText.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">(.*?)<\/script>/s,
  )

  if (!jsonMatch || !jsonMatch[1]) {
    throw new Error('Playlist data not found on the page')
  }

  const rawJson = jsonMatch[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  const nextData = JSON.parse(rawJson)

  const entity = nextData.props?.pageProps?.state?.data?.entity
  if (!entity || entity.type !== 'playlist') {
    throw new Error('Playlist entity data is missing in JSON')
  }

  const playlistName = entity.title || entity.name || 'Imported Playlist'

  // Extract playlist cover
  let playlistCoverUrl = ''
  const coverSources = entity.coverArt?.sources || []
  if (coverSources.length > 0) {
    playlistCoverUrl = coverSources[0].url || ''
  }

  const trackList = entity.trackList || []
  const tracks: SpotifyTrackData[] = trackList.map(
    (t: { uri?: string; title?: string; subtitle?: string; audioPreview?: { url?: string } }) => {
      const tUri = t.uri || ''
      const tMatch = tUri.match(/track:([a-zA-Z0-9]+)/)
      const tId = tMatch ? tMatch[1] : ''

      return {
        title: t.title || '',
        artist: t.subtitle || '', // Subtitle contains artist name in playlist JSON
        previewUrl: t.audioPreview?.url || '',
        coverUrl: playlistCoverUrl, // Fallback to playlist cover as track covers are sometimes missing
        spotifyId: tId,
      }
    },
  )

  return {
    name: playlistName,
    coverUrl: playlistCoverUrl,
    tracks,
  }
}
