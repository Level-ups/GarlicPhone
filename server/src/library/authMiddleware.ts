import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import userRepository from '../repositories/userRepository';

const googleJWKs = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export async function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, googleJWKs, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    let userRole
    if (payload.sub) {
        const userFromDB = await userRepository.findUserByGoogleId(payload.sub);
        userRole = userFromDB?.roleName
    } else{
        res.status(500).json({error: "Internal server error"})
    }

    req.user = {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: userRole || "player" // Default to lowest clearance role
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid Token' });
  }
}

export function requireRole(roles: string[]){
    return (req: Request, res: Response, next: NextFunction) => {
        if(!roles.includes(req?.user?.role  ?? "")){
            return res.status(403).json({error: 'Forbidden: insufficient permissions'})
        }
        next()
    }
}
