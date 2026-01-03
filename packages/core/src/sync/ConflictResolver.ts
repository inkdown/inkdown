import DiffMatchPatch from 'diff-match-patch';
import type { App } from '../App';
import { loggers } from '../utils/logger';
import type { NoteResponse } from './types';

/**
 * Result of conflict resolution attempt
 */
export interface ConflictResolution {
    /** The resolved content (or local content if user decision needed) */
    content: string;
    /** Type of resolution */
    type: 'auto-merged' | 'needs-user-decision';
    /** Strategy used for resolution */
    strategy?: string;
}

export class ConflictResolver {
    private app: App;
    private dmp: DiffMatchPatch;
    private logger = loggers.sync || loggers.app;

    constructor(app: App) {
        this.app = app;
        this.dmp = new DiffMatchPatch();
    }

    /**
     * Attempt to resolve a conflict automatically.
     * Returns resolution type indicating if user intervention is needed.
     */
    async resolve(
        path: string,
        localContent: string,
        remoteContent: string,
        _remoteNote: NoteResponse,
    ): Promise<ConflictResolution> {
        this.logger.info(`Resolving conflict for: ${path}`);

        // Try automatic merge with diff-match-patch
        const merged = this.attemptAutoMerge(localContent, remoteContent);

        if (merged.success) {
            this.logger.info('Auto-merge successful');
            return {
                content: merged.content,
                type: 'auto-merged',
                strategy: 'diff-match-patch',
            };
        }

        // Auto-merge failed - this is a HARD conflict
        // Return indicator that user needs to decide
        this.logger.warn('Auto-merge failed, user decision required');
        
        // Notify user about the conflict
        this.notifyUser(path, 'needs_user_decision');

        return {
            content: localContent, // Keep local for now, user will decide
            type: 'needs-user-decision',
            strategy: 'manual',
        };
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

    private notifyUser(path: string, resolution: string): void {
        // Emit event for UI to show notification
        this.app.workspace.triggerSyncConflict(path, resolution, new Date());
    }
}
