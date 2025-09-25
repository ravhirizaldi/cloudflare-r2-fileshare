// ==== Crypto Helpers ====

export async function hashPassword(password) {
	const enc = new TextEncoder();
	const data = enc.encode(password);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function base64url(input) {
	return btoa(String.fromCharCode(...new Uint8Array(input)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

export async function signJWT(payload, secret) {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	const header = { alg: 'HS256', typ: 'JWT' };
	const exp = Math.floor(Date.now() / 1000) + 60 * 60;
	const tokenPayload = { ...payload, exp };

	const headerBase = base64url(enc.encode(JSON.stringify(header)));
	const payloadBase = base64url(enc.encode(JSON.stringify(tokenPayload)));
	const data = `${headerBase}.${payloadBase}`;

	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
	return `${data}.${base64url(sig)}`;
}

export async function verifyJWT(token, secret) {
	try {
		const [headerB64, payloadB64, sigB64] = token.split('.');
		if (!headerB64 || !payloadB64 || !sigB64) return null;

		const enc = new TextEncoder();
		const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

		const data = `${headerB64}.${payloadB64}`;
		const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

		const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
		if (!valid) return null;

		const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

		return payload;
	} catch {
		return null;
	}
}
