
interface AlertMessage {
    createdBy: string;
    storeId: string;
    logId: string;
    subject: string;
    key: string;
    message: string;
    storeCode?: string;
    status?: {};
    detail: [Record<string, unknown>];
}

export interface IhubLogger {
    silly(message: string, logId: string, meta?: object): void;
    /**
     * Debug logger level, for application development logs
     *
     * @param message
     * @param meta
     */
    debug(message: string, logId: string, meta?: object): void;
    /**
     * Verbose logger level, for application rules debug logs
     *
     * @param message
     * @param meta
     */
    verbose(message: string, logId: string, meta?: object): void;
    /**
     * Info logger level, for application rules logs
     *
     * @param message
     * @param meta
     */
    info(message: string, logId: string, meta?: object): void;
    /**
     * Warn logger level, for application rules exceptions logs
     *
     * @param message
     * @param meta
     */
    warn(message: string, logId: string, meta?: object): void;
    /**
     * Error logger level, for application rules error
     *
     * @param message
     * @param meta
     */
    error(
      message: string,
      logId: string,
      meta?: object,
      alertSystem?: AlertMessage
    ): void;
}
