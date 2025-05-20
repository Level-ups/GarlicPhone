import { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import userRepository from '../repositories/userRepository.js';

const googleJWKs = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

import { constants } from '../library/constants';

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, googleJWKs, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: constants.GOOGLE_CLIENT_ID,
    });

    let userRole
    if (payload.sub) {
        const userFromDB = await userRepository.findUserByGoogleId(payload.sub);
        userRole = userFromDB?.role.name
        req.user = userFromDB!;
    } else{
        res.status(500).json({error: "Internal server error"})
    }

    next();
  } catch (error) {
    debugErr(error);
    res.status(401).json({ error: 'Invalid Token' });
  }
}

export async function authenticateRequestFromQuery(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.query.authorization as string;

    const { payload } = await jwtVerify(token, googleJWKs, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: constants.GOOGLE_CLIENT_ID,
    });

    let userRole
    if (payload.sub) {
        const userFromDB = await userRepository.findUserByGoogleId(payload.sub);
        userRole = userFromDB?.role.name
        req.user = userFromDB!;
    } else{
        res.status(500).json({error: "Internal server error"})
    }

    next();
  } catch (error) {
    debugErr(error);
    res.status(401).json({ error: 'Invalid Token In Query' });
  }
}

export function requireRole(roles: string[]){
    return (req: Request, res: Response, next: NextFunction) => {
        if(!roles.includes(req?.user?.role.name  ?? "")){
            return res.status(403).json({error: 'Forbidden: insufficient permissions'})
        }
        next()
    }
}
