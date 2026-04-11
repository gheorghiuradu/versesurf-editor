import type { Request, Response } from 'express'

/**
 * Handles CORS validation and preflight for nhost functions.
 * Returns true if the request should continue, false if the response has already been sent.
 */
export function handleCors(req: Request, res: Response, allowedMethods: string): boolean {
    if (!req.headers.origin) {
        res.status(403).send('Forbidden')
        return false
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : []
    const originUrl = new URL(req.headers.origin)
    if (!allowedOrigins.includes(originUrl.hostname)) {
        res.status(403).send('Forbidden')
        return false
    }

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', allowedMethods)
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.status(204).send()
        return false
    }

    return true
}
