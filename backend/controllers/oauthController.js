import axios from 'axios';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import { generateRandomID } from '../utils/helpers.js';
import { createNotification } from './notificationController.js';

const stateStore = new Map();

const generateToken = (userID, username) => {
    return jwt.sign(
        { userID, username },
        process.env.JWT_SECRET || 'travelsaathi-pro-secret-key',
        { expiresIn: '30d' }
    );
};

const getFrontendRedirectUrl = () => {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
};

const getBackendBaseUrl = () => {
    return process.env.BACKEND_URL || process.env.BASE_URL || 'http://localhost:5000';
};

const getProviderConfig = (provider) => {
    if (provider === 'google') {
        return {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI || `${getBackendBaseUrl()}/api/auth/oauth/google/callback`
        };
    }

    return null;
};

const createUniqueUsername = async (baseUsername) => {
    const usersRef = db.collection('users');
    const sanitized = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'traveler';
    let candidate = sanitized;
    let counter = 1;

    while (true) {
        const snapshot = await usersRef.where('username', '==', candidate).get();
        if (snapshot.empty) {
            return candidate;
        }
        candidate = `${sanitized}${counter}`;
        counter += 1;
    }
};

const upsertSocialUser = async ({ provider, providerId, email, name }) => {
    const usersRef = db.collection('users');
    let userDoc = null;

    const emailQuery = await usersRef.where('email', '==', email).get();
    if (!emailQuery.empty) {
        emailQuery.forEach(doc => {
            userDoc = doc;
        });
    }

    if (!userDoc) {
        const providerQuery = await usersRef.where('providerId', '==', providerId).get();
        if (!providerQuery.empty) {
            providerQuery.forEach(doc => {
                userDoc = doc;
            });
        }
    }

    if (userDoc) {
        const existingUser = userDoc.data();
        await userDoc.ref.update({
            provider,
            providerId,
            email,
            username: existingUser.username || name || email.split('@')[0],
            updatedAt: new Date().toISOString()
        });
        return { id: userDoc.id, data: () => ({ ...existingUser, provider, providerId, email }) };
    }

    const username = await createUniqueUsername(name || email.split('@')[0]);
    const randomID = (await generateRandomID()).toString();
    const newUser = {
        username,
        email,
        provider,
        providerId,
        userID: randomID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const createdDoc = await usersRef.add(newUser);
    return { id: createdDoc.id, data: () => newUser };
};

const redirectWithResponse = (res, provider, token, username, userID, errorMessage) => {
    const frontendUrl = getFrontendRedirectUrl();
    const params = new URLSearchParams();
    params.set('provider', provider);

    if (errorMessage) {
        params.set('error', errorMessage);
    } else {
        params.set('token', token);
        params.set('username', username);
        if (userID) {
            params.set('userID', userID);
        }
    }

    res.redirect(`${frontendUrl}/login?${params.toString()}`);
};

export const startOAuth = (req, res) => {
    const provider = req.params.provider;
    const config = getProviderConfig(provider);

    if (!config || !config.clientId) {
        return redirectWithResponse(res, provider, null, null, null, 'OAuth not configured');
    }

    const state = `${provider}-${Math.random().toString(36).slice(2)}`;
    stateStore.set(state, { provider });

    if (provider === 'google') {
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', config.clientId);
        authUrl.searchParams.set('redirect_uri', config.redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('access_type', 'offline');
        return res.redirect(authUrl.toString());
    }

    return redirectWithResponse(res, provider, null, null, null, 'Unsupported provider');
};

const exchangeCodeForProviderProfile = async (provider, code, redirectUri) => {
    const config = getProviderConfig(provider);

    if (!config || !config.clientId || !config.clientSecret) {
        throw new Error('OAuth not configured');
    }

    if (provider === 'google') {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        const accessToken = tokenResponse.data.access_token;
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return {
            provider,
            providerId: profileResponse.data.sub,
            email: profileResponse.data.email,
            name: profileResponse.data.name || profileResponse.data.given_name || 'GoogleUser'
        };
    }

    throw new Error('Unsupported provider');
};

export const handleOAuthCallback = async (req, res) => {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
        return redirectWithResponse(res, provider, null, null, null, 'OAuth denied');
    }

    const storedState = stateStore.get(state);
    if (!storedState || storedState.provider !== provider) {
        return redirectWithResponse(res, provider, null, null, null, 'Invalid state');
    }

    stateStore.delete(state);

    try {
        const redirectUri = getProviderConfig(provider)?.redirectUri;
        const profile = await exchangeCodeForProviderProfile(provider, code, redirectUri);
        const userDoc = await upsertSocialUser(profile);
        const user = userDoc.data();
        const token = generateToken(user.userID, user.username);
        const decodedToken = jwt.decode(token);

        await createNotification({
            recipient: user.username,
            title: `${provider} sign-in`,
            message: `Welcome back, ${user.username}!`,
            type: 'success',
            metadata: { source: 'oauth' }
        });

        return redirectWithResponse(res, provider, token, user.username, decodedToken?.userID || user.userID, null);
    } catch (err) {
        console.error(`OAuth callback error for ${provider}:`, err.message);
        return redirectWithResponse(res, provider, null, null, null, 'OAuth failed');
    }
};
