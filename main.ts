import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { OneDriveClient } from './onedrive-client';

interface OneDrivePluginSettings {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    syncInterval: number;
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

const DEFAULT_SETTINGS: OneDrivePluginSettings = {
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    syncInterval: 30
}

export default class OneDrivePlugin extends Plugin {
    settings: OneDrivePluginSettings;
    client: OneDriveClient;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new OneDriveSettingTab(this.app, this));

        // Add ribbon icon
        this.addRibbonIcon('folder', 'OneDrive Manager', () => {
            // Open OneDrive file browser
            this.openFileBrowser();
        });

        // Register file sync interval
        this.registerInterval(
            window.setInterval(() => this.syncFiles(), this.settings.syncInterval * 1000)
        );
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async syncFiles() {
        // Implement file synchronization logic
    }

    private async openFileBrowser() {
        // Implement file browser UI
    }
}