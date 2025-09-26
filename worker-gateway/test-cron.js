// Test script to manually trigger the cron job
const testCron = async () => {
	const url = 'https://file-gateway.it-dev-635.workers.dev';

	// This will trigger a regular HTTP request to see if the worker is responding
	try {
		const response = await fetch(url);
		const data = await response.json();
		console.log('Worker response:', data);
	} catch (error) {
		console.error('Error testing worker:', error);
	}
};

testCron();
