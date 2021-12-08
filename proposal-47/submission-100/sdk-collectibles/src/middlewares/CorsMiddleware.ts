import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import cors from 'cors';
import { Service } from 'typedi';
import { NextFunction, Request, Response } from 'express';

@Middleware({ type: 'before' })
@Service()
export class CorsMiddleware implements ExpressMiddlewareInterface {
  use(request: Request, response: Response, next: NextFunction): void {
    return cors()(request, response, next);
  }
}
