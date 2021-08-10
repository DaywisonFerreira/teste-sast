import { errors, models, common } from 'ihub-framework-ts';

import { Order } from '../../../components/orders/interfaces/Order';

import { OrderService } from '../../../components/orders/services/orderService';
import { orderNew } from './utils.jest';

const SORTABLE_FIELDS = [
    'orderCreatedAt', // default
    'orderId',
    'receiverName',
    'deliveryCompany',
    'orderUpdatedAt',
];

const paginationParams = {
    pageNumber: 1,
    perPage: 10,
    orderBy: 'updatedAt',
    orderDirection: 'asc',
    sortableFields: SORTABLE_FIELDS,
} as common.Types.PaginationParams;
const fields = Order.getPublicFields.reduce((current: any, item) => {
    current[item] = 1;
    return current;
}, {});

const projectionFields = { ...fields, _id: 0 };
const orderId = '60ecb4d5602b71002b3597aa';
const receiverName = 'José Silva';
const deliveryCompany = 'JADLOG';
const { BadRequestError } = errors;

describe('Unit Test - Order Service', () => {
    afterAll(async () => {
        const { Order } = models;
        await Promise.all([Order.deleteMany({})]);
    });

    beforeEach(async () => {
        const { Order } = models;
        await Promise.all([Order.deleteMany({})]);
        await Order.insertMany([
            orderNew(orderId, receiverName),
            orderNew('60ecb4d5602b71002b3597ab'),
            orderNew('60ecb4d5602b71002b3597ac'),
            orderNew('60ecb4d5602b71002b3597ad'),
        ]);
    });

    describe('List Orders', () => {
        it('should list orders by receiver name and delivery Company', async () => {
            const orderService = new OrderService();
            const filter = { receiverName: 'José', deliveryCompany: 'JADL' };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );
            const aux = paginatedResponse.data as any;
            expect(paginatedResponse.data.length).toBe(1);
            expect(aux[0].receiverName).toBe(receiverName);
            expect(aux[0].logisticInfo[0].deliveryCompany).toBe(
                deliveryCompany
            );
        });

        it('should validate if orderId is valid objectId', async () => {
            const orderService = new OrderService();
            const filter = { orderId: 'ashkdjahsdjksadsadshdsadsad' };

            await expect(async () => {
                await orderService.getList(
                    filter,
                    projectionFields,
                    { lean: true },
                    paginationParams
                );
            }).rejects.toThrow(new BadRequestError('Invalid Id'));
        });

        it('should list orders by orderId', async () => {
            const orderService = new OrderService();
            const filter = { orderId };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );
            const aux = paginatedResponse.data as any;

            expect(paginatedResponse.data.length).toBe(1);
            expect(String(aux[0].orderId)).toBe(orderId);
        });

        it('should list orders by orderCreatedAtFrom and orderCreatedAtTo', async () => {
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderCreatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderCreatedAtFrom: '2020-07-01',
                orderCreatedAtTo: '2020-07-02',
            };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );

            expect(paginatedResponse.data.length).toBe(1);
        });

        it('should list orders by orderCreatedAtFrom', async () => {
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderCreatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderCreatedAtFrom: '2020-07-01',
            };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );

            expect(paginatedResponse.data.length).toBe(1);
        });

        it('should should validate orderCreatedAtFrom and orderCreatedAtTo', async () => {
            const error = 'Date difference greater than 1 month';
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderCreatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderCreatedAtFrom: '2020-07-01',
                orderCreatedAtTo: '2020-08-02',
            };

            await expect(async () => {
                await orderService.getList(
                    filter,
                    projectionFields,
                    { lean: true },
                    paginationParams
                );
            }).rejects.toThrow(new BadRequestError(error));
        });

        it('should list orders by orderUpdatedAtFrom and orderUpdatedAtTo', async () => {
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderUpdatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderUpdatedAtFrom: '2020-07-01',
                orderUpdatedAtTo: '2020-07-02',
            };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );

            expect(paginatedResponse.data.length).toBe(1);
        });

        it('should list orders by orderUpdatedAtFrom', async () => {
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderUpdatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderUpdatedAtFrom: '2020-07-01',
            };
            const paginatedResponse = await orderService.getList(
                filter,
                projectionFields,
                { lean: true },
                paginationParams
            );

            expect(paginatedResponse.data.length).toBe(1);
        });

        it('should should validate orderUpdatedAtFrom and orderUpdatedAtTo', async () => {
            const error = 'Date difference greater than 1 month';
            const { Order } = models;
            const order = orderNew('60ecb4d5602b71002b3597ae');
            Object.assign(order, {
                orderUpdatedAt: new Date('2020-07-01'),
            });
            await Order.create(order);

            const orderService = new OrderService();
            const filter = {
                orderUpdatedAtFrom: '2020-07-01',
                orderUpdatedAtTo: '2020-08-02',
            };

            await expect(async () => {
                await orderService.getList(
                    filter,
                    projectionFields,
                    { lean: true },
                    paginationParams
                );
            }).rejects.toThrow(new BadRequestError(error));
        });
    });
});
