export interface EventProvider {
  emit<T>(eventListener: string, payload: T): void;
}
