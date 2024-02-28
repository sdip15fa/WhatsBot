export class UnauthorizedException {
	status: number;
	statusText: string;
	reason: string;

	constructor(reason: string) {
		this.status = 401;
		this.statusText = 'Unauthorized';
		this.reason = reason;
	}
}

export class BadRequestException {
	status: number;
	statusText: string;
	reason: string;

	constructor(reason: string) {
		this.status = 400;
		this.statusText = 'Bad Request';
		this.reason = reason;
	}
}

export class FailedException {
	status: number;
	statusText: string;
	reason: string;

	constructor(reason: string) {
		this.status = 500;
		this.statusText = 'Internal Server Error';
		this.reason = reason;
	}
}
