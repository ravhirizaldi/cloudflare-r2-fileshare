// ==== Audit Trail Helper ====

/**
 * Log an action to the audit trail
 * @param {Object} env - Environment bindings
 * @param {Object} params - Audit parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.action - Action being performed
 * @param {string} params.resourceType - Type of resource being acted upon
 * @param {string} params.resourceId - ID of the resource
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent string
 * @param {Object} params.details - Additional details (will be JSON stringified)
 * @param {boolean} params.success - Whether the action was successful
 * @param {string} params.errorMessage - Error message if action failed
 */
export async function logAuditEvent(
	env,
	{
		userId = null,
		action,
		resourceType = null,
		resourceId = null,
		ipAddress = null,
		userAgent = null,
		details = null,
		success = true,
		errorMessage = null,
	}
) {
	try {
		const auditId = crypto.randomUUID();
		const timestamp = Date.now();

		await env.DB.prepare(
			`
      INSERT INTO audit_trail (
        id, timestamp, user_id, action, resource_type, resource_id,
        ip_address, user_agent, details, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
		)
			.bind(
				auditId,
				timestamp,
				userId,
				action,
				resourceType,
				resourceId,
				ipAddress,
				userAgent,
				details ? JSON.stringify(details) : null,
				success ? 1 : 0,
				errorMessage
			)
			.run();

		console.log(`Audit: ${userId || 'anonymous'} ${action} ${resourceType}:${resourceId} - ${success ? 'SUCCESS' : 'FAILED'}`);
	} catch (error) {
		console.error('Failed to log audit event:', error);
		// Don't throw - audit logging should not break the main functionality
	}
}

/**
 * Extract IP address from request
 */
export function getClientIP(req) {
	// Check common headers for real IP (CloudFlare, etc.)
	return (
		req.headers.get('CF-Connecting-IP') ||
		req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
		req.headers.get('X-Real-IP') ||
		req.headers.get('X-Client-IP') ||
		'unknown'
	);
}

/**
 * Parse user agent to extract browser information
 */
export function parseBrowserInfo(userAgent) {
	if (!userAgent) return { browser: 'unknown', os: 'unknown', device: 'unknown' };

	const ua = userAgent.toLowerCase();

	// Browser detection
	let browser = 'unknown';
	if (ua.includes('firefox')) browser = 'Firefox';
	else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
	else if (ua.includes('chromium')) browser = 'Chromium';
	else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
	else if (ua.includes('edge')) browser = 'Edge';
	else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

	// OS detection
	let os = 'unknown';
	if (ua.includes('windows nt')) os = 'Windows';
	else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
	else if (ua.includes('linux') && !ua.includes('android')) os = 'Linux';
	else if (ua.includes('android')) os = 'Android';
	else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

	// Device type detection
	let device = 'desktop';
	if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'mobile';
	else if (ua.includes('tablet') || ua.includes('ipad')) device = 'tablet';

	return { browser, os, device };
}

/**
 * Record download attempt in history
 */
export async function recordDownloadHistory(
	env,
	{ fileId, ipAddress, userAgent, userId = null, downloadDuration = null, bytesDownloaded = null, success = true }
) {
	try {
		const downloadId = crypto.randomUUID();
		const browserInfo = parseBrowserInfo(userAgent);

		await env.DB.prepare(
			`
      INSERT INTO download_history (
        id, file_id, downloaded_at, ip_address, user_agent, browser_info,
        user_id, download_duration, bytes_downloaded, success
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
		)
			.bind(
				downloadId,
				fileId,
				Date.now(),
				ipAddress,
				userAgent,
				JSON.stringify(browserInfo),
				userId,
				downloadDuration,
				bytesDownloaded,
				success ? 1 : 0
			)
			.run();
	} catch (error) {
		console.error('Failed to record download history:', error);
	}
}

/**
 * Update file statistics
 */
export async function updateFileStats(env, fileId, bytesTransferred = 0) {
	try {
		const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

		// Try to update existing record
		const result = await env.DB.prepare(
			`
      UPDATE file_stats 
      SET download_count = download_count + 1,
          bytes_transferred = bytes_transferred + ?
      WHERE file_id = ? AND stat_date = ?
    `
		)
			.bind(bytesTransferred, fileId, today)
			.run();

		// If no existing record, create new one
		if (result.changes === 0) {
			await env.DB.prepare(
				`
        INSERT INTO file_stats (file_id, stat_date, download_count, unique_ips, bytes_transferred)
        VALUES (?, ?, 1, 1, ?)
      `
			)
				.bind(fileId, today, bytesTransferred)
				.run();
		}
	} catch (error) {
		console.error('Failed to update file stats:', error);
	}
}

/**
 * Archive expired file to history
 */
export async function archiveExpiredFile(env, fileData, expiryReason) {
	try {
		await env.DB.prepare(
			`
      INSERT INTO expired_files_history (
        id, original_file_id, filename, owner, key, mime, file_size,
        created_at, expired_at, total_downloads, expiry_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
		)
			.bind(
				crypto.randomUUID(),
				fileData.id,
				fileData.filename,
				fileData.owner,
				fileData.key,
				fileData.mime,
				fileData.file_size || 0,
				fileData.created_at,
				Date.now(),
				fileData.downloads || 0,
				expiryReason
			)
			.run();
	} catch (error) {
		console.error('Failed to archive expired file:', error);
	}
}
