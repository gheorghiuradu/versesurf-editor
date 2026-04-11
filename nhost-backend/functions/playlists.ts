import type { Request, Response } from 'express'
import { createClient, withAdminSession } from '@nhost/nhost-js'
import type { Playlist } from './models/playlist'
import { DbPlaylist } from './models/db-playlist'
import { SPOTIFY_CDN_REGEX } from './constants'
import { getVerifiedUser } from './auth'
import { handleCors } from './cors'
import { User } from '@nhost/nhost-js/auth'

const nhost = createClient({
    subdomain: process.env.NHOST_SUBDOMAIN || '',
    region: process.env.NHOST_REGION || '',
    configure: [withAdminSession({ adminSecret: process.env.NHOST_ADMIN_SECRET || '' })]
})

const UPSERT_PLAYLIST = `
    mutation UpsertPlaylist(
        $id: uuid!,
        $name: String!,
        $enabled: Boolean!,
        $picture_url: String,
        $spotify_id: String,
        $created_by: uuid!
        $created_by_name: String
        $created_by_avatar_url: String
    ) {
        insert_playlists_one(
            object: {
                id: $id,
                name: $name,
                enabled: $enabled,
                picture_url: $picture_url,
                spotify_id: $spotify_id,
                created_by: $created_by
                created_by_name: $created_by_name
                created_by_avatar_url: $created_by_avatar_url
            },
            on_conflict: {
                constraint: playlists_pkey,
                update_columns: [name, enabled, picture_url, spotify_id]
            }
        ) {
            id
            name
        }
    }
`

export default async (req: Request, res: Response) => {
    if (!handleCors(req, res, 'POST, OPTIONS')) return

    const playlist = req.body as DbPlaylist
    if (!playlist || !playlist.name || playlist.picture_url != null && !SPOTIFY_CDN_REGEX.test(playlist.picture_url)) {
        res.status(400).send('Invalid playlist data')
        return
    }

    const user: User = await getVerifiedUser(req)
    if (!user) {
        res.status(401).send('Unauthorized')
        return
    }

    playlist.created_by = user.id
    playlist.created_by_name = user.displayName
    playlist.created_by_avatar_url = user.avatarUrl
    nhost.graphql.request<Playlist>({ query: UPSERT_PLAYLIST, variables: playlist as DbPlaylist })
        .then((data) => {
            res.json(data)
        })
        .catch((err) => {
            console.log('Error saving playlist:', err.body?.errors || err)
            res.status(500).send(err.toString())
        })
}