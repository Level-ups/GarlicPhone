import { Router } from 'express';
import { jwtVerify, importJWK, JWK } from 'jose';

const router = Router();

const redirectUri = "http://" + process.env.EC2_HOST + ":" + process.env.PORT + '/api/auth/callback';

router.get('/start', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const scope = 'openid profile email';
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('prompt', 'consent select_account');

  res.redirect(authUrl.toString());
});

router.get('/callback', async (req, res) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).send('Missing code');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

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
      console.error('Token exchange failed:', errorText);
      return res.status(500).send('Failed to exchange code for tokens');
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
      token_type: string;
      id_token: string;
    };

    console.log('Tokens:', tokens);

    const idToken = tokens.id_token;

    const certsResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    const { keys } = (await certsResponse.json()) as { keys: JWK[] };

    const [headerB64] = idToken.split('.');
    const headerJson = Buffer.from(headerB64, 'base64').toString('utf-8');
    const { kid } = JSON.parse(headerJson);

    const matchingKey = keys.find((k) => k.kid === kid);
    
    if (!matchingKey) {
      console.error('No matching key found for kid:', kid);
      return res.status(500).send('Unable to verify token: no matching key');
    }

    const key = await importJWK(matchingKey, 'RS256');

    const { payload } = await jwtVerify(idToken, key, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
 
    

    // TO-DO: Create user

    res.status(200).json({token: idToken});
  } catch (error) {
    console.error('Error during OAuth callback handling:', error);
    res.status(500).send('Internal Server Error');
  }
});

export { router as authRouter };
