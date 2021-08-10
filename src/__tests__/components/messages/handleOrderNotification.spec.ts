import { mocked } from 'ts-jest/utils';

import HandleOrderNotification from '../../../components/orders/messages/handleOrderNotification';
import { OrderMapper } from '../../../components/orders/mappers/orderMapper';

jest.mock('../../../components/orders/mappers/orderMapper', () => ({
    OrderMapper: {
        mapMessageToOrder: jest.fn().mockReturnValue(true)
    },
}))


describe('Test Order Notification Consumer', () => {
    const MockedOrderMapper = mocked(OrderMapper, true);

    it('should call consumer of Order Notification, and handle with request - Success', async () => {
        const payload = await import('../../mocks/orderNotification.json')

        const spyOrderMapper = jest.spyOn(MockedOrderMapper, 'mapMessageToOrder');
        const result = await new HandleOrderNotification().execute(payload, () => true)

        expect(spyOrderMapper).toHaveBeenCalled()
        expect(result).toBeUndefined()
    });
});
