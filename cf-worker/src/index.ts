// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ai } from '@cloudflare/ai';
import { Env } from './types.js';
import { BadRequestException, FailedException } from './exceptions.js';
import { basicAuthentication, verifyCredentials } from './auth.js';

export default {
	async fetch(request: Request, env: Env) {
		const { protocol } = new URL(request.url);

		// In the case of a Basic authentication, the exchange MUST happen over an HTTPS (TLS) connection to be secure.
		if ('https:' !== protocol || 'https' !== request.headers.get('x-forwarded-proto')) {
			throw new BadRequestException('Please use a HTTPS connection.');
		}

		if (request.headers.has('Authorization')) {
			// Throws exception when authorization fails.
			const { user, pass } = basicAuthentication(request);
			try {
				verifyCredentials(user, pass, env);
			} catch {
				// Not authenticated.
				return new Response('You need to login.', {
					status: 401,
					headers: {
						// Prompts the user for credentials.
						'WWW-Authenticate': 'Basic realm="my scope", charset="UTF-8"',
					},
				});
			}

			// Only returns this response when no exception is thrown.
		} else {
			// Not authenticated.
			return new Response('You need to login.', {
				status: 401,
				headers: {
					// Prompts the user for credentials.
					'WWW-Authenticate': 'Basic realm="my scope", charset="UTF-8"',
				},
			});
		}

		const ai = new Ai(env.AI);

		const url = new URL(request.url);
		const params = url.searchParams;
		const path = url.pathname;

		if ((path === '/' && request.method === 'GET') || path === '/llama') {
			const prompt = params.get('prompt');
			let messages: { role: 'user' | 'system' | 'assistant'; content: string }[] = [];
			try {
				messages = JSON.parse(decodeURIComponent(params.get('messages')) || '[]');
			} catch {
				return new BadRequestException('Messages must be a valid JSON array.');
			}

			const chat = {
				messages: [
					{
						role: 'system',
						content: 'Below is an instruction that describes a task. Write a response that appropriately completes the request.',
					},
					...(messages?.length
						? messages
						: [
								{
									role: 'user',
									content: prompt,
								},
						  ]),
				],
			};
			let response: string;
			for (let i = 5; i > 0; i--) {
				try {
					response = await ai.run('@hf/thebloke/openchat_3.5-awq', chat);
					break;
				} catch {
					if (i === 1) {
						return new FailedException('Failed to generate after five tries.');
					}
				}
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return Response.json(response);
		}

		if ((path === '/' && request.method === 'POST') || path === '/transcribe') {
			const contentType = request.headers.get('Content-Type');
			if (!contentType || !contentType.includes('multipart/form-data')) {
				return new Response('Content-Type must be "multipart/form-data"', { status: 400 });
			}

			const formData = await request.formData();
			const audioFile = formData.get('audio');

			// Check if audio file exists in the POST request
			if (!audioFile || !(audioFile instanceof File)) {
				return new Response('Audio file not found in the request', { status: 400 });
			}

			// Convert audio file to ArrayBuffer
			const blob = await audioFile.arrayBuffer();
			const inputs = {
				audio: [...new Uint8Array(blob)],
			};
			const response = await ai.run('@cf/openai/whisper', inputs);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return Response.json(response);
		}

		if (path === '/sd') {
			const prompt = params.get('prompt');
			const inputs = {
				prompt,
			};

			const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', inputs);

			return new Response(response, {
				headers: {
					'content-type': 'image/png',
				},
			});
		}
	},
};
