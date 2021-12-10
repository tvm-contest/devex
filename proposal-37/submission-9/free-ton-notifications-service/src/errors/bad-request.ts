import ApplicationError from './application-error';

class BadRequest extends ApplicationError {
	constructor(message?: string) {
		super(message || 'Bad request', 400);
	}
}

export default BadRequest;
