import type { Request, Response } from 'express'
import { createClient, withAdminSession } from '@nhost/nhost-js'
import type { DbSong } from './models/db-song'
import { SPOTIFY_CDN_REGEX } from './constants'
import { handleCors } from './cors'
import { Playlist } from './models/playlist'
import { Song } from './models/song'
import { getVerifiedUser } from './auth'

const nhost = createClient({
    subdomain: process.env.NHOST_SUBDOMAIN || '',
    region: process.env.NHOST_REGION || '',
    configure: [withAdminSession({ adminSecret: process.env.NHOST_ADMIN_SECRET || '' })]
})

const UPSERT_SONGS = `
    mutation UpsertSongs($songs: [songs_insert_input!]!) {
        insert_songs(
            objects: $songs,
            on_conflict: {
                constraint: songs_pkey,
                update_columns: [spotify_id, title, artist, snippet, start_second, end_second, is_explicit, preview_url, picture_url, enabled]
            }
        ) {
            affected_rows
            returning {
                id
                title
            }
        }
    }
`

export default async (req: Request, res: Response) => {
    if (!handleCors(req, res, 'POST, OPTIONS')) return

    var user = await getVerifiedUser(req);
    if (user?.id === '' || user?.id == null) {
        res.status(401).send('Unauthorized');
        return;
    }
    const songs = req.body as DbSong[]
    if (!Array.isArray(songs) || songs.length === 0) {
        res.status(400).send('Expected a non-empty array of songs')
        return
    }

    for (const song of songs) {
        if (!song.playlist_id) {
            res.status(400).send('Each song must have a playlist_id')
            return
        }
        if (song.preview_url != null && !SPOTIFY_CDN_REGEX.test(song.preview_url)) {
            res.status(400).send('Invalid preview_url')
            return
        }
        if (song.picture_url != null && !SPOTIFY_CDN_REGEX.test(song.picture_url)) {
            res.status(400).send('Invalid picture_url')
            return
        }
    }

    nhost.graphql.request<Song[]>({ query: UPSERT_SONGS, variables: { songs } })
        .then((response) => {
            if (response.body?.errors) {
                res.status(500).json(response.body.errors)
            } else {
                res.json(response.body.data)
            }
        })
        .catch((err) => {
            res.status(500).send(err.toString())
        })
}
