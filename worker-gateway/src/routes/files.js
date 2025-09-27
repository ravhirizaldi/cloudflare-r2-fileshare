import { requireAuth, jsonResponse, errorResponse, addCorsHeaders } from '../helpers/auth.js';
import { logAuditEvent, getClientIP, recordDownloadHistory, updateFileStats, archiveExpiredFile } from '../helpers/audit.js';

// Helper function to generate preview token with hash
async function generatePreviewToken(fileToken, timestamp = Date.now()) {
	const data = `${fileToken}-${timestamp}`;
	// Create a simple hash using built-in crypto
	const encoder = new TextEncoder();
	const dataArray = encoder.encode(data);
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray);
	const hashArray = new Uint8Array(hashBuffer);
	const hashHex = Array.from(hashArray)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `${timestamp}-${hashHex.substring(0, 16)}`;
}

// Helper function to validate preview token
async function validatePreviewToken(previewToken, fileToken) {
	try {
		const [timestamp, hash] = previewToken.split('-');
		if (!timestamp || !hash) return false;

		const expectedToken = await generatePreviewToken(fileToken, parseInt(timestamp));
		return expectedToken === previewToken;
	} catch {
		return false;
	}
}

// Helper function to check if file is previewable
function isPreviewableFile(mime) {
	if (!mime) return false;
	return mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/');
}

// Helper function to parse duration strings (e.g., '1h', '30m', '1d', '1month')
function parseDuration(duration) {
	if (!duration) return 0;

	// Support both short format (1d, 1h) and long format (1day, 1month)
	const shortMatch = duration.match(/^(\d+)([smhd])$/);
	const longMatch = duration.match(/^(\d+)(second|minute|hour|day|month|week)s?$/i);

	let value, unit;

	if (shortMatch) {
		value = parseInt(shortMatch[1]);
		unit = shortMatch[2];
	} else if (longMatch) {
		value = parseInt(longMatch[1]);
		unit = longMatch[2].toLowerCase();
	} else {
		return 0;
	}

	switch (unit) {
		case 's':
		case 'second':
			return value * 1000;
		case 'm':
		case 'minute':
			return value * 60 * 1000;
		case 'h':
		case 'hour':
			return value * 60 * 60 * 1000;
		case 'd':
		case 'day':
			return value * 24 * 60 * 60 * 1000;
		case 'week':
			return value * 7 * 24 * 60 * 60 * 1000;
		case 'month':
			return value * 30 * 24 * 60 * 60 * 1000; // Approximate month as 30 days
		default:
			return 0;
	}
}

// Helper function to format duration for display
function formatDuration(milliseconds) {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);

	if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
	if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
	if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
	return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

// Helper function to validate uploaded files
function validateUploadedFile(file, maxSize = 100 * 1024 * 1024) {
	// Default 100MB max
	const errors = [];

	if (!file || !(file instanceof File)) {
		errors.push('Invalid file object');
		return errors;
	}

	if (!file.name || file.name.trim() === '') {
		errors.push('File name is required');
	}

	if (file.size > maxSize) {
		errors.push(`File size exceeds maximum allowed size of ${Math.floor(maxSize / 1024 / 1024)}MB`);
	}

	if (file.size === 0) {
		errors.push('File cannot be empty');
	}

	// Check for potentially dangerous file extensions (optional additional security)
	const dangerousExtensions = ['.bat', '.cmd', '.com', '.cpl', '.exe', '.scr', '.vbs', '.js', '.jar'];
	const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

	// Note: We're not blocking these, just flagging for logging purposes
	const isDangerous = dangerousExtensions.includes(fileExt);

	return { errors, isDangerous };
}

// ==== File Routes ====

export async function handleUpload(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		const form = await req.formData();
		const url = new URL(req.url);
		const unlimited = url.searchParams.get('unlimited') === 'true';
		const expiryParam = url.searchParams.get('expiry');
		const isBulkUpload = url.searchParams.get('bulk') === 'true';

		// Get all files from the form data
		const files = [];
		const originalNames = [];

		if (isBulkUpload) {
			// Handle multiple files
			for (const [key, value] of form.entries()) {
				if (key.startsWith('file') && value instanceof File) {
					files.push(value);
				} else if (key.startsWith('originalName') && typeof value === 'string') {
					originalNames.push(value);
				}
			}
		} else {
			// Handle single file (backward compatibility)
			const file = form.get('file');
			const originalName = form.get('originalName');

			if (file) {
				files.push(file);
				originalNames.push(originalName || '');
			}
		}

		if (files.length === 0) {
			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'upload_file',
				resourceType: 'file',
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'No files provided',
			});
			return errorResponse('No files provided', 400, req);
		}

		// Calculate expiry time (same for all files)
		let expiresAt = null;
		let expiryDescription = 'Never expires';

		if (expiryParam && expiryParam !== 'never') {
			if (expiryParam.includes('T')) {
				// Custom date-time string
				const customExpiry = new Date(expiryParam);
				if (!isNaN(customExpiry.getTime())) {
					expiresAt = customExpiry.getTime();
					expiryDescription = customExpiry.toLocaleString();
				}
			} else {
				// Duration format (e.g., '1h', '30m', '1d', '30d')
				const duration = parseDuration(expiryParam);
				console.log(`Parsing expiry: "${expiryParam}" -> ${duration}ms -> ${formatDuration(duration)}`);
				if (duration > 0) {
					expiresAt = Date.now() + duration;
					expiryDescription = formatDuration(duration);
				}
			}
		}

		const uploadResults = [];
		const failedUploads = [];
		let totalSize = 0;

		// Process each file
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const originalName = originalNames[i] || '';

			try {
				// Validate the file first
				const validation = validateUploadedFile(file);
				if (validation.errors.length > 0) {
					failedUploads.push({
						filename: originalName || file.name,
						error: validation.errors.join(', '),
					});
					continue; // Skip this file and continue with the next one
				}

				// Check if this is a masked executable file
				const actualFileName = originalName || file.name;

				if (originalName) {
					console.log(`🔒 Processing masked executable: "${file.name}" with original name: "${originalName}"`);
				}

				if (validation.isDangerous) {
					console.log(`⚠️ Uploading potentially dangerous file: "${actualFileName}"`);
				}

				// Store the original name in metadata for later restoration
				const displayName = originalName || file.name;
				const key = `${authUser.sub}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`; // Add random string to prevent collisions

				await env.MY_BUCKET.put(key, file.stream(), {
					httpMetadata: {
						contentType: file.type,
						// Store original name in custom metadata
						...(originalName && { 'x-original-name': originalName }),
					},
				});

				const token = crypto.randomUUID();
				const meta = {
					key,
					name: displayName, // Use the original name for display
					mime: file.type,
					expires: expiresAt,
					downloads: 0,
					maxDownloads: unlimited ? null : 5,
					unlimitedDownloads: unlimited,
					owner: authUser.sub,
					originalName: originalName, // Store original name if different
				};

				await env.TOKENS.put(`tokens:${token}`, JSON.stringify(meta));

				// Insert into D1 - store the display name with additional fields
				await env.DB.prepare(
					`INSERT INTO files (id, owner, filename, key, mime, unlimited, max_downloads, downloads, expires_at, created_at, file_size)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
					.bind(
						token,
						authUser.sub,
						displayName, // Use display name in database
						key,
						file.type || 'application/octet-stream',
						unlimited ? 1 : 0,
						unlimited ? null : meta.maxDownloads,
						0,
						expiresAt,
						Date.now(),
						file.size || 0
					)
					.run();

				// Add to successful uploads
				uploadResults.push({
					filename: displayName,
					token: token,
					link: `${url.origin}/r/${token}`,
					size: file.size || 0,
					mime: file.type,
				});

				totalSize += file.size || 0;

				// Log individual file upload
				await logAuditEvent(env, {
					userId: authUser.sub,
					action: 'upload_file',
					resourceType: 'file',
					resourceId: token,
					ipAddress,
					userAgent,
					details: {
						filename: displayName,
						size: file.size,
						mime: file.type,
						unlimited,
						expires: expiresAt,
						bulkUpload: isBulkUpload,
						fileIndex: i + 1,
						totalFiles: files.length,
					},
					success: true,
				});
			} catch (error) {
				console.error(`Failed to upload file ${file.name}:`, error);
				failedUploads.push({
					filename: originalName || file.name,
					error: error.message,
				});

				// Log failed upload
				await logAuditEvent(env, {
					userId: authUser.sub,
					action: 'upload_file',
					resourceType: 'file',
					ipAddress,
					userAgent,
					details: {
						filename: originalName || file.name,
						size: file.size,
						mime: file.type,
						unlimited,
						expires: expiresAt,
						bulkUpload: isBulkUpload,
						fileIndex: i + 1,
						totalFiles: files.length,
					},
					success: false,
					errorMessage: error.message,
				});
			}
		}

		// Log bulk upload summary if multiple files
		if (files.length > 1) {
			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'bulk_upload_files',
				resourceType: 'file',
				ipAddress,
				userAgent,
				details: {
					totalFiles: files.length,
					successCount: uploadResults.length,
					failedCount: failedUploads.length,
					totalSize,
					unlimited,
					expires: expiresAt,
				},
				success: uploadResults.length > 0,
			});
		}

		// Return appropriate response based on upload type
		if (isBulkUpload || files.length > 1) {
			return jsonResponse(
				{
					message: `Uploaded ${uploadResults.length} of ${files.length} files`,
					summary: {
						total: files.length,
						successful: uploadResults.length,
						failed: failedUploads.length,
						totalSize,
					},
					files: uploadResults,
					failedFiles: failedUploads,
					expiresIn: expiryDescription,
					unlimited,
					maxDownloads: unlimited ? '∞' : 5,
					remainingDownloads: unlimited ? '∞' : 5,
					expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
				},
				200,
				req
			);
		} else {
			// Single file response (backward compatibility)
			const result = uploadResults[0];
			return jsonResponse(
				{
					link: result.link,
					expiresIn: expiryDescription,
					unlimited,
					maxDownloads: unlimited ? '∞' : 5,
					remainingDownloads: unlimited ? '∞' : 5,
					expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
				},
				200,
				req
			);
		}
	} catch (error) {
		console.error('Upload error:', error);
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'upload_file',
			resourceType: 'file',
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Upload failed', 500, req);
	}
}

export async function handleDownload(req, env, token) {
	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';
	const downloadStartTime = Date.now();

	let meta = await env.TOKENS.get(`tokens:${token}`, 'json');
	if (!meta) {
		// Record failed download attempt
		await recordDownloadHistory(env, {
			fileId: token,
			ipAddress,
			userAgent,
			success: false,
		});
		return errorResponse('File not found', 404, req);
	}

	// Check if file has expired (only if expires is not null)
	if (meta.expires && Date.now() > meta.expires) {
		// Archive expired file before cleanup
		const fileData = {
			id: token,
			filename: meta.name,
			owner: meta.owner,
			key: meta.key,
			mime: meta.mime,
			file_size: meta.size || 0,
			created_at: Date.now(), // We don't have the original created_at, use current
			downloads: meta.downloads,
		};
		await archiveExpiredFile(env, fileData, 'time_expired');

		await env.TOKENS.delete(`tokens:${token}`);
		await env.MY_BUCKET.delete(meta.key);
		await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();

		await recordDownloadHistory(env, {
			fileId: token,
			ipAddress,
			userAgent,
			success: false,
		});

		return errorResponse('File expired', 410, req);
	}

	if (!meta.unlimitedDownloads) {
		if (meta.downloads >= meta.maxDownloads) {
			// Archive file that reached download limit
			const fileData = {
				id: token,
				filename: meta.name,
				owner: meta.owner,
				key: meta.key,
				mime: meta.mime,
				file_size: meta.size || 0,
				created_at: Date.now(), // We don't have the original created_at
				downloads: meta.downloads,
			};
			await archiveExpiredFile(env, fileData, 'download_limit_reached');

			await env.TOKENS.delete(`tokens:${token}`);
			await env.MY_BUCKET.delete(meta.key);
			await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();

			await recordDownloadHistory(env, {
				fileId: token,
				ipAddress,
				userAgent,
				success: false,
			});

			return errorResponse('Download limit reached', 410, req);
		}

		meta.downloads++;
		await env.TOKENS.put(`tokens:${token}`, JSON.stringify(meta));
		await env.DB.prepare(`UPDATE files SET downloads = ? WHERE id = ?`).bind(meta.downloads, token).run();
	}

	const obj = await env.MY_BUCKET.get(meta.key);
	if (!obj) {
		await recordDownloadHistory(env, {
			fileId: token,
			ipAddress,
			userAgent,
			success: false,
		});
		return errorResponse('File not found in storage', 404, req);
	}

	// Check if this is likely an executable file that needs special handling
	const isExecutable =
		meta.originalName &&
		(meta.originalName.toLowerCase().endsWith('.exe') ||
			meta.originalName.toLowerCase().endsWith('.msi') ||
			meta.originalName.toLowerCase().endsWith('.dmg') ||
			meta.originalName.toLowerCase().endsWith('.pkg') ||
			meta.originalName.toLowerCase().endsWith('.deb') ||
			meta.originalName.toLowerCase().endsWith('.rpm') ||
			meta.originalName.toLowerCase().endsWith('.app'));

	// Support for range requests (partial content)
	const range = req.headers.get('range');
	const contentLength = meta.size || obj.size;

	if (range) {
		const parts = range.replace(/bytes=/, '').split('-');
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;
		const chunkSize = end - start + 1;

		// Get the range from R2
		const rangeObj = await env.MY_BUCKET.get(meta.key, {
			range: { offset: start, length: chunkSize },
		});

		if (!rangeObj) {
			return errorResponse('Range not satisfiable', 416, req);
		}

		// Record partial download
		await recordDownloadHistory(env, {
			fileId: token,
			ipAddress,
			userAgent,
			downloadDuration: Date.now() - downloadStartTime,
			bytesDownloaded: chunkSize,
			success: true,
		});

		await updateFileStats(env, token, chunkSize);

		// Anti-IDM headers for range requests
		const rangeAntiIDMHeaders = isExecutable
			? {
					'Content-Type': 'text/plain',
					'X-Content-Type-Options': 'nosniff',
			  }
			: {
					'Content-Type': meta.mime || 'application/octet-stream',
					'Content-Disposition': `attachment; filename="${meta.name}"`,
			  };

		const rangeResponse = new Response(rangeObj.body, {
			status: 206,
			headers: {
				...rangeAntiIDMHeaders,
				'Content-Range': `bytes ${start}-${end}/${contentLength}`,
				'Content-Length': chunkSize.toString(),
				'Accept-Ranges': 'bytes',
				'X-File-Size': contentLength.toString(),
				'X-File-Name': meta.name,
				'X-Original-Name': meta.originalName || meta.name,
				'X-Is-Executable': isExecutable ? 'true' : 'false',
				'X-Remaining-Downloads': meta.unlimitedDownloads ? '∞' : (meta.maxDownloads - meta.downloads).toString(),
				'X-Expires-In': meta.expires ? `${Math.max(0, Math.floor((meta.expires - Date.now()) / 1000))}s` : 'never',
				'Access-Control-Expose-Headers': 'Content-Range, Content-Length, X-File-Size, X-File-Name, X-Original-Name, X-Is-Executable',
				'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
				Pragma: 'no-cache',
				Expires: '0',
			},
		});

		// Add CORS headers to the range response
		return addCorsHeaders(rangeResponse, req, env);
	}

	// Record full download
	await recordDownloadHistory(env, {
		fileId: token,
		ipAddress,
		userAgent,
		downloadDuration: Date.now() - downloadStartTime,
		bytesDownloaded: contentLength,
		success: true,
	});

	await updateFileStats(env, token, contentLength);

	// For executable files, use anti-IDM headers
	const antiIDMHeaders = isExecutable
		? {
				// Make it look like a regular web response, not a file download
				'Content-Type': 'text/plain', // IDM typically ignores text files
				'X-Content-Type-Options': 'nosniff',
				// Remove download indicators
				// 'Content-Disposition': undefined, // Don't set this for executables
				// Anti-detection headers
				'X-Robots-Tag': 'noindex, nofollow, nosnippet, noarchive, noimageindex',
				'X-Frame-Options': 'SAMEORIGIN',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
		  }
		: {
				'Content-Type': meta.mime || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${meta.name}"`,
		  };

	// Full file download
	const response = new Response(obj.body, {
		headers: {
			...antiIDMHeaders,
			'Content-Length': contentLength.toString(),
			'Accept-Ranges': 'bytes',
			'X-File-Size': contentLength.toString(),
			'X-File-Name': meta.name,
			'X-Original-Name': meta.originalName || meta.name,
			'X-Is-Executable': isExecutable ? 'true' : 'false', // Let client know handling type
			'X-Remaining-Downloads': meta.unlimitedDownloads ? '∞' : (meta.maxDownloads - meta.downloads).toString(),
			'X-Expires-In': meta.expires ? `${Math.max(0, Math.floor((meta.expires - Date.now()) / 1000))}s` : 'never',
			'Access-Control-Expose-Headers': 'Content-Length, X-File-Size, X-File-Name, X-Original-Name, X-Is-Executable',
			// Additional anti-IDM headers
			'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
			Pragma: 'no-cache',
			Expires: '0',
		},
	});

	// Add CORS headers to the response
	return addCorsHeaders(response, req, env);
}

export async function handleMyFiles(req, env) {
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
		const url = new URL(req.url);
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const offset = (page - 1) * limit;

		const { results } = await env.DB.prepare(
			`SELECT id, filename, key, mime, unlimited, max_downloads, downloads, expires_at, created_at, file_size
         FROM files WHERE owner = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?`
		)
			.bind(authUser.sub, limit, offset)
			.all();

		const files = results.map((r) => {
			let expiresIn = 'never';
			if (r.expires_at) {
				const remainingMs = Math.max(0, r.expires_at - Date.now());
				if (remainingMs === 0) {
					expiresIn = '0s'; // Expired
				} else {
					expiresIn = formatDuration(remainingMs);
				}
			}

			return {
				token: r.id,
				file: r.filename,
				key: r.key,
				mime: r.mime,
				unlimited: !!r.unlimited,
				remainingDownloads: r.unlimited ? '∞' : r.max_downloads - r.downloads,
				expiresIn,
				expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
				createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
				fileSize: r.file_size || 0,
				downloads: r.downloads || 0,
			};
		});

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'view_my_files',
			resourceType: 'user',
			resourceId: authUser.sub,
			ipAddress,
			userAgent,
			details: { page, limit, fileCount: files.length },
			success: true,
		});

		return jsonResponse({ files, page, limit }, 200, req);
	} catch (error) {
		console.error('Get my files error:', error);
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'view_my_files',
			resourceType: 'user',
			resourceId: authUser.sub,
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Internal server error', 500, req);
	}
}

export async function handleFileStatus(req, env, token) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const metaRaw = await env.TOKENS.get(`tokens:${token}`);
	if (!metaRaw) {
		return errorResponse('File not found', 404, req);
	}

	const meta = JSON.parse(metaRaw);

	// Check if user is owner or admin
	if (authUser.sub !== meta.owner && authUser.role !== 'admin') {
		return errorResponse('Forbidden', 403, req);
	}

	let expiresIn = 'never';
	if (meta.expires) {
		const remainingMs = Math.max(0, meta.expires - Date.now());
		if (remainingMs === 0) {
			expiresIn = '0s'; // Expired
		} else {
			expiresIn = formatDuration(remainingMs);
		}
	}

	return jsonResponse(
		{
			file: meta.name,
			owner: meta.owner,
			unlimited: meta.unlimitedDownloads,
			remainingDownloads: meta.unlimitedDownloads ? '∞' : meta.maxDownloads - meta.downloads,
			expiresIn,
			expiresAt: meta.expires ? new Date(meta.expires).toISOString() : null,
			name: meta.originalName || meta.name, // Include original/display name for client checks
			mime: meta.mime,
		},
		200,
		req
	);
}

export async function handlePublicFileStatus(req, env, token) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const metaRaw = await env.TOKENS.get(`tokens:${token}`);
	if (!metaRaw) {
		return jsonResponse(
			{
				valid: false,
				message: 'File not found',
			},
			404,
			req
		);
	}

	const meta = JSON.parse(metaRaw);

	// Check if file is expired (only if expires is not null)
	if (meta.expires && Date.now() > meta.expires) {
		return jsonResponse(
			{
				valid: false,
				message: 'File has expired',
			},
			410,
			req
		);
	}

	// Check if download limit reached (for non-unlimited files)
	if (!meta.unlimitedDownloads && meta.downloads >= meta.maxDownloads) {
		return jsonResponse(
			{
				valid: false,
				message: 'Download limit reached',
			},
			410,
			req
		);
	}

	// Check if file still exists in storage
	const obj = await env.MY_BUCKET.head(meta.key);
	if (!obj) {
		return jsonResponse(
			{
				valid: false,
				message: 'File not found in storage',
			},
			404,
			req
		);
	}

	return jsonResponse(
		{
			valid: true,
			fileName: meta.name,
			fileSize: obj.size || 0,
			downloadCount: meta.downloads,
			expiresAt: meta.expires ? new Date(meta.expires).toISOString() : null,
			unlimited: meta.unlimitedDownloads,
			remainingDownloads: meta.unlimitedDownloads ? '∞' : meta.maxDownloads - meta.downloads,
			neverExpires: !meta.expires,
		},
		200,
		req
	);
}

export async function handleBulkDelete(req, env) {
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
		const { fileTokens, permanent = true } = await req.json(); // Default to permanent deletion

		if (!fileTokens || !Array.isArray(fileTokens) || fileTokens.length === 0) {
			await logAuditEvent(env, {
				userId: authUser.sub,
				action: 'bulk_delete_files',
				resourceType: 'file',
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'No file tokens provided',
			});
			return errorResponse('No file tokens provided', 400, req);
		}

		const deletedFiles = [];
		const failedFiles = [];

		// Process each file token
		for (const token of fileTokens) {
			try {
				// Get file info from database
				const { results } = await env.DB.prepare(
					`SELECT id, owner, filename, key, mime, file_size, created_at, downloads 
					 FROM files WHERE id = ? AND is_deleted = 0`
				)
					.bind(token)
					.all();

				if (results.length === 0) {
					failedFiles.push({ token, error: 'File not found' });
					continue;
				}

				const fileData = results[0];

				// Check if user is owner or admin
				if (authUser.sub !== fileData.owner && authUser.role !== 'admin') {
					failedFiles.push({ token, error: 'Forbidden - not file owner' });
					continue;
				}

				// Always perform permanent deletion
				// 1. Archive the file before deletion
				await archiveExpiredFile(
					env,
					{
						id: fileData.id,
						filename: fileData.filename,
						owner: fileData.owner,
						key: fileData.key,
						mime: fileData.mime,
						file_size: fileData.file_size || 0,
						created_at: fileData.created_at,
						downloads: fileData.downloads,
					},
					'manual_deletion'
				);

				// 2. Delete from KV store
				await env.TOKENS.delete(`tokens:${token}`);

				// 3. Delete from R2 storage
				await env.MY_BUCKET.delete(fileData.key);

				// 4. Delete from database
				await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();

				deletedFiles.push({
					token,
					filename: fileData.filename,
					permanent: true, // Always permanent
				});

				// Log individual file deletion
				await logAuditEvent(env, {
					userId: authUser.sub,
					action: 'permanent_delete_file', // Always permanent
					resourceType: 'file',
					resourceId: token,
					ipAddress,
					userAgent,
					details: {
						filename: fileData.filename,
						fileSize: fileData.file_size,
						permanent: true,
					},
					success: true,
				});
			} catch (error) {
				console.error(`Failed to delete file ${token}:`, error);
				failedFiles.push({ token, error: error.message });
			}
		}

		// Log bulk deletion summary
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'bulk_delete_files',
			resourceType: 'file',
			ipAddress,
			userAgent,
			details: {
				totalRequested: fileTokens.length,
				successCount: deletedFiles.length,
				failedCount: failedFiles.length,
				permanent: true, // Always permanent
			},
			success: true,
		});

		return jsonResponse(
			{
				message: `Bulk permanent deletion completed`,
				summary: {
					total: fileTokens.length,
					deleted: deletedFiles.length,
					failed: failedFiles.length,
					permanent: true, // Always permanent
				},
				deletedFiles,
				failedFiles,
			},
			200,
			req
		);
	} catch (error) {
		console.error('Bulk delete error:', error);
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'bulk_delete_files',
			resourceType: 'file',
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Bulk deletion failed', 500, req);
	}
}

export async function handleGeneratePreview(req, env, token) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		const meta = await env.TOKENS.get(`tokens:${token}`, 'json');
		if (!meta) {
			return errorResponse('File not found', 404, req);
		}

		// Check if file has expired
		if (meta.expires && Date.now() > meta.expires) {
			return errorResponse('File expired', 410, req);
		}

		// Check if file is previewable
		if (!isPreviewableFile(meta.mime)) {
			return errorResponse('File type not previewable', 400, req);
		}

		// Check if user is owner or if file allows previews
		if (authUser.sub !== meta.owner) {
			// You could add additional logic here for public preview permissions
		}

		// Generate preview token with 5-minute expiry
		const previewToken = await generatePreviewToken(token);
		const previewExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

		// Store preview token in KV with expiry
		await env.TOKENS.put(
			`preview:${token}:${previewToken}`,
			JSON.stringify({
				fileToken: token,
				createdAt: Date.now(),
				expiresAt: previewExpiry,
				usedCount: 0,
				maxUses: 1,
				userId: authUser.sub,
				ipAddress,
			}),
			{ expirationTtl: 300 }
		); // 5 minutes TTL

		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'generate_preview_token',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			details: {
				filename: meta.name,
				mime: meta.mime,
				previewExpiry: new Date(previewExpiry).toISOString(),
			},
			success: true,
		});

		return jsonResponse(
			{
				previewToken,
				expiresAt: new Date(previewExpiry).toISOString(),
				expiresIn: '5 minutes',
				previewUrl: `${new URL(req.url).origin}/preview/${token}/${previewToken}`,
			},
			200,
			req
		);
	} catch (error) {
		console.error('Generate preview error:', error);
		await logAuditEvent(env, {
			userId: authUser.sub,
			action: 'generate_preview_token',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Preview generation failed', 500, req);
	}
}

export async function handleGetUploadLimits(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	// These could be made configurable via environment variables
	const limits = {
		maxFileSize: 100 * 1024 * 1024, // 100MB
		maxFilesPerUpload: 10, // Maximum files in a single bulk upload
		maxTotalSizePerUpload: 500 * 1024 * 1024, // 500MB total for bulk uploads
		allowedMimeTypes: [], // Empty array means all types allowed
		blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.cpl', '.scr', '.vbs'], // For display only
		dangerousExtensions: ['.exe', '.bat', '.cmd', '.com', '.cpl', '.scr', '.vbs', '.js', '.jar'],
	};

	return jsonResponse(limits, 200, req, env);
}

export async function handlePreview(req, env, token, previewToken) {
	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		// Validate preview token format and hash
		const isValidToken = await validatePreviewToken(previewToken, token);
		if (!isValidToken) {
			return errorResponse('Invalid preview token', 403, req);
		}

		// Get preview session data
		const previewKey = `preview:${token}:${previewToken}`;
		const previewData = await env.TOKENS.get(previewKey, 'json');

		if (!previewData) {
			return errorResponse('Preview session not found or expired', 404, req);
		}

		// Check if preview session has expired
		if (Date.now() > previewData.expiresAt) {
			await env.TOKENS.delete(previewKey);
			return errorResponse('Preview session expired', 410, req);
		}

		// Check if preview has been used up
		if (previewData.usedCount >= previewData.maxUses) {
			await env.TOKENS.delete(previewKey);
			return errorResponse('Preview session exhausted', 410, req);
		}

		// Get file metadata
		const meta = await env.TOKENS.get(`tokens:${token}`, 'json');
		if (!meta) {
			return errorResponse('File not found', 404, req);
		}

		// Check if file has expired
		if (meta.expires && Date.now() > meta.expires) {
			return errorResponse('File expired', 410, req);
		}

		// Check if file is previewable
		if (!isPreviewableFile(meta.mime)) {
			return errorResponse('File type not previewable', 400, req);
		}

		// Get file from storage
		const obj = await env.MY_BUCKET.get(meta.key);
		if (!obj) {
			return errorResponse('File not found in storage', 404, req);
		}

		// Mark preview as used and update counter
		previewData.usedCount++;
		if (previewData.usedCount >= previewData.maxUses) {
			// Delete the preview token after use
			await env.TOKENS.delete(previewKey);
		} else {
			// Update usage count
			await env.TOKENS.put(previewKey, JSON.stringify(previewData), {
				expirationTtl: Math.max(1, Math.floor((previewData.expiresAt - Date.now()) / 1000)),
			});
		}

		// Log preview access
		await logAuditEvent(env, {
			userId: previewData.userId,
			action: 'preview_file',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			details: {
				filename: meta.name,
				mime: meta.mime,
				previewToken: previewToken.substring(0, 8) + '...',
				usedCount: previewData.usedCount,
			},
			success: true,
		});

		// Return file with preview headers
		return new Response(obj.body, {
			headers: {
				'Content-Type': meta.mime || 'application/octet-stream',
				'Content-Length': (meta.size || obj.size).toString(),
				'X-File-Name': meta.name,
				'X-Preview-Mode': 'true',
				'X-Original-Name': meta.originalName || meta.name,
				'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
				Pragma: 'no-cache',
				Expires: '0',
				// Security headers
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'SAMEORIGIN',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
				// CORS headers for preview access
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Expose-Headers': 'Content-Length, X-File-Name, X-Original-Name, X-Preview-Mode',
			},
		});
	} catch (error) {
		console.error('Preview error:', error);
		await logAuditEvent(env, {
			userId: 'unknown',
			action: 'preview_file',
			resourceType: 'file',
			resourceId: token,
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Preview failed', 500, req);
	}
}
