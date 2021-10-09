import { Response, Next, helpers } from 'ihub-framework-ts';

import { IRequest } from '../../common/interfaces/request';
import { JWTUtils } from '../JwtUtils';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response, next: Next) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            return HttpHelper.clientError(res, 'Missing Header Authorization');
        }

        const jwtPayload = JWTUtils.decode(token);

        if (jwtPayload.hasError) {
            return HttpHelper.unauthorized(res, jwtPayload.error);
        }

        const { stores, email } = jwtPayload.data;

        req['stores'] = stores;
        req['email'] = email;

        next();
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
