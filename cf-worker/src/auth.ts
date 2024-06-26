import { BadRequestException, UnauthorizedException } from './exceptions.js';
import { Env } from './types.js';

export function basicAuthentication(request: Request) {
	const Authorization = request.headers.get('Authorization');

	const [scheme, encoded] = Authorization?.split(' ') || ['', ''];

	// The Authorization header must start with Basic, followed by a space.
	if (!encoded || scheme !== 'Basic') {
		throw new BadRequestException('Malformed authorization header.');
	}

	// Decodes the base64 value and performs unicode normalization.
	// @see https://datatracker.ietf.org/doc/html/rfc7613#section-3.3.2 (and #section-4.2.2)
	// @see https://dev.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
	const buffer = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
	const decoded = new TextDecoder().decode(buffer).normalize();

	// The username & password are split by the first colon.
	//=> example: "username:password"
	const index = decoded.indexOf(':');

	// The user & password are split by the first colon and MUST NOT contain control characters.
	// @see https://tools.ietf.org/html/rfc5234#appendix-B.1 (=> "CTL = %x00-1F / %x7F")
	// eslint-disable-next-line no-control-regex
	if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
		throw new BadRequestException('Invalid authorization value.');
	}

	return {
		user: decoded.substring(0, index),
		pass: decoded.substring(index + 1),
	};
}

export function verifyCredentials(user: string, pass: string, env: Env) {
	if (env.AUTH_USER !== user) {
		throw new UnauthorizedException('Invalid credentials.');
	}

	if (env.AUTH_PASSWORD !== pass) {
		throw new UnauthorizedException('Invalid credentials.');
	}
}
