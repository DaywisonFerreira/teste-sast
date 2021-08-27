import { RequestPrivate } from 'ihub-framework-ts';

export interface IRequest extends RequestPrivate {
    storeId: string | string[],
    email: string,
    config: any,
    stores: string[]
}
