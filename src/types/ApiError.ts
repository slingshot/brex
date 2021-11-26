export class ApiError extends Error {
    status: number;

    response: any;

    constructor({ status, message, response }: Partial<ApiError>) {
        super(message);
        this.status = status || 1000;
        // this.message = message || 'Unknown error';
        this.response = response || {};
    }
}
