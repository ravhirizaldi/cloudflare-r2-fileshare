import { verifyJWT } from './crypto.js';

// ==== Auth Helper ====

export async function requireAuth(req, env) {
	const auth = req.headers.get('Authorization') || '';
	if (!auth.startsWith('Bearer ')) return null;
	const token = auth.slice(7);
	return await verifyJWT(token, env.JWT_SECRET);
}

// ==== CORS Helpers ====

function getAllowedOrigins(env) {
	// Get allowed origins from environment variables, fallback to localhost for development
	const envOrigins = env.ALLOWED_ORIGINS || env.CORS_ORIGINS || '';
	const origins = envOrigins
		? envOrigins.split(',').map((origin) => origin.trim())
		: [
				'http://localhost:5173', // for local development
				'http://localhost:3000',
				'http://127.0.0.1:5173',
		  ];

	return origins;
}

function getCorsHeaders(origin, env) {
	const allowedOrigins = getAllowedOrigins(env);
	const isAllowed = allowedOrigins.includes(origin);

	return {
		'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Turnstile-Token',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Max-Age': '86400', // 24 hours
	};
}

export function handleCorsPrelight(req, env) {
	const origin = req.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin, env);

	return new Response(null, {
		status: 204,
		headers: corsHeaders,
	});
}

export function addCorsHeaders(response, req, env) {
	const origin = req.headers.get('Origin');
	const corsHeaders = getCorsHeaders(origin, env);

	Object.entries(corsHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}

// ==== Response Helpers ====

export function jsonResponse(data, status = 200, req = null, env = null) {
	const response = new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

	// Backward compatibility: if env is not provided but req is, try to extract env from req
	// This is a temporary solution while we update all route handlers
	if (req && !env && req.env) {
		env = req.env;
	}

	if (req && env) {
		return addCorsHeaders(response, req, env);
	} else if (req) {
		// Fallback for cases where env is not available - use default CORS headers
		const origin = req.headers.get('Origin');

		// Define allowed origins for fallback
		const fallbackOrigins = ['https://r2.cajnet.id', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

		const allowedOrigin = fallbackOrigins.includes(origin) ? origin : fallbackOrigins[0];

		const corsHeaders = {
			'Access-Control-Allow-Origin': allowedOrigin,
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Max-Age': '86400',
		};

		Object.entries(corsHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});
	}

	return response;
}

export function errorResponse(message, status = 400, req = null, env = null) {
	return jsonResponse({ error: message }, status, req, env);
}

// Legacy functions for backward compatibility (auto-add CORS)
export function corsJsonResponse(data, status = 200, req, env) {
	return jsonResponse(data, status, req, env);
}

export function corsErrorResponse(message, status = 400, req, env) {
	return errorResponse(message, status, req, env);
}
