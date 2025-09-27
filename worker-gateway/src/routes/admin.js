import { requireAuth, jsonResponse, errorResponse } from '../helpers/auth.js';
import { logAuditEvent, getClientIP, archiveExpiredFile } from '../helpers/audit.js';

// ==== Admin/Stats Routes ====

/**
 * Delete a file (soft delete by default)
 */
export async function handleDeleteFile(req, env, token) {
	if (req.method !== 'DELETE') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		// Get file info from database
		const { results } = await env.DB.prepare(
			`
      SELECT * FROM files WHERE id = ? AND is_deleted = 0
    `
		)
			.bind(token)
			.all();

		if (results.length === 0) {
			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'delete_file',
				resourceType: 'file',
				resourceId: token,
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'File not found',
			});
			return errorResponse('File not found', 404, req);
		}

		const fileData = results[0];

		// Check if user is owner or admin
		if (authUser.sub !== fileData.owner && authUser.role !== 'admin') {
			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'delete_file',
				resourceType: 'file',
				resourceId: token,
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'Access denied - not owner or admin',
			});
			return errorResponse('Forbidden - you can only delete your own files', 403, req);
		}

		const url = new URL(req.url);
		const permanent = url.searchParams.get('permanent') === 'true';

		if (permanent && authUser.role !== 'admin') {
			return errorResponse('Forbidden - only admins can permanently delete files', 403, req);
		}

		if (permanent) {
			// Permanent deletion - remove from all systems
			await archiveExpiredFile(env, fileData, 'manual_deletion');

			// Delete from R2
			await env.MY_BUCKET.delete(fileData.key);

			// Delete from KV
			await env.TOKENS.delete(`tokens:${token}`);

			// Delete from database
			await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();

			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'permanent_delete_file',
				resourceType: 'file',
				resourceId: token,
				ipAddress,
				userAgent,
				details: { filename: fileData.filename, owner: fileData.owner },
				success: true,
			});

			return jsonResponse(
				{
					message: 'File permanently deleted',
					filename: fileData.filename,
				},
				200,
				req
			);
		} else {
			// Soft deletion - mark as deleted
			await env.DB.prepare(
				`
        UPDATE files 
        SET is_deleted = 1, deleted_at = ?, deleted_by = ?
        WHERE id = ?
      `
			)
				.bind(Date.now(), authUser.sub, token)
				.run();

			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'soft_delete_file',
				resourceType: 'file',
				resourceId: token,
				ipAddress,
				userAgent,
				details: { filename: fileData.filename, owner: fileData.owner },
				success: true,
			});

			return jsonResponse(
				{
					message: 'File deleted (can be restored by admin)',
					filename: fileData.filename,
				},
				200,
				req
			);
		}
	} catch (error) {
		console.error('Delete file error:', error);
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'delete_file',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Internal server error', 500, req);
	}
}

/**
 * Get file statistics
 */
export async function handleFileStats(req, env, token) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		// Get file info
		const { results: fileResults } = await env.DB.prepare(
			`
      SELECT * FROM files WHERE id = ? AND is_deleted = 0
    `
		)
			.bind(token)
			.all();

		if (fileResults.length === 0) {
			return errorResponse('File not found', 404, req);
		}

		const fileData = fileResults[0];

		// Check if user is owner or admin
		if (authUser.sub !== fileData.owner && authUser.role !== 'admin') {
			return errorResponse('Forbidden - you can only view stats for your own files', 403, req);
		}

		// Get download history
		const { results: downloadHistory } = await env.DB.prepare(
			`
      SELECT downloaded_at, ip_address, user_agent, browser_info, user_id, success
      FROM download_history 
      WHERE file_id = ?
      ORDER BY downloaded_at DESC
      LIMIT 100
    `
		)
			.bind(token)
			.all();

		// Get aggregated stats
		const { results: statsResults } = await env.DB.prepare(
			`
      SELECT 
        stat_date,
        download_count,
        unique_ips,
        bytes_transferred
      FROM file_stats 
      WHERE file_id = ?
      ORDER BY stat_date DESC
      LIMIT 30
    `
		)
			.bind(token)
			.all();

		// Calculate summary stats
		const totalDownloads = downloadHistory.length;
		const uniqueIPs = new Set(downloadHistory.map((d) => d.ip_address)).size;
		const successfulDownloads = downloadHistory.filter((d) => d.success).length;
		const totalBytes = statsResults.reduce((sum, stat) => sum + (stat.bytes_transferred || 0), 0);

		// Group downloads by date for chart data
		const downloadsByDate = {};
		downloadHistory.forEach((download) => {
			const date = new Date(download.downloaded_at).toISOString().split('T')[0];
			downloadsByDate[date] = (downloadsByDate[date] || 0) + 1;
		});

		// Browser/OS breakdown
		const browserStats = {};
		const osStats = {};
		downloadHistory.forEach((download) => {
			if (download.browser_info) {
				try {
					const browserInfo = JSON.parse(download.browser_info);
					browserStats[browserInfo.browser] = (browserStats[browserInfo.browser] || 0) + 1;
					osStats[browserInfo.os] = (osStats[browserInfo.os] || 0) + 1;
				} catch (e) {
					// Ignore parse errors
				}
			}
		});

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'view_file_stats',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			success: true,
		});

		return jsonResponse({
			file: {
				id: fileData.id,
				filename: fileData.filename,
				owner: fileData.owner,
				created_at: fileData.created_at,
				file_size: fileData.file_size,
				mime: fileData.mime,
			},
			stats: {
				totalDownloads,
				uniqueIPs,
				successfulDownloads,
				totalBytes,
				downloadsByDate,
				browserStats,
				osStats,
			},
			recentDownloads: downloadHistory.slice(0, 20).map((d) => ({
				timestamp: d.downloaded_at,
				ip: d.ip_address,
				userAgent: d.user_agent,
				browserInfo: d.browser_info ? JSON.parse(d.browser_info) : null,
				userId: d.user_id,
				success: d.success,
			})),
			dailyStats: statsResults,
		});
	} catch (error) {
		console.error('Get file stats error:', error);
		return errorResponse('Internal server error', 500, req);
	}
}

/**
 * Get user's overall statistics
 */
export async function handleUserStats(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		// Get user's file stats
		const { results: userFiles } = await env.DB.prepare(
			`
      SELECT 
        COUNT(CASE WHEN is_deleted = 0 THEN 1 END) as total_files,
        SUM(CASE WHEN is_deleted = 0 THEN downloads ELSE 0 END) as total_downloads,
        SUM(CASE WHEN is_deleted = 0 THEN file_size ELSE 0 END) as total_bytes,
        COUNT(CASE WHEN is_deleted = 1 THEN 1 END) as deleted_files,
        COUNT(CASE WHEN is_deleted = 0 AND expires_at IS NOT NULL AND expires_at < ? THEN 1 END) as expired_files
      FROM files 
      WHERE owner = ?
    `
		)
			.bind(Date.now(), authUser.sub)
			.all();

		// Get recent activity
		const { results: recentActivity } = await env.DB.prepare(
			`
      SELECT action, timestamp, resource_type, resource_id, success
      FROM audit_trail 
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `
		)
			.bind(authUser.sub)
			.all();

		// Get expired files history
		const { results: expiredHistory } = await env.DB.prepare(
			`
      SELECT filename, expired_at, total_downloads, expiry_reason
      FROM expired_files_history 
      WHERE owner = ?
      ORDER BY expired_at DESC
      LIMIT 10
    `
		)
			.bind(authUser.sub)
			.all();

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'view_user_stats',
			resourceType: 'user',
			resourceId: authUser.sub,
			ipAddress,
			userAgent,
			success: true,
		});

		return jsonResponse(
			{
				user: {
					username: authUser.sub,
					role: authUser.role,
				},
				stats: userFiles[0] || {},
				recentActivity: recentActivity.map((a) => ({
					action: a.action,
					timestamp: a.timestamp,
					resourceType: a.resource_type,
					resourceId: a.resource_id,
					success: a.success,
				})),
				expiredFiles: expiredHistory.map((f) => ({
					filename: f.filename,
					expiredAt: f.expired_at,
					totalDownloads: f.total_downloads,
					reason: f.expiry_reason,
				})),
			},
			200,
			req
		);
	} catch (error) {
		console.error('Get user stats error:', error);
		return errorResponse('Internal server error', 500, req);
	}
}

/**
 * Get audit trail (admin only)
 */
export async function handleAuditTrail(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser || authUser.role !== 'admin') {
		return errorResponse('Forbidden - admin access required', 403, req);
	}

	const url = new URL(req.url);
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
	const action = url.searchParams.get('action');
	const userId = url.searchParams.get('user');
	const offset = (page - 1) * limit;

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		let query = `
      SELECT id, timestamp, user_id, action, resource_type, resource_id,
             ip_address, user_agent, details, success, error_message
      FROM audit_trail
    `;
		const params = [];
		const conditions = [];

		if (action) {
			conditions.push('action = ?');
			params.push(action);
		}

		if (userId) {
			conditions.push('user_id = ?');
			params.push(userId);
		}

		if (conditions.length > 0) {
			query += ' WHERE ' + conditions.join(' AND ');
		}

		query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
		params.push(limit, offset);

		const { results } = await env.DB.prepare(query)
			.bind(...params)
			.all();

		// Get total count for pagination
		let countQuery = 'SELECT COUNT(*) as total FROM audit_trail';
		const countParams = [];

		if (conditions.length > 0) {
			countQuery += ' WHERE ' + conditions.join(' AND ');
			if (action) countParams.push(action);
			if (userId) countParams.push(userId);
		}

		const { results: countResults } = await env.DB.prepare(countQuery)
			.bind(...countParams)
			.all();
		const total = countResults[0].total;

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'view_audit_trail',
			resourceType: 'system',
			resourceId: 'audit_trail',
			ipAddress,
			userAgent,
			details: { page, limit, filters: { action, userId } },
			success: true,
		});

		return jsonResponse({
			auditEvents: results.map((event) => ({
				id: event.id,
				timestamp: event.timestamp,
				userId: event.user_id,
				action: event.action,
				resourceType: event.resource_type,
				resourceId: event.resource_id,
				ipAddress: event.ip_address,
				userAgent: event.user_agent,
				details: event.details ? JSON.parse(event.details) : null,
				success: event.success,
				errorMessage: event.error_message,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Get audit trail error:', error);
		return errorResponse('Internal server error', 500, req);
	}
}

/**
 * Restore a soft-deleted file (admin only)
 */
export async function handleRestoreFile(req, env, token) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser || authUser.role !== 'admin') {
		return errorResponse('Forbidden - admin access required', 403, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		const { results } = await env.DB.prepare(
			`
      SELECT * FROM files WHERE id = ? AND is_deleted = 1
    `
		)
			.bind(token)
			.all();

		if (results.length === 0) {
			return errorResponse('Deleted file not found', 404, req);
		}

		const fileData = results[0];

		await env.DB.prepare(
			`
      UPDATE files 
      SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL
      WHERE id = ?
    `
		)
			.bind(token)
			.run();

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'restore_file',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			details: { filename: fileData.filename, owner: fileData.owner },
			success: true,
		});

		return jsonResponse(
			{
				message: 'File restored successfully',
				filename: fileData.filename,
			},
			200,
			req
		);
	} catch (error) {
		console.error('Restore file error:', error);
		return errorResponse('Internal server error', 500, req);
	}
}
