import { requireAuth, jsonResponse, errorResponse } from '../helpers/auth.js';

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

// ==== File Routes ====

export async function handleUpload(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401);
	}

	const form = await req.formData();
	const file = form.get('file');
	if (!file) {
		return errorResponse('No file provided');
	}

	// Check if this is a masked executable file
	const originalName = form.get('originalName');
	const actualFileName = originalName || file.name;

	if (originalName) {
		console.log(`🔒 Processing masked executable: "${file.name}" with original name: "${originalName}"`);
	}

	// Store the original name in metadata for later restoration
	const displayName = originalName || file.name;

	const url = new URL(req.url);
	const unlimited = url.searchParams.get('unlimited') === 'true';
	const expiryParam = url.searchParams.get('expiry');
	const key = `${authUser.sub}/${Date.now()}_${file.name}`; // Keep the masked name for storage

	await env.MY_BUCKET.put(key, file.stream(), {
		httpMetadata: {
			contentType: file.type,
			// Store original name in custom metadata
			...(originalName && { 'x-original-name': originalName }),
		},
	});

	// Calculate expiry time
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

	// Insert ke D1 - store the display name
	await env.DB.prepare(
		`INSERT INTO files (id, owner, filename, key, mime, unlimited, max_downloads, downloads, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
			expiresAt
		)
		.run();

	return jsonResponse({
		link: `${url.origin}/r/${token}`,
		expiresIn: expiryDescription,
		unlimited,
		maxDownloads: unlimited ? '∞' : meta.maxDownloads,
		remainingDownloads: unlimited ? '∞' : meta.maxDownloads,
		expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
	});
}

export async function handleDownload(req, env, token) {
	let meta = await env.TOKENS.get(`tokens:${token}`, 'json');
	if (!meta) {
		return errorResponse('File not found', 404);
	}

	// Check if file has expired (only if expires is not null)
	if (meta.expires && Date.now() > meta.expires) {
		await env.TOKENS.delete(`tokens:${token}`);
		await env.MY_BUCKET.delete(meta.key);
		await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();
		return errorResponse('File expired', 410);
	}

	if (!meta.unlimitedDownloads) {
		if (meta.downloads >= meta.maxDownloads) {
			await env.TOKENS.delete(`tokens:${token}`);
			await env.MY_BUCKET.delete(meta.key);
			await env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(token).run();
			return errorResponse('Download limit reached', 410);
		}

		meta.downloads++;
		await env.TOKENS.put(`tokens:${token}`, JSON.stringify(meta));
		await env.DB.prepare(`UPDATE files SET downloads = ? WHERE id = ?`).bind(meta.downloads, token).run();
	}

	const obj = await env.MY_BUCKET.get(meta.key);
	if (!obj) {
		return errorResponse('File not found in storage', 404);
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
			return errorResponse('Range not satisfiable', 416);
		}

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

		return new Response(rangeObj.body, {
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
	}

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
	return new Response(obj.body, {
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
}

export async function handleMyFiles(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401);
	}

	const url = new URL(req.url);
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '10');
	const offset = (page - 1) * limit;

	const { results } = await env.DB.prepare(
		`SELECT id, filename, key, mime, unlimited, max_downloads, downloads, expires_at
         FROM files WHERE owner = ? ORDER BY expires_at DESC LIMIT ? OFFSET ?`
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
		};
	});

	return jsonResponse({ files, page, limit });
}

export async function handleFileStatus(req, env, token) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401);
	}

	const metaRaw = await env.TOKENS.get(`tokens:${token}`);
	if (!metaRaw) {
		return errorResponse('File not found', 404);
	}

	const meta = JSON.parse(metaRaw);

	// Check if user is owner or admin
	if (authUser.sub !== meta.owner && authUser.role !== 'admin') {
		return errorResponse('Forbidden', 403);
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

	return jsonResponse({
		file: meta.name,
		owner: meta.owner,
		unlimited: meta.unlimitedDownloads,
		remainingDownloads: meta.unlimitedDownloads ? '∞' : meta.maxDownloads - meta.downloads,
		expiresIn,
		expiresAt: meta.expires ? new Date(meta.expires).toISOString() : null,
		name: meta.originalName || meta.name, // Include original/display name for client checks
		mime: meta.mime,
	});
}

export async function handlePublicFileStatus(req, env, token) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405);
	}

	const metaRaw = await env.TOKENS.get(`tokens:${token}`);
	if (!metaRaw) {
		return jsonResponse(
			{
				valid: false,
				message: 'File not found',
			},
			404
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
			410
		);
	}

	// Check if download limit reached (for non-unlimited files)
	if (!meta.unlimitedDownloads && meta.downloads >= meta.maxDownloads) {
		return jsonResponse(
			{
				valid: false,
				message: 'Download limit reached',
			},
			410
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
			404
		);
	}

	return jsonResponse({
		valid: true,
		fileName: meta.name,
		fileSize: obj.size || 0,
		downloadCount: meta.downloads,
		expiresAt: meta.expires ? new Date(meta.expires).toISOString() : null,
		unlimited: meta.unlimitedDownloads,
		remainingDownloads: meta.unlimitedDownloads ? '∞' : meta.maxDownloads - meta.downloads,
		neverExpires: !meta.expires,
	});
}
