import postIntelipost from '../../../components/orders/controllers/postIntelipost';
import payloadIntelipost from '../../mocks/payloadIntelipost.json';

const token = ' dGVzdGU6dGVzdGU=';

const mockRequest: any = {
    body: payloadIntelipost,
    headers: {
        authorization: token,
    },
};

const mockRequestAux: any = {
    body: {},
    headers: {
        authorization: token,
    },
};

const mockResponse: any = {
    status: (param: any) => {
        return {
            json: (param: any) => {
                return param;
            },
        };
    },
    json: (param: any) => {
        return param;
    },
};

describe('Unit Test - Courier Status and Orders ', () => {
    describe('Create Courier Status', () => {
        it('should create courier status and Orders', async () => {
            const postIntelipostResponse = await postIntelipost(
                mockRequest,
                mockResponse
            );
            expect(postIntelipostResponse).toBe('Created');
        });
        it('should not create courier status and Orders: erro token', async () => {
            const error = {
                message: 'Username or Password invalid',
            };
            const postIntelipostResponse = await postIntelipost(
                {
                    ...mockRequest,
                    headers: {
                        authorization: `${token}a`,
                    },
                },
                mockResponse
            );
            expect(postIntelipostResponse).toEqual(error);
        });

        it('should create courier status and Orders: internal error', async () => {
            const error = {
                code: 'tracking.get.courier.error',
                error: "Cannot read property 'invoice_number' of undefined",
                status: 500,
            };
            const postIntelipostResponse = await postIntelipost(
                mockRequestAux,
                mockResponse
            );
            expect(postIntelipostResponse).toEqual(error);
        });
    });
});