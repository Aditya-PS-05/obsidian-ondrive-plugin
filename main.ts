import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { OneDriveClient } from './onedrive-client';
import { OneDriveFileModal } from './file-browser-modal';

interface OneDrivePluginSettings {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    syncInterval: number;
}

const DEFAULT_SETTINGS: OneDrivePluginSettings = {
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    syncInterval: 30
}

class OneDriveSettingTab extends PluginSettingTab {
    plugin: OneDrivePlugin;

    constructor(app: App, plugin: OneDrivePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Client ID')
            .setDesc('OneDrive application client ID')
            .addText(text => text
                .setPlaceholder('Enter client ID')
                .setValue(this.plugin.settings.clientId)
                .onChange(async (value) => {
                    this.plugin.settings.clientId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Client Secret')
            .setDesc('OneDrive application client secret')
            .addText(text => text
                .setPlaceholder('Enter client secret')
                .setValue(this.plugin.settings.clientSecret)
                .onChange(async (value) => {
                    this.plugin.settings.clientSecret = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Refresh Token')
            .setDesc('OneDrive refresh token')
            .addText(text => text
                .setPlaceholder('Enter refresh token')
                .setValue(this.plugin.settings.refreshToken)
                .onChange(async (value) => {
                    this.plugin.settings.refreshToken = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sync Interval')
            .setDesc('How often to sync with OneDrive (in seconds)')
            .addText(text => text
                .setPlaceholder('30')
                .setValue(String(this.plugin.settings.syncInterval))
                .onChange(async (value) => {
                    this.plugin.settings.syncInterval = Number(value);
                    await this.plugin.saveSettings();
                }));
    }
}

export default class OneDrivePlugin extends Plugin {
    settings: OneDrivePluginSettings;
    client: OneDriveClient;

    async onload() {
        await this.loadSettings();

        // Initialize OneDrive client
        this.client = new OneDriveClient(
            this.settings.clientId,
            this.settings.clientSecret,
            this.settings.refreshToken
        );

        // Test OneDrive connection and list files
        try {
            await this.client.initialize();
            const files = await this.client.listFiles('/');
            console.log('Files in root:', files);
            new Notice('Successfully connected to OneDrive');
        } catch (error) {
            console.error('Failed to initialize OneDrive client:', error);
            new Notice('Failed to connect to OneDrive. Check your credentials.');
        }

        // Add settings tab
        this.addSettingTab(new OneDriveSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('folder', 'OneDrive Manager', async () => {
            try {
                await this.openFileBrowser();
            } catch (error) {
                console.error('Error opening file browser:', error);
                new Notice('Error opening OneDrive file browser');
            }
        });

        // Register file sync interval
        this.registerInterval(
            window.setInterval(async () => {
                try {
                    await this.syncFiles();
                } catch (error) {
                    console.error('Error during sync:', error);
                    new Notice('OneDrive sync failed');
                }
            }, this.settings.syncInterval * 1000)
        );
    }

    onunload() {
        console.log('Unloading OneDrive plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async syncFiles() {
        try {
            const files = await this.client.listFiles('/');
            console.log('Synced files:', files);
            // TODO: Implement full sync logic
            new Notice(`Synced ${files.length} files from OneDrive`);
        } catch (error) {
            console.error('Sync failed:', error);
            new Notice('Failed to sync with OneDrive');
        }
    }

    private async openFileBrowser() {
        const modal = new OneDriveFileModal(this.app, this);
        modal.open();
    }
}