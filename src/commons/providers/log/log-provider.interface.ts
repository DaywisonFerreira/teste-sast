export interface LogProvider {
  instanceLogger(context: string): void;
  log(data: any, headers?: any): void;
  error(error: Error): void;
  debug(data: any, headers?: any): void;
}
