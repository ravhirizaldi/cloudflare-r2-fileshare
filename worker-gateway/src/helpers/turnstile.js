// Turnstile validation helper for Cloudflare Workers
import { jsonResponse, errorResponse } from './auth.js';

/**
 * Validate a Turnstile token with Cloudflare's API
 * @param {string} token - The Turnstile token to validate
 * @param {Object} env - Environment bindings (should contain TURNSTILE_SECRET_KEY in KV)
 * @param {string} remoteip - The IP address of the user
 * @returns {Promise<boolean>} - True if validation succeeds
 */
export async function validateTurnstileToken(token, env, remoteip = null) {
	if (!token) {
		console.error('Turnstile validation failed: No token provided');
		return false;
	}

	try {
		// Handle testing/dummy tokens
		if (token.includes('DUMMY') || token.startsWith('XXXX.')) {
			console.log('Development/testing token detected:', token);

			// Check for development secret key
			const devSecretKey = await env.TOKENS.get('TURNSTILE_SECRET_KEY_DEV');
			if (devSecretKey) {
				console.log('Using development Turnstile secret key for testing');
				// For development, we can validate dummy tokens differently
				// You might want to just return true for testing or validate against a test endpoint
				return true;
			} else {
				console.warn('Development token provided but TURNSTILE_SECRET_KEY_DEV not found in KV');
				// Fallback to regular validation
			}
		}

		// Get the secret key from KV store (production key)
		const secretKey = await env.TOKENS.get('TURNSTILE_SECRET_KEY');
		if (!secretKey) {
			console.error('Turnstile validation failed: TURNSTILE_SECRET_KEY not found in KV store');
			return false;
		}

		// Prepare the request to Cloudflare's siteverify endpoint
		const formData = new FormData();
		formData.append('secret', secretKey);
		formData.append('response', token);

		if (remoteip) {
			formData.append('remoteip', remoteip);
		}

		// Make the validation request
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			console.error('Turnstile API request failed:', response.status, response.statusText);
			return false;
		}

		const result = await response.json();

		if (result.success) {
			console.log('Turnstile validation successful');
			return true;
		} else {
			console.error('Turnstile validation failed:', result['error-codes']);
			return false;
		}
	} catch (error) {
		console.error('Turnstile validation error:', error);
		return false;
	}
}

/**
 * Middleware to require Turnstile validation for a route
 * @param {Request} req - The request object
 * @param {Object} env - Environment bindings
 * @returns {Promise<Response|null>} - Error response if validation fails, null if succeeds
 */
export async function requireTurnstile(req, env) {
	try {
		const body = await req.json();
		const { turnstileToken } = body;

		if (!turnstileToken) {
			return errorResponse('Security verification required', 400, req);
		}

		const clientIP = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP') || 'unknown';

		const isValid = await validateTurnstileToken(turnstileToken, env, clientIP);

		if (!isValid) {
			return errorResponse('Security verification failed', 403, req);
		}

		// Validation passed, return null to continue processing
		return null;
	} catch (error) {
		console.error('Turnstile middleware error:', error);
		return errorResponse('Security verification error', 500, req);
	}
}

/**
 * Check if Turnstile is configured (has secret key in KV)
 * @param {Object} env - Environment bindings
 * @returns {Promise<boolean>} - True if Turnstile is configured
 */
export async function isTurnstileConfigured(env) {
	try {
		const secretKey = await env.TOKENS.get('TURNSTILE_SECRET_KEY');
		const devSecretKey = await env.TOKENS.get('TURNSTILE_SECRET_KEY_DEV');
		return !!(secretKey || devSecretKey);
	} catch (error) {
		console.error('Error checking Turnstile configuration:', error);
		return false;
	}
}
