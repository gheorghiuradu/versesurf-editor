export interface LrcLine {
  time: number // seconds
  text: string
}

export interface LrclibResult {
  trackName: string
  artistName: string
  syncedLyrics: string | null
  plainLyrics: string | null
  instrumental: boolean
}

export function parseLrc(lrc: string): LrcLine[] {
  const re = /^\[(\d{2}):(\d{2}\.\d+)\]\s?(.*)$/
  return lrc
    .split('\n')
    .map((line) => {
      const m = line.match(re)
      if (!m) return null
      const time = parseInt(m[1]!, 10) * 60 + parseFloat(m[2]!)
      const text = m[3]!.trim()
      return text ? { time, text } : null
    })
    .filter((l): l is LrcLine => l !== null)
}

export async function fetchLrclibLyrics(artist: string, title: string): Promise<LrclibResult> {
  const params = new URLSearchParams({ artist_name: artist, track_name: title })
  const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`)
  if (res.status === 404) throw new Error('No lyrics found for this track')
  if (!res.ok) throw new Error(`LRCLIB error: ${res.status}`)
  const data = await res.json()
  return {
    trackName: data.trackName,
    artistName: data.artistName,
    syncedLyrics: data.syncedLyrics ?? null,
    plainLyrics: data.plainLyrics ?? null,
    instrumental: data.instrumental ?? false,
  }
}
