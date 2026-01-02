/**
 * SyncDebugger - Comprehensive sync state logging and debugging
 */

export interface SyncStateSnapshot {
	timestamp: Date;
	localFiles: Map<string, { hash: string; modTime: number }>;
	serverFiles: Map<string, { hash: string; modTime: number }>;
	differences: {
		localOnly: string[];
		serverOnly: string[];
		modified: string[];
		conflicts: string[];
	};
}

export class SyncDebugger {
	private snapshots: SyncStateSnapshot[] = [];
	private maxSnapshots = 10;

	captureSnapshot(
		localFiles: Map<string, { hash: string; modTime: number }>,
		serverFiles: Map<string, { hash: string; modTime: number }>,
	): SyncStateSnapshot {
		const snapshot: SyncStateSnapshot = {
			timestamp: new Date(),
			localFiles: new Map(localFiles),
			serverFiles: new Map(serverFiles),
			differences: this.calculateDifferences(localFiles, serverFiles),
		};

		this.snapshots.push(snapshot);
		if (this.snapshots.length > this.maxSnapshots) {
			this.snapshots.shift();
		}

		return snapshot;
	}

	private calculateDifferences(
		localFiles: Map<string, { hash: string; modTime: number }>,
		serverFiles: Map<string, { hash: string; modTime: number }>,
	) {
		const localOnly: string[] = [];
		const serverOnly: string[] = [];
		const modified: string[] = [];
		const conflicts: string[] = [];

		// Check local files
		for (const [path, localInfo] of localFiles) {
			const serverInfo = serverFiles.get(path);
			if (!serverInfo) {
				localOnly.push(path);
			} else if (localInfo.hash !== serverInfo.hash) {
				// Different content
				if (localInfo.modTime > serverInfo.modTime) {
					modified.push(path); // Local is newer
				} else if (serverInfo.modTime > localInfo.modTime) {
					modified.push(path); // Server is newer
				} else {
					conflicts.push(path); // Same modTime but different content = conflict
				}
			}
		}

		// Check server files not in local
		for (const path of serverFiles.keys()) {
			if (!localFiles.has(path)) {
				serverOnly.push(path);
			}
		}

		return { localOnly, serverOnly, modified, conflicts };
	}

	getLatestSnapshot(): SyncStateSnapshot | null {
		return this.snapshots[this.snapshots.length - 1] || null;
	}

	getAllSnapshots(): SyncStateSnapshot[] {
		return [...this.snapshots];
	}

	logSnapshot(snapshot: SyncStateSnapshot): void {
		console.log('[SyncDebugger] === Sync State Snapshot ===');
		console.log(`Time: ${snapshot.timestamp.toISOString()}`);
		console.log(`Local files: ${snapshot.localFiles.size}`);
		console.log(`Server files: ${snapshot.serverFiles.size}`);
		console.log('\nDifferences:');
		console.log(`  Local only: ${snapshot.differences.localOnly.length}`);
		for (const f of snapshot.differences.localOnly) console.log(`    - ${f}`);
		console.log(`  Server only: ${snapshot.differences.serverOnly.length}`);
		for (const f of snapshot.differences.serverOnly) console.log(`    + ${f}`);
		console.log(`  Modified: ${snapshot.differences.modified.length}`);
		for (const f of snapshot.differences.modified) console.log(`    M ${f}`);
		console.log(`  Conflicts: ${snapshot.differences.conflicts.length}`);
		for (const f of snapshot.differences.conflicts) console.log(`    ! ${f}`);
		console.log('===========================\n');
	}

	clear(): void {
		this.snapshots = [];
	}
}
