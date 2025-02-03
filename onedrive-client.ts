export class OneDriveClient {
    private clientId: string;
    private clientSecret: string;
    private refreshToken: string;
    private accessToken: string;

    constructor(clientId: string, clientSecret: string, refreshToken: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
    }

    async authenticate() {
        // Implement OAuth2 authentication
        try {
            // Get new access token using refresh token
            const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            const data = await response.json();
            this.accessToken = data.access_token;
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    async listFiles(path: string = '/') {
        await this.authenticate();
        try {
            const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${path}:/children`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to list files:', error);
            throw error;
        }
    }
}