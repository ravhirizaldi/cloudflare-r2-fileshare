import { verifyJWT } from './crypto.js';

// ==== Auth Helper ====

export async function requireAuth(req, env) {
	const auth = req.headers.get('Authorization') || '';
	if (!auth.startsWith('Bearer ')) return null;
	const token = auth.slice(7);
	return await verifyJWT(token, env.JWT_SECRET);
}

// ==== CORS Helpers ====

const ALLOWED_ORIGINS = [
	'https://your-domain.com', // replace with your actual domain
	'http://localhost:5173', // for local development
	'http://localhost:3000',
	'http://127.0.0.1:5173',
];

function getCorsHeaders(origin) {
	const isAllowed = ALLOWED_ORIGINS.includes(origin);

	return {
		'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Max-Age': '86400', // 24 hours
	};
}

export function handleCorsPrelight(req) {
	const origin = req.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin);

	return new Response(null, {
		status: 204,
		headers: corsHeaders,
	});
}

export function addCorsHeaders(response, req) {
	const origin = req.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin);

	Object.entries(corsHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}

// ==== Response Helpers ====

export function jsonResponse(data, status = 200, req = null) {
	const response = new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

	if (req) {
		return addCorsHeaders(response, req);
	}

	return response;
}

export function errorResponse(message, status = 400, req = null) {
	return jsonResponse({ error: message }, status, req);
}

// Legacy functions for backward compatibility (auto-add CORS)
export function corsJsonResponse(data, status = 200, req) {
	return jsonResponse(data, status, req);
}

export function corsErrorResponse(message, status = 400, req) {
	return errorResponse(message, status, req);
}
