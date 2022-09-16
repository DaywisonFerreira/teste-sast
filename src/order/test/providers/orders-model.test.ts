import { ordersEntityMock } from '../mocks/orders-entity.mock';
// import { ordersUpdatedMock } from '../mocks/orders-update.mock';

export class OrdersModelMock {
  static result = ordersEntityMock;

  // static updated = GetOrderDto.factory(ordersUpdatedMock) as GetOrderDto;

  static exec = jest.fn().mockResolvedValue(OrdersModelMock.result);

  static execList = jest.fn().mockResolvedValue([OrdersModelMock.result]);

  save = jest.fn().mockReturnValue({
    toJSON: jest.fn().mockResolvedValue(OrdersModelMock.result),
  });

  static find = jest.fn().mockReturnValue({
    exec: OrdersModelMock.execList,
    limit: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: OrdersModelMock.execList,
        }),
      }),
    }),
  });

  static findOne = jest.fn().mockReturnValue({
    lean: OrdersModelMock.exec,
  });

  // static findOneAndUpdate = jest.fn().mockReturnValue({
  //   lean: jest.fn().mockReturnValue({
  //     exec: jest.fn().mockResolvedValue(OrdersModelMock.updated),
  //   }),
  // });

  static countDocuments = jest.fn().mockResolvedValue(1);
}
