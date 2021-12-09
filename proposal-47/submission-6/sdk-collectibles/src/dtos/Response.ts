export class Response {
  public success: boolean;
  public data?: unknown;
  public error?: Error;

  constructor(success: boolean, data?: unknown, error?: Error) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  public static ok(data: unknown) {
    return new Response(true, data);
  }

  public static error(error: Error) {
    return new Response(true, undefined, error);
  }
}
