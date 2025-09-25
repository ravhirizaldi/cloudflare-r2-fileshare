import { archiveExpiredFile, logAuditEvent } from './audit.js';

// ==== Cleanup Helper ====

export async function cleanupExpiredFiles(env) {
	try {
		const currentTime = Date.now();
		console.log('Cleanup starting at timestamp:', currentTime);

		// Get all expired files from D1 with more details for archiving
		const { results } = await env.DB.prepare(
			`
			SELECT id, filename, owner, key, mime, file_size, created_at, downloads
			FROM files 
			WHERE expires_at IS NOT NULL AND expires_at < ? AND is_deleted = 0
		`
		)
			.bind(currentTime)
			.all();

		console.log(`Found ${results.length} expired files to cleanup`);

		let cleanedCount = 0;
		for (const file of results) {
			try {
				// Archive the expired file before deletion
				await archiveExpiredFile(
					env,
					{
						...file,
						file_size: file.file_size || 0,
						created_at: file.created_at || currentTime,
					},
					'time_expired'
				);

				// Delete from KV
				await env.TOKENS.delete(`tokens:${file.id}`);

				// Delete from R2
				await env.MY_BUCKET.delete(file.key);

				// Mark as deleted in D1 (or hard delete for expired files)
				await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run();

				// Log cleanup action
				await logAuditEvent(env, {
					userId: 'system',
					action: 'cleanup_expired_file',
					resourceType: 'file',
					resourceId: file.id,
					details: {
						filename: file.filename,
						owner: file.owner,
						expiry_reason: 'time_expired',
					},
					success: true,
				});

				console.log(`Cleaned up expired file: ${file.id} (${file.filename})`);
				cleanedCount++;
			} catch (err) {
				console.error(`Failed to cleanup file ${file.id}:`, err);

				// Log failed cleanup
				await logAuditEvent(env, {
					userId: 'system',
					action: 'cleanup_expired_file',
					resourceType: 'file',
					resourceId: file.id,
					details: {
						filename: file.filename,
						owner: file.owner,
					},
					success: false,
					errorMessage: err.message,
				});
			}
		}

		// Log overall cleanup summary
		await logAuditEvent(env, {
			userId: 'system',
			action: 'cleanup_job',
			resourceType: 'system',
			resourceId: 'cleanup',
			details: {
				totalFound: results.length,
				totalCleaned: cleanedCount,
				timestamp: currentTime,
			},
			success: true,
		});

		return { success: true, cleaned: cleanedCount, found: results.length };
	} catch (err) {
		console.error('Cleanup job failed:', err);

		// Log failed cleanup job
		await logAuditEvent(env, {
			userId: 'system',
			action: 'cleanup_job',
			resourceType: 'system',
			resourceId: 'cleanup',
			success: false,
			errorMessage: err.message,
		});

		return { success: false, error: err.message };
	}
}
