import { hashPassword, signJWT, verifyJWT } from '../helpers/crypto.js';
import { jsonResponse, errorResponse, requireAuth } from '../helpers/auth.js';
import { logAuditEvent, getClientIP } from '../helpers/audit.js';

// ==== Auth Routes ====

export async function handleRegister(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		const { username, password } = await req.json();
		if (!username || !password) {
			await logAuditEvent(env, {
				action: 'register_user',
				resourceType: 'user',
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'Missing credentials',
			});
			return errorResponse('Missing credentials', 400, req);
		}

		// Check if user exists
		const { results } = await env.DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).all();
		if (results.length > 0) {
			await logAuditEvent(env, {
				action: 'register_user',
				resourceType: 'user',
				resourceId: username,
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'User already exists',
			});
			return errorResponse('User already exists', 400, req);
		}

		const hash = await hashPassword(password);
		await env.DB.prepare('INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)')
			.bind(username, hash, 'user', Date.now())
			.run();

		await logAuditEvent(env, {
			action: 'register_user',
			resourceType: 'user',
			resourceId: username,
			ipAddress,
			userAgent,
			success: true,
		});

		return jsonResponse({ message: 'User registered successfully' }, 200, req);
	} catch (error) {
		console.error('Registration error:', error);
		await logAuditEvent(env, {
			action: 'register_user',
			resourceType: 'user',
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Registration failed', 500, req);
	}
}

export async function handleLogin(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	try {
		const { username, password } = await req.json();
		const { results } = await env.DB.prepare('SELECT username, password_hash, role FROM users WHERE username = ?').bind(username).all();

		if (results.length === 0) {
			await logAuditEvent(env, {
				action: 'login_user',
				resourceType: 'user',
				resourceId: username,
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'User not found',
			});
			return errorResponse('Invalid credentials', 401, req);
		}
		const user = results[0];

		const hash = await hashPassword(password);
		if (hash !== user.password_hash) {
			await logAuditEvent(env, {
				action: 'login_user',
				resourceType: 'user',
				resourceId: username,
				ipAddress,
				userAgent,
				success: false,
				errorMessage: 'Invalid password',
			});
			return errorResponse('Invalid credentials', 401, req);
		}

		// Update last login time
		await env.DB.prepare('UPDATE users SET last_login = ? WHERE username = ?').bind(Date.now(), username).run();

		const token = await signJWT({ sub: username, role: user.role }, env.JWT_SECRET);

		await logAuditEvent(env, {
			userId: username,
			action: 'login_user',
			resourceType: 'user',
			resourceId: username,
			ipAddress,
			userAgent,
			success: true,
		});

		return jsonResponse({ token }, 200, req);
	} catch (error) {
		console.error('Login error:', error);
		await logAuditEvent(env, {
			action: 'login_user',
			resourceType: 'user',
			ipAddress,
			userAgent,
			success: false,
			errorMessage: error.message,
		});
		return errorResponse('Login failed', 500, req);
	}
}

export async function handleProfile(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405, req);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401, req);
	}

	const ipAddress = getClientIP(req);
	const userAgent = req.headers.get('User-Agent') || 'unknown';

	await logAuditEvent(env, {
		userId: authUser.sub,
		action: 'view_profile',
		resourceType: 'user',
		resourceId: authUser.sub,
		ipAddress,
		userAgent,
		success: true,
	});

	return jsonResponse(authUser, 200, req);
}

// Remove the duplicate requireAuth function since we're importing it from auth.js
