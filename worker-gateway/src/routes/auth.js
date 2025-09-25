import { hashPassword, signJWT, verifyJWT } from '../helpers/crypto.js';
import { jsonResponse, errorResponse } from '../helpers/auth.js';

// ==== Auth Routes ====

export async function handleRegister(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405);
	}

	const { username, password } = await req.json();
	if (!username || !password) {
		return errorResponse('Missing credentials');
	}

	// Check if user exists
	const { results } = await env.DB.prepare('SELECT username FROM users WHERE username = ?').bind(username).all();
	if (results.length > 0) {
		return errorResponse('User already exists');
	}

	const hash = await hashPassword(password);
	await env.DB.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').bind(username, hash, 'user').run();

	return jsonResponse({ message: 'User registered successfully' });
}

export async function handleLogin(req, env) {
	if (req.method !== 'POST') {
		return errorResponse('Method not allowed', 405);
	}

	const { username, password } = await req.json();
	const { results } = await env.DB.prepare('SELECT username, password_hash, role FROM users WHERE username = ?').bind(username).all();

	if (results.length === 0) {
		return errorResponse('Invalid credentials', 401);
	}
	const user = results[0];

	const hash = await hashPassword(password);
	if (hash !== user.password_hash) {
		return errorResponse('Invalid credentials', 401);
	}

	const token = await signJWT({ sub: username, role: user.role }, env.JWT_SECRET);
	return jsonResponse({ token });
}

export async function handleProfile(req, env) {
	if (req.method !== 'GET') {
		return errorResponse('Method not allowed', 405);
	}

	const authUser = await requireAuth(req, env);
	if (!authUser) {
		return errorResponse('Unauthorized', 401);
	}

	return jsonResponse(authUser);
}

async function requireAuth(req, env) {
	const auth = req.headers.get('Authorization') || '';
	if (!auth.startsWith('Bearer ')) return null;
	const token = auth.slice(7);
	return await verifyJWT(token, env.JWT_SECRET);
}
