import { Notice } from 'obsidian';

// Replace these with your registered Azure App values
const CLIENT_ID = 'your-client-id'; // Register this in Azure Portal
const REDIRECT_URI = 'obsidian://onedrive-oauth';
const OAUTH_SCOPE = 'Files.ReadWrite.All offline_access';

export class OAuthHandler {
    static getAuthUrl(): string {
        const authEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: OAUTH_SCOPE,
            response_mode: 'query'
        });

        return `${authEndpoint}?${params.toString()}`;
    }

    static async handleCallback(code: string): Promise<{ accessToken: string, refreshToken: string }> {
        const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: OAUTH_SCOPE
        });

        try {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new Error('Failed to get access token');
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token
            };
        } catch (error) {
            console.error('OAuth error:', error);
            throw error;
        }
    }
}