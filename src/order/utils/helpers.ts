export const buildOrderNotFoundMessage = (ordersNotFound: string[]) => {
  return {
    messages: ordersNotFound.map(order => {
      return {
        orderNumber: order,
        error: {
          code: 'freight/order-not-found',
          detail: 'Order not found',
        },
      };
    }),
  };
};
