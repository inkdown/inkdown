import DiffMatchPatch from 'diff-match-patch';
import type { App } from '../App';
import { loggers } from '../utils/logger';
import type { NoteResponse } from './types';

export class ConflictResolver {
    private app: App;
    private dmp: DiffMatchPatch;
    private logger = loggers.sync || loggers.app;

    constructor(app: App) {
        this.app = app;
        this.dmp = new DiffMatchPatch();
    }

    async resolve(
        path: string,
        localContent: string,
        remoteContent: string,
        remoteNote: NoteResponse,
    ): Promise<string> {
        this.logger.info(`Resolving conflict for: ${path}`);

        // Try automatic merge with diff-match-patch
        const merged = this.attemptAutoMerge(localContent, remoteContent);

        if (merged.success) {
            this.logger.info('Auto-merge successful');
            return merged.content;
        }

        // Auto-merge failed, use fallback strategy
        this.logger.warn('Auto-merge failed, using timestamp strategy');

        // Notify user about the conflict and resolution
        this.notifyUser(path, 'conflict_detected');

        return this.resolveByTimestamp(path, localContent, remoteContent, remoteNote);
    }

    private attemptAutoMerge(
        localContent: string,
        remoteContent: string,
    ): { success: boolean; content: string } {
        try {
            // Calculate patches from remote to local
            const patches = this.dmp.patch_make(remoteContent, localContent);

            // Apply patches to remote content
            const [merged, results] = this.dmp.patch_apply(patches, remoteContent);

            // Check if all patches applied successfully
            const allSuccess = results.every((r) => r === true);

            return {
                success: allSuccess,
                content: merged,
            };
        } catch (error: any) {
            this.logger.error('Auto-merge error:', error);
            return {
                success: false,
                content: localContent,
            };
        }
    }

    private async resolveByTimestamp(
        path: string,
        localContent: string,
        remoteContent: string,
        remoteNote: NoteResponse,
    ): Promise<string> {
        // Get local file modification time
        const localModifiedTime = await this.getLocalModifiedTime(path);
        const remoteModifiedTime = new Date(remoteNote.updated_at);

        if (localModifiedTime > remoteModifiedTime) {
            this.logger.info('Keeping local version (newer)');
            this.notifyUser(path, 'kept_local');
            return localContent;
        }
        this.logger.info('Using remote version (newer)');
        this.notifyUser(path, 'used_remote');
        return remoteContent;
    }

    private async getLocalModifiedTime(path: string): Promise<Date> {
        try {
            const file = this.app.workspace.getAbstractFileByPath(path) as any;
            if (!file) return new Date(0);
            return new Date(file.stat.mtime);
        } catch (error: any) {
            this.logger.error('Failed to get file stats:', error);
            return new Date(0); // Return epoch if failed
        }
    }

    private notifyUser(path: string, resolution: string): void {
        // Emit event for UI to show notification
        this.app.workspace.triggerSyncConflict(path, resolution, new Date());
    }
}
