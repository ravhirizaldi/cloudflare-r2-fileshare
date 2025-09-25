// ==== Cleanup Helper ====

export async function cleanupExpiredFiles(env) {
	try {
		const currentTime = Date.now();
		console.log('Cleanup starting at timestamp:', currentTime);

		// Ambil semua file yang expired dari D1
		const { results } = await env.DB.prepare('SELECT id, key FROM files WHERE expires_at < ?').bind(currentTime).all();

		console.log(`Found ${results.length} expired files to cleanup`);
		console.log('Expired files:', results);

		for (const file of results) {
			try {
				// Hapus dari KV
				await env.TOKENS.delete(`tokens:${file.id}`);

				// Hapus dari R2
				await env.MY_BUCKET.delete(file.key);

				// Hapus dari D1
				await env.DB.prepare('DELETE FROM files WHERE id = ?').bind(file.id).run();

				console.log(`Cleaned up expired file: ${file.id}`);
			} catch (err) {
				console.error(`Failed to cleanup file ${file.id}:`, err);
			}
		}

		return { success: true, cleaned: results.length };
	} catch (err) {
		console.error('Cleanup job failed:', err);
		return { success: false, error: err.message };
	}
}
