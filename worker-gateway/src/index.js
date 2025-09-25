import { handleRegister, handleLogin, handleProfile } from './routes/auth.js';
import { handleUpload, handleDownload, handleMyFiles, handleFileStatus, handlePublicFileStatus } from './routes/files.js';
import { cleanupExpiredFiles } from './helpers/cleanup.js';
import { jsonResponse } from './helpers/auth.js';

// ==== Router ====

export function createRouter() {
	return {
		async handleRequest(req, env) {
			const url = new URL(req.url);
			const path = url.pathname;

			try {
				// Auth routes
				if (path === '/auth/register') {
					return await handleRegister(req, env);
				}

				if (path === '/auth/login') {
					return await handleLogin(req, env);
				}

				if (path === '/me') {
					return await handleProfile(req, env);
				}

				// File routes
				if (path === '/upload') {
					return await handleUpload(req, env);
				}

				if (path === '/myfiles') {
					return await handleMyFiles(req, env);
				}

				// Download route
				if (path.startsWith('/r/')) {
					const token = path.split('/').pop();
					return await handleDownload(req, env, token);
				}

				// Public status route (for download pages)
				if (path.startsWith('/public-status/')) {
					const token = path.split('/').pop();
					return await handlePublicFileStatus(req, env, token);
				}

				// Status route (for authenticated users)
				if (path.startsWith('/status/')) {
					const token = path.split('/').pop();
					return await handleFileStatus(req, env, token);
				}

				// Default response
				return jsonResponse({ message: 'File Gateway API is running' });
			} catch (error) {
				console.error('Request error:', error);
				return jsonResponse({ error: 'Internal server error' }, 500);
			}
		},
	};
}

// ==== Worker ====

export default {
	async scheduled(event, env, ctx) {
		console.log('Running scheduled cleanup job...', {
			scheduledTime: event.scheduledTime,
			currentTime: Date.now(),
			cron: event.cron,
		});

		ctx.waitUntil(async () => {
			const result = await cleanupExpiredFiles(env);
			console.log('Cleanup result:', result);
		});
	},

	async fetch(req, env) {
		const router = createRouter();
		return await router.handleRequest(req, env);
	},
};
