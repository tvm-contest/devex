import { Interceptor, InterceptorInterface, Action } from 'routing-controllers';
import { Service } from 'typedi';
import { Response } from '../dtos/Response';

@Interceptor()
@Service()
export class ResponseInterceptor implements InterceptorInterface {
  intercept(action: Action, content: any) {
    if (action.response.headersSent) {
      return content;
    }

    if (content instanceof Error) {
      return Response.error(content);
    }

    return Response.ok(content);
  }
}
