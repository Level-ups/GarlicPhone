"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const jose_1 = require("jose");
const router = (0, express_1.Router)();
exports.authRouter = router;
router.get('/start', (req, res) => {
    const clientId = '789976131197-kn1hj43trbjkvaeodoqgrbhmrv05offp.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:5000/api/auth/callback';
    const scope = 'openid profile email';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    console.log(authUrl);
    res.redirect(authUrl.toString());
});
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Missing code');
    }
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = 'http://localhost:5000/api/auth/callback';
    try {
        // Exchange code for tokens
        const tokenResponse = await (0, node_fetch_1.default)('https://oauth2.googleapis.com/token', {
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
        const tokens = (await tokenResponse.json());
        console.log('Tokens:', tokens);
        // Verify ID token
        const idToken = tokens.id_token;
        const certsResponse = await (0, node_fetch_1.default)('https://www.googleapis.com/oauth2/v3/certs');
        const { keys } = (await certsResponse.json());
        // 2. Decode header to get 'kid'
        const [headerB64] = idToken.split('.');
        const headerJson = Buffer.from(headerB64, 'base64').toString('utf-8');
        const { kid } = JSON.parse(headerJson);
        // 3. Find matching key
        const matchingKey = keys.find((k) => k.kid === kid);
        if (!matchingKey) {
            console.error('No matching key found for kid:', kid);
            return res.status(500).send('Unable to verify token: no matching key');
        }
        const key = await (0, jose_1.importJWK)(matchingKey, 'RS256');
        const { payload } = await (0, jose_1.jwtVerify)(idToken, key, {
            issuer: ['https://accounts.google.com', 'accounts.google.com'],
            audience: clientId,
        });
        console.log('Verified user:', payload);
        res.redirect(`http://127.0.0.1:3000/GarlicPhone/frontend/test.html`);
    }
    catch (error) {
        console.error('Error during OAuth callback handling:', error);
        res.status(500).send('Internal Server Error');
    }
});
