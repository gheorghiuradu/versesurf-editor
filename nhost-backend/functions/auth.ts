import type { Request } from 'express'
import { createServerClient } from '@nhost/nhost-js'
import type { User } from '@nhost/nhost-js'

export async function getVerifiedUser(req: Request): Promise<User | null> {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return null
    const token = auth.slice(7)
    const client = createServerClient({
        subdomain: process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NHOST_REGION || '',
        storage: {
            get: () => ({
                accessToken: token,
                accessTokenExpiresIn: 900,
                refreshTokenId: '',
                refreshToken: '',
                user: { id: '' } as any,
            }) as any,
            set: () => { },
            remove: () => { },
        },
    })
    const response = await client.auth.getUser()
    if (!response?.body) return null
    return response.body;
}
