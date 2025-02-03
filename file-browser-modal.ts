import { App, Modal, TFile, Notice, setIcon } from 'obsidian';
import OneDrivePlugin from './main';

interface OneDriveItem {
    id: string;
    name: string;
    folder?: { childCount: number };
    size?: number;
    lastModifiedDateTime?: string;
}

export class OneDriveFileModal extends Modal {
    private currentPath: string = '/';
    private items: OneDriveItem[] = [];
    private breadcrumbs: string[] = ['/'];

    constructor(app: App, private plugin: OneDrivePlugin) {
        super(app);
    }

    async onOpen() {
        await this.loadCurrentFolder();
    }

    private async loadCurrentFolder() {
        try {
            this.items = await this.plugin.client.listFiles(this.currentPath);
            this.display();
        } catch (error) {
            new Notice('Failed to load OneDrive files');
            console.error('Error loading files:', error);
        }
    }

    private display() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('onedrive-modal');

        // Add header
        const header = contentEl.createDiv('onedrive-modal-header');
        header.createEl('h2', { text: 'OneDrive Files' });

        // Add breadcrumbs
        this.createBreadcrumbs(contentEl);

        // Add file list
        const fileList = contentEl.createDiv('onedrive-file-list');
        
        // Add parent directory option if not in root
        if (this.currentPath !== '/') {
            const parentItem = fileList.createDiv('onedrive-file-item');
            setIcon(parentItem.createDiv('onedrive-file-icon'), 'folder');
            parentItem.createSpan({ text: '..' });
            parentItem.addEventListener('click', () => this.navigateUp());
        }

        // Sort items: folders first, then files
        const sortedItems = this.items.sort((a, b) => {
            const aIsFolder = !!a.folder;
            const bIsFolder = !!b.folder;
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.name.localeCompare(b.name);
        });

        // Add items
        for (const item of sortedItems) {
            const itemEl = fileList.createDiv('onedrive-file-item');
            
            // Icon
            const iconEl = itemEl.createDiv('onedrive-file-icon');
            setIcon(iconEl, item.folder ? 'folder' : 'document');

            // Name
            itemEl.createSpan({ text: item.name });

            // Size and date for files
            if (!item.folder) {
                const metaEl = itemEl.createDiv('onedrive-file-meta');
                if (item.size) {
                    metaEl.createSpan({ 
                        text: this.formatSize(item.size),
                        cls: 'onedrive-file-size'
                    });
                }
                if (item.lastModifiedDateTime) {
                    metaEl.createSpan({ 
                        text: new Date(item.lastModifiedDateTime).toLocaleDateString(),
                        cls: 'onedrive-file-date'
                    });
                }
            }

            // Click handler
            itemEl.addEventListener('click', () => {
                if (item.folder) {
                    this.navigateToFolder(item.name);
                } else {
                    this.handleFileClick(item);
                }
            });
        }

        // Add styles
        this.addStyles();
    }

    private createBreadcrumbs(containerEl: HTMLElement) {
        const breadcrumbsEl = containerEl.createDiv('onedrive-breadcrumbs');
        let path = '';
        
        this.breadcrumbs.forEach((crumb, index) => {
            if (index > 0) {
                breadcrumbsEl.createSpan({ text: ' > ' });
            }
            
            path += index === 0 ? '' : '/' + crumb;
            const crumbEl = breadcrumbsEl.createSpan({
                text: crumb === '/' ? 'Root' : crumb,
                cls: 'onedrive-breadcrumb'
            });
            
            crumbEl.addEventListener('click', () => {
                this.navigateToPath(path || '/');
            });
        });
    }

    private async navigateToFolder(folderName: string) {
        this.currentPath = this.currentPath === '/' 
            ? `/${folderName}`
            : `${this.currentPath}/${folderName}`;
        this.breadcrumbs = ['/', ...this.currentPath.split('/').filter(p => p)];
        await this.loadCurrentFolder();
    }

    private async navigateUp() {
        const parts = this.currentPath.split('/').filter(p => p);
        parts.pop();
        this.currentPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        this.breadcrumbs.pop();
        await this.loadCurrentFolder();
    }

    private async navigateToPath(path: string) {
        this.currentPath = path;
        this.breadcrumbs = ['/', ...path.split('/').filter(p => p)];
        await this.loadCurrentFolder();
    }

    private async handleFileClick(file: OneDriveItem) {
        try {
            const content = await this.plugin.client.downloadFile(file.id);
            // Create a new note with the file content
            const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            await this.app.vault.create(`${fileName}.md`, new TextDecoder().decode(content));
            new Notice(`File "${file.name}" imported successfully`);
        } catch (error) {
            new Notice(`Failed to import file "${file.name}"`);
            console.error('Error importing file:', error);
        }
    }

    private formatSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    private addStyles() {
        document.head.appendChild(createEl('style', {
            attr: { type: 'text/css' },
            text: `
                .onedrive-modal {
                    padding: 20px;
                }
                .onedrive-modal-header {
                    margin-bottom: 20px;
                }
                .onedrive-breadcrumbs {
                    margin-bottom: 15px;
                }
                .onedrive-breadcrumb {
                    cursor: pointer;
                    color: var(--text-muted);
                }
                .onedrive-breadcrumb:hover {
                    color: var(--text-normal);
                    text-decoration: underline;
                }
                .onedrive-file-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                .onedrive-file-item {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .onedrive-file-item:hover {
                    background-color: var(--background-secondary);
                }
                .onedrive-file-icon {
                    margin-right: 10px;
                }
                .onedrive-file-meta {
                    margin-left: auto;
                    color: var(--text-muted);
                    font-size: 0.8em;
                }
                .onedrive-file-size {
                    margin-right: 15px;
                }
            `
        }));
    }
}