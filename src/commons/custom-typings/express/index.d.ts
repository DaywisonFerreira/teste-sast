declare namespace Express {
  interface Request {
    stores: string[];
    email: string;
    storeId: string | string[];
    userId: string;
    config: any;
  }
}
