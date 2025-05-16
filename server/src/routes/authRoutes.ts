import { Router } from 'express';
import { importJWK, JWK, jwtVerify } from 'jose';

import { constants } from '../library/constants';
import { ErrorDetails, ValidationErrorDetails } from '../library/error-types';
import userService from '../services/userService';

const router = Router();

router.get('/start', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = constants.APP_URL + '/api/auth/callback';
  const scope = constants.GOOGLE_CLIENT_SCOPES;
  const authUrl = new URL(constants.GOOGLE_CLIENT_AUTH_URL);

  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('prompt', 'consent'); 

  return res.redirect(authUrl.toString());
});

router.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).json(new ValidationErrorDetails('Missing code parameter'));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = constants.APP_URL + '/api/auth/callback';  

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res.status(500).json(new ErrorDetails('Token exchange failed', [errorText]));
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
      token_type: string;
      id_token: string;
    };

    const idToken = tokens.id_token;

    const certsResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    const { keys } = (await certsResponse.json()) as { keys: JWK[] };

    const [headerB64] = idToken.split('.');
    const headerJson = Buffer.from(headerB64, 'base64').toString('utf-8');
    const { kid } = JSON.parse(headerJson);

    const matchingKey = keys.find((k) => k.kid === kid);
    
    if (!matchingKey) {
      return res.status(500).json(new ErrorDetails(`No matching key found for kid: ${kid}`));
    }

    const key = await importJWK(matchingKey, 'RS256');

    const { payload } = await jwtVerify(idToken, key, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
 
    if(payload.sub){
      const [user, error] = await userService.getUserByGoogleId(payload.sub);
      if (!user) {
        const newUser = await userService.createUser({
          googleSub: payload.sub,
          name: payload.name as string,
          avatarUrl: payload.picture as string,
          roleName: 'player',
        });
        if (!newUser) {
          return res.status(500).send('Failed to create user');
        }
      }
    }

    res.redirect(`/playgame?token=${idToken}`);
  } catch (error) {
    console.error('Error during OAuth callback handling:', error);
    return res.status(500).send('Internal Server Error');
  }
});

export { router as authRouter };

