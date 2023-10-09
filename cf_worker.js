import { Ai } from './vendor/@cloudflare/ai';

function basicAuthentication(request) {
  const Authorization = request.headers.get("Authorization");

  const [scheme, encoded] = Authorization.split(" ");

  // The Authorization header must start with Basic, followed by a space.
  if (!encoded || scheme !== "Basic") {
    throw new BadRequestException("Malformed authorization header.");
  }

  // Decodes the base64 value and performs unicode normalization.
  // @see https://datatracker.ietf.org/doc/html/rfc7613#section-3.3.2 (and #section-4.2.2)
  // @see https://dev.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  const buffer = Uint8Array.from(atob(encoded), (character) =>
    character.charCodeAt(0)
  );
  const decoded = new TextDecoder().decode(buffer).normalize();

  // The username & password are split by the first colon.
  //=> example: "username:password"
  const index = decoded.indexOf(":");

  // The user & password are split by the first colon and MUST NOT contain control characters.
  // @see https://tools.ietf.org/html/rfc5234#appendix-B.1 (=> "CTL = %x00-1F / %x7F")
  if (index === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
    throw new BadRequestException("Invalid authorization value.");
  }

  return {
    user: decoded.substring(0, index),
    pass: decoded.substring(index + 1),
  };
}

function verifyCredentials(user, pass) {
  if ("username" !== user) {
    throw new UnauthorizedException("Invalid credentials.");
  }

  if ("password" !== pass) {
    throw new UnauthorizedException("Invalid credentials.");
  }
}

function UnauthorizedException(reason) {
  this.status = 401;
  this.statusText = "Unauthorized";
  this.reason = reason;
}

function BadRequestException(reason) {
  this.status = 400;
  this.statusText = "Bad Request";
  this.reason = reason;
}


export default {
  async fetch(request, env) {
    const { protocol, pathname } = new URL(request.url);

    // In the case of a Basic authentication, the exchange MUST happen over an HTTPS (TLS) connection to be secure.
    if (
      "https:" !== protocol ||
      "https" !== request.headers.get("x-forwarded-proto")
    ) {
      throw new BadRequestException("Please use a HTTPS connection.");
    }

    if (request.headers.has("Authorization")) {
      // Throws exception when authorization fails.
      const { user, pass } = basicAuthentication(request);
      try {
        verifyCredentials(user, pass);
      } catch {
        // Not authenticated.
        return new Response("You need to login.", {
          status: 401,
          headers: {
            // Prompts the user for credentials.
            "WWW-Authenticate": 'Basic realm="my scope", charset="UTF-8"',
          },
        });
      }

      // Only returns this response when no exception is thrown.
    } else {
      // Not authenticated.
      return new Response("You need to login.", {
        status: 401,
        headers: {
          // Prompts the user for credentials.
          "WWW-Authenticate": 'Basic realm="my scope", charset="UTF-8"',
        },
      });
    }



    const tasks = [];
    const ai = new Ai(env.AI);

    const url = new URL(request.url);
    const params = url.searchParams;

    const prompt = params.get('prompt');

    // prompt - simple completion style input
    let simple = {
      prompt: `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n Instruction: ${prompt}\n\n Response: \n\n`
    };
    let response = await ai.run('@cf/meta/llama-2-7b-chat-int8', simple);
    // tasks.push({ inputs: simple, response });

    /*// messages - chat style input
    let chat = {
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the world series in 2020?' }
      ]
    };
    response = await ai.run('@cf/meta/llama-2-7b-chat-int8', chat);
    tasks.push({ inputs: chat, response });*/

    return Response.json(response);
  }
};
