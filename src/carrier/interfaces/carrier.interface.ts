export interface ICarrier {
  carrier: string;
  document: string;
  active: boolean;
  generateNotfisFile: boolean;
  integration: string;
  observation?: string;
  timeLimit?: string;
  createdAt?: number;
  updatedAt?: number;
}
