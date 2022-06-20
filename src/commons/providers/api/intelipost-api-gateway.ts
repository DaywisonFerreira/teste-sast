import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { Env } from '../../environment/env';
import { ApiGateway } from './api-gateway.interface';

export type IntelipostApiGatewayResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  config: {
    method: string;
    url: string;
    data: string;
  };
};

@Injectable()
export class IntelipostApiGateway implements ApiGateway {
  async post<T>(payload: any): Promise<T> {
    const apiKey = Env.INTELIPOST_SHIPMENT_ORDER_APIKEY;
    const platform = Env.INTELIPOST_SHIPMENT_ORDER_PLATFORM;
    const config: AxiosRequestConfig = {
      headers: {
        'APi-key': apiKey,
        platform,
      },
    };
    return axios
      .post(Env.INTELIPOST_SHIPMENT_ORDER_ENDPOINT, payload, config)
      .then(res => res)
      .catch(error => error.response);
  }
}
