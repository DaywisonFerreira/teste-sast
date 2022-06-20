export interface ApiGateway {
  post<T = any>(payload): Promise<T>;
}
