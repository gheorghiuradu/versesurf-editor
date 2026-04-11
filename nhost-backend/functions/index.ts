import type { Request, Response } from 'express'
import { getVerifiedUser } from './auth';
import { handleCors } from './cors';

export default async (req: Request, res: Response) => {
    if (!handleCors(req, res, 'GET, OPTIONS')) return

    var user = await getVerifiedUser(req);
    if (user?.id === '' || user?.id == null) {
        res.status(401).send('Unauthorized');
        return;
    }

    if (req.query.url == null || typeof req.query.url !== 'string') {
        res.status(400).send('Missing or invalid url parameter');
        return;
    }

    return fetch(req.query.url as string)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            return response.text();
        })
        .then(data => res.send(data))
        .catch(error => res.status(500).send(error.toString()));
}