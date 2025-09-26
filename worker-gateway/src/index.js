import { handleRegister, handleLogin, handleProfile } from './routes/auth.js';
import {
	handleUpload,
	handleDownload,
	handleMyFiles,
	handleFileStatus,
	handlePublicFileStatus,
	handleBulkDelete,
	handleGeneratePreview,
	handlePreview,
	handleGetUploadLimits,
} from './routes/files.js';
import { handleDeleteFile, handleFileStats, handleUserStats, handleAuditTrail, handleRestoreFile } from './routes/admin.js';
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

				if (path === '/upload-limits') {
					return await handleGetUploadLimits(req, env);
				}

				// Bulk delete route
				if (path === '/files/bulk-delete') {
					return await handleBulkDelete(req, env);
				}

				// Admin/Stats routes
				if (path === '/user/stats') {
					return await handleUserStats(req, env);
				}

				if (path === '/admin/audit') {
					return await handleAuditTrail(req, env);
				}

				if (path.startsWith('/admin/restore/')) {
					const token = path.split('/').pop();
					return await handleRestoreFile(req, env, token);
				}

				// Delete file route
				if (path.startsWith('/delete/')) {
					const token = path.split('/').pop();
					return await handleDeleteFile(req, env, token);
				}

				// File stats route
				if (path.startsWith('/stats/')) {
					const token = path.split('/').pop();
					return await handleFileStats(req, env, token);
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

				// Generate preview token route
				if (path.startsWith('/generate-preview/')) {
					const token = path.split('/').pop();
					return await handleGeneratePreview(req, env, token);
				}

				// Preview route with hash verification
				if (path.startsWith('/preview/')) {
					const pathParts = path.split('/');
					if (pathParts.length >= 4) {
						const token = pathParts[2];
						const previewToken = pathParts[3];
						return await handlePreview(req, env, token, previewToken);
					}
					return jsonResponse({ error: 'Invalid preview URL format' }, 400);
				}

				// Debug route for cron testing
				if (path === '/debug/cleanup') {
					if (req.method === 'POST') {
						// Manually trigger cleanup for testing
						const result = await cleanupExpiredFiles(env);
						return jsonResponse({ message: 'Cleanup triggered manually', result });
					} else {
						// Get cleanup info
						const { results } = await env.DB.prepare(
							`SELECT id, filename, expires_at, created_at 
							 FROM files 
							 WHERE expires_at IS NOT NULL AND expires_at < ? AND is_deleted = 0
							 LIMIT 10`
						)
							.bind(Date.now())
							.all();

						return jsonResponse({
							message: 'Cleanup debug info',
							currentTime: Date.now(),
							expiredFiles: results,
							cronSchedule: '0 * * * * (every hour at minute 0)',
						});
					}
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

		ctx.waitUntil(
			(async () => {
				const result = await cleanupExpiredFiles(env);
				console.log('Cleanup result:', result);
			})()
		);
	},

	async fetch(req, env) {
		const router = createRouter();
		return await router.handleRequest(req, env);
	},
};
