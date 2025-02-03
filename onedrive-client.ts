export class OneDriveClient {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor(private clientId: string, private clientSecret: string, private refreshToken: string) {}

    async initialize(): Promise<void> {
        await this.authenticate();
    }

    async authenticate() {
        try {
            const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token',
                    scope: 'Files.ReadWrite.All offline_access'
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            
            // Store the new refresh token if provided
            if (data.refresh_token) {
                this.refreshToken = data.refresh_token;
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    private async ensureAuthenticated(): Promise<void> {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            await this.authenticate();
        }
    }

    async listFiles(path: string = '/') {
        await this.ensureAuthenticated();
        try {
            const encodedPath = encodeURIComponent(path);
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${encodedPath}:/children`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to list files: ${response.statusText}`);
            }

            const data = await response.json();
            return data.value;
        } catch (error) {
            console.error('Failed to list files:', error);
            throw error;
        }
    }

    async downloadFile(fileId: string): Promise<ArrayBuffer> {
        await this.ensureAuthenticated();
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.statusText}`);
            }

            return await response.arrayBuffer();
        } catch (error) {
            console.error('Failed to download file:', error);
            throw error;
        }
    }

    async uploadFile(path: string, content: ArrayBuffer): Promise<any> {
        await this.ensureAuthenticated();
        try {
            const encodedPath = encodeURIComponent(path);
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root:${encodedPath}:/content`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/octet-stream'
                },
                body: content
            });

            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to upload file:', error);
            throw error;
        }
    }

    async getFileMetadata(fileId: string): Promise<any> {
        await this.ensureAuthenticated();
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get file metadata: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to get file metadata:', error);
            throw error;
        }
    }
}