// Test script to manually trigger cleanup
import { cleanupExpiredFiles } from './src/helpers/cleanup.js';

// Mock environment object
const env = {
	DB: {
		prepare: (query) => ({
			bind: (...args) => ({
				all: async () => {
					console.log('Query:', query);
					console.log('Args:', args);
					console.log('Current timestamp (Date.now()):', Date.now());

					// This would be the actual query result
					return { results: [] };
				},
			}),
		}),
	},
};

// Test the cleanup function
await cleanupExpiredFiles(env);
