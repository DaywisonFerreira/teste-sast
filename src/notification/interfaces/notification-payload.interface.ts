/* eslint-disable no-shadow */

export enum NotificationTypes {
  OrdersExport = 'orders.export',
  UploadFreightsError = 'upload.freights.error',
  UploadFreightsSuccess = 'upload.freights.success',
  IntegrationContractSucess = 'integration.contract.success',
  IntegrationContractError = 'integration.contract.error',
  ServerError = 'server.error',
}

export enum NotificationOrigins {
  System = 'system',
}

export interface INotificationPayload {
  origin: NotificationOrigins;
  type: NotificationTypes;
  payload?: unknown;
}
