// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ai } from '@cloudflare/ai';
import { Env } from './types.js';
import { BadRequestException } from './exceptions.js';
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

		if (request.method === 'GET') {
			const url = new URL(request.url);
			const params = url.searchParams;

			const prompt = params.get('prompt');
			let messages: { role: 'user' | 'system' | 'assistant'; content: string }[] = [];
			try {
				messages = JSON.parse(decodeURIComponent(params.get('messages')) || '[]');
			} catch {
				return new BadRequestException('Messages must be a valid JSON array.');
			}

			let response: string;
			// prompt - simple completion style input
			if (!messages?.length) {
				const simple = {
					prompt: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n Instruction: ${prompt}\n\n Response: \n\n`,
				};
				response = await ai.run('@hf/thebloke/openhermes-2.5-mistral-7b-awq', simple);
			} else {
				const chat = {
					messages: [
						{
							role: 'system',
							content:
								"Below are a series of dialogues between various people and an AI assistant. The AI tries to be helpful, polite, honest, sophisticated, emotionally aware, and humble-but-knowledgeable. The assistant is happy to help with almost anything, and will do its best to understand exactly what is needed. It also tries to avoid giving false or misleading information, and it caveats when it isn't entirely sure about the right answer. That said, the assistant is practical and really does its best, and doesn't let caution get too much in the way of being useful.",
						},
						...messages,
					],
				};
				response = await ai.run('@cf/meta/llama-2-7b-chat-int8', chat);
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return Response.json(response);
		} else if (request.method === 'POST') {
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
	},
};
