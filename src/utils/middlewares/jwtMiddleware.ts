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

        const { tenants, email, sub } = jwtPayload.data;

        req['stores'] = tenants;
        req['email'] = email;
        req['userId'] = sub;

        next();
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
