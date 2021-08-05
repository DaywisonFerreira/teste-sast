import { Response } from 'ihub-framework-ts';

export class HttpHelper {

    static jsonResponse(
        res: Response, code: number, message: string
    ) {
        return res.status(code).json({ message })
    }

    static ok<T>(res: Response, dto?: T) {
        if (dto) {
            res.type('application/json');
            return res.status(200).json(dto);
        } else {
            return res.sendStatus(200);
        }
    }

    static created<T>(res: Response, dto?: T) {
        if (dto) {
            res.type('application/json');
            return res.status(201).json(dto);
        } else {
            return res.sendStatus(201);
        }
    }

    static clientError(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 400, message ? message : 'Unauthorized');
    }

    static unauthorized(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 401, message ? message : 'Unauthorized');
    }

    static paymentRequired(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 402, message ? message : 'Payment required');
    }

    static forbidden(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 403, message ? message : 'Forbidden');
    }

    static notFound(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 404, message ? message : 'Not found');
    }

    static conflict(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 409, message ? message : 'Conflict');
    }

    static tooMany(res: Response, message?: string) {
        return HttpHelper.jsonResponse(res, 429, message ? message : 'Too many requests');
    }

    static todo(res: Response) {
        return HttpHelper.jsonResponse(res, 400, 'TODO');
    }

    static fail(res: Response, error: Error | string) {
        return res.status(500).json({
            message: error.toString()
        })
    }
}
