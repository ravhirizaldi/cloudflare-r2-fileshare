import { verifyJWT } from './crypto.js';

// ==== Auth Helper ====

export async function requireAuth(req, env) {
	const auth = req.headers.get('Authorization') || '';
	if (!auth.startsWith('Bearer ')) return null;
	const token = auth.slice(7);
	return await verifyJWT(token, env.JWT_SECRET);
}

// ==== Response Helpers ====

export function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export function errorResponse(message, status = 400) {
	return jsonResponse({ error: message }, status);
}
