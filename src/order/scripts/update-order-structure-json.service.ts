/* eslint-disable no-plusplus */
/* eslint-disable default-case */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jjv from 'jjv';
import { chunkArray } from 'src/commons/utils/array.utils';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { newOrderSchema } from './schemas';

@Injectable()
export class UpdateStructureOrder {
  private readonly logger = new Logger(UpdateStructureOrder.name);

  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
  ) {}

  async updateStructureOrders() {
    const count = await this.OrderModel.countDocuments();

    const size = 2000;
    const pages = Math.ceil(count / size);

    this.logger.log(`TOTAL: ${count}`);
    const jsonSchema = jjv();
    jsonSchema.addSchema('order', newOrderSchema);

    for (let index = 0; index < pages; index++) {
      // eslint-disable-next-line no-await-in-loop
      const orders = await this.OrderModel.find()
        .limit(size)
        .skip(index * size);

      this.logger.log(
        `Updating ${orders.length} records, part ${index + 1}/${pages}`,
      );

      const chunkOrders = chunkArray(orders, size);
      // eslint-disable-next-line no-await-in-loop
      for await (const orders of chunkOrders) {
        await Promise.all(
          orders.map(order => this.validateOrder(order, jsonSchema)),
        );
      }
      this.logger.log(
        `Finish ${orders.length} records, part ${index + 1}/${pages}`,
      );
    }
  }

  private async validateOrder(
    order: OrderEntity,
    jsonSchema: jjv.Env,
  ): Promise<void> {
    const errors = jsonSchema.validate('order', order.toJSON());

    if (!errors) {
      this.logger.log('Order has been validated.');
    } else {
      await this.checkAndUpdateOrder(order, errors);
    }
  }

  private async checkAndUpdateOrder(
    order: OrderEntity,
    errors: jjv.Errors,
  ): Promise<void> {
    const { validation } = errors;
    const missingData: Partial<OrderEntity> = {};

    Object.keys(validation).forEach(error => {
      switch (error) {
        case 'invoice':
          if (order.billingData && order.billingData.length > 0) {
            const billingData = order.billingData[0];
            missingData.invoice = {
              serie: billingData.invoiceSerialNumber ?? '',
              value: billingData.invoiceValue ?? 0,
              number: billingData.invoiceNumber ?? '',
              key: billingData.invoiceKey ?? '',
              issuanceDate: billingData.issuanceDate ?? new Date(),
              carrierName: billingData.carrierName ?? '',
              trackingNumber: billingData.trackingNumber ?? '',
              trackingUrl: billingData.trackingUrl ?? '',
              items: billingData.items.map((item: any) => {
                return {
                  sku: item.sku,
                  quantity: item.quantity,
                  price: item.price,
                  isSubsidized: item.isSubsidized,
                };
              }),
            };
          }
          break;
        case 'customer': {
          let document = '';
          if (order.billingData && order.billingData.length > 0) {
            document = order.billingData[0].customerDocument;
          }
          missingData.customer = {
            phones: order.receiverPhones
              ? order.receiverPhones.map(phone => phone)
              : [],
            email: order.receiverEmail ?? '',
            isCorporate: false,
            firstName: order.receiverName
              ? order.receiverName.split(' ')[0]
              : '',
            lastName: order.receiverName
              ? order.receiverName.split(' ')[1]
              : '',
            document,
            documentType: 'cpf',
            corporateName: null,
            fullName: order.receiverName ?? '',
          };
          break;
        }
        case 'delivery':
          missingData.delivery = {
            receiverName: order.receiverName ?? '',
            city: order.deliveryCity ?? '',
            state: order.deliveryState ?? '',
            zipCode: order.deliveryZipCode ?? '',
            country: 'Brasil',
          };
          break;
        case 'statusCode':
          missingData.statusCode = this.getStatusCode(
            order.lastOccurrenceMicro,
            order.status,
          );
          break;
      }
    });

    if (!this.isEmpty(missingData)) {
      await this.OrderModel.findOneAndUpdate({ _id: order._id }, missingData, {
        useFindAndModify: false,
      });
    }
  }

  private isEmpty(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  private getStatusCode(status: string, stat: string) {
    type statusCodeMapper = {
      source: string[];
      micro: string;
      macro: string;
    };

    if (stat === 'delivered' && !status) {
      return { micro: 'delivered-success', macro: 'delivered' };
    }

    if (stat === 'dispatched' && !status) {
      return { micro: 'dispatched', macro: 'order-dispatched' };
    }

    const addressError: statusCodeMapper = {
      source: [
        'ENDERECO INCORRETO',
        'ENDEREÇO INCORRETO',
        'ENDEREÇO VALIDADO',
        'ENDERECO VALIDADO',
      ],
      micro: 'address-error',
      macro: 'delivery-failed', // !confirmar
    };

    const addressNotFound: statusCodeMapper = {
      source: [
        'FALTA BLOCO DO EDIFICIO / SALA',
        'FALTA NOME DE CONTATO / DEPARTAMENTO / RAMAL',
        'NUMERO INDICADO NÃO LOCALIZADO',
        'ENDEREÇO NÃO LOCALIZADO',
        'ENDERECO INVALIDO',
        'ENDEREÇO INSUFICIENTE',
        'DESTINATÁRIO NÃO LOCALIZADO',
        'ENDEREÇO INSUFICIENTE',
        'DESTINATÁRIO NÃO LOCALIZADO',
      ],
      micro: 'address-not-found',
      macro: 'delivery-failed', // !confirmar
    };

    const awayCustomer: statusCodeMapper = {
      source: [
        'CLIENTE AUSENTE/ ESTABELECIMENTO FECHADO',
        'DESTINATARIO AUSENTE',
        'DESTINATÁRIO AUSENTE',
        'ESTABELECIMENTO FECHADO',
        'ESTABELECIMENTO FECHADO',
        'DESTINATÁRIO FALECEU/FALIU',
      ],
      micro: 'away-customer',
      macro: 'delivery-failed',
    };

    const carrierPossession: statusCodeMapper = {
      source: [
        'VOLUME CONFERIDO',
        'Correção informação evento',
        'PROCESSAMENTO NA FILIAL',
        'CUSTODIA',
        'Evento Intelipost de PI',
        'CLARIFY_DELIVERY_LATE',
        'BUSCA',
        'PICKUP_DATA_UPDATED',
        'PICKUP_DATA_RECEIVED',
        'RMA EXECUTADO',
        'RMA RECEBIDO NO CD',
        'COLETA RECEBIDA COM NC NO CD DE',
        'AGUARDANDO CUBAGEM',
        'COLETA RECEBIDA NO CD',
        'EM AGENDAMENTO',
        'PERDA DE EMBARQUE POR HORÁRIO DE CORTE',
        'Pedido Reenviado',
        'PROBLEMAS PROCESSAMENTO RESPONDIDO/RESOLVIDO',
        'PROBLEMAS PROCESSAMENTO DA ENCOMENDA',
        'ATRASO TRANSPORTADOR',
        'CARGA REDESPACHADA',
        'COLETA REALIZADA',
        'ENTRADA FILIAL',
        'ENTRADA FILIAL DESTINO',
        'PROCESSAMENTO NA FILIAL',
        'PEDIDO EM SEPARAÇÃO NO CD',
        'RECALCULO DE PRAZO',
        'Aguardando Postagem',
        'ENTRADA FILIAL',
        'PROCESSAMENTO NA FILIAL',
        'SAIDA FILIAL',
        'REENTREGA SOLICITADA',
        'ENTREGA AGENDADA',
        'ENTRADA FILIAL DESTINO',
        'Reenviar - Tentativa cega',
        'Reenviar - Novo autorizado',
        'Reenviar - Novo ponto de referência',
        'Reenviar - Conforme agendamento',
        'Entrega na filial destino',
        'Reenviar - Agendamento solicitado pelo Canal/Cliente',
        'COLETA REALIZADA EMB',
        'ENTRADA EM ATRASO',
        'PACOTE NÃO RETIRADO',
        'ETIQUETA CRIADA',
        'NÃO CONFERIDO',
        'AREA DIFERENCIADA',
        'MANTER STATUS ANTERIOR',
        'EM PROCESSO DE INVESTIGAÇÃO',
        'PRONTO PARA DESPACHO',
        'COLETA CHEGANDO EMB',
        'REENTREGA SOLICITADA',
        'TROCA DE TRANSPORTADORA',
        'AGENDAMENTO',
        'KEEP_PREVIOUS EMB',
        'AUSÊNCIA DE ATUALIZAÇÃO',
        'CLARIFY_DELIVERY_LATE',
        'ENTREGA AGENDADA',
        'SOLICITACAO ENTREGA POSTERIOR',
        'RESTRICAO DE ACESSO EXTRAORDINARIA',
      ],
      micro: 'carrier-possession',
      macro: 'in-transit',
    };

    const created: statusCodeMapper = {
      source: [
        'VOLUME NÃO COLETADO',
        'CRIADO',
        'Aguardando Seller',
        'EM PRODUÇÃO',
        'FATURADO PARCIALMENTE',
        'PEDIDO FATURADO',
        'PRODUTO NO CD',
        'PEDIDO FATURADO',
        'PEDIDO EM SEPARAÇÃO NO CD',
        'Aprovação Financeira',
        'Em Separação',
        'Faturado',
        'Faturado Parcialmente',
        'PRODUTO NO CD',
        '24H_EXPIRACAO_DO_PACOTE',
        'A Coletar',
        'Coletando',
        'Primeira Tentativa de Coleta',
        'Segunda Tentativa de Coleta',
      ],
      micro: 'created',
      macro: 'order-created',
    };

    const customerRefused: statusCodeMapper = {
      source: [
        'CANCELADO PELO DESTINATARIO',
        'RECUSADO POR TERCEIROS',
        'RECUSA - FALTA DE COMPRA',
        'RECUSADA - AVARIA DA MERCADORIA / EMBALAGEM',
        'RECUSADA MERCADORIA EM DESACORDO',
        'CARGA RECUSADA PELO DESTINATARIO',
        'CARGA RECUSADA PELO DESTINATARIO',
      ],
      micro: 'customer-refused',
      macro: 'delivery-failed',
    };

    const damage: statusCodeMapper = {
      source: [
        'AVARIA PARCIAL CONFIRMADA',
        'AVARIA CONFIRMADA',
        'AVARIA PARCIAL',
        'AVARIA CONFIRMADA',
      ],
      micro: 'damage',
      macro: 'delivery-failed',
    };

    const deliveredSuccess: statusCodeMapper = {
      source: [
        'ENTREGUE NO DESTINO',
        'ENTREGUE NO DESTINO',
        'ENTREGUE',
        'ENTREGUE FORA DO DESTINO',
        'ENTREGUE',
        'DELIVERED EMB',
      ],
      micro: 'delivered-success',
      macro: 'delivered',
    };

    const deliveryRoute: statusCodeMapper = {
      source: ['RETIRADO', 'EM ROTA DE ENTREGA', 'SAIU PARA ENTREGA'],
      micro: 'delivery-route',
      macro: 'out-for-delivery',
    };

    const dispatched: statusCodeMapper = {
      source: [
        'ARQUIVO RECEBIDO',
        'Expedido',
        'EMISSAO do CT-e / NFS-e',
        'COLETA CHEGANDO',
        'EMISSAO do CT-e / NFS-e',
        'DESPACHADO ',
        'DESPACHADO',
      ],
      micro: 'dispatched',
      macro: 'order-dispatched',
    };

    const firstDeliveryFailed: statusCodeMapper = {
      source: [
        'NAO VISITADO',
        'FÉRIAS COLETIVAS',
        'PRODUTO NAO DISPONIVEL PARA COLETA',
        'TENTATIVA DE ENTREGA',
        'DESTINATARIO DEMITIDO',
        'ESPERA SUPERIOR A 20 MINUTOS',
        'NÃO VISITADO',
        'NÃO VISITADO',
        'AVERIGUAR FALHA NA ENTREGA',
        'NÃO VISITADO',
        'PROBLEMAS PAGAMENTO DE FRETE',
        'FALHA NA ENTREGA',
        'Em tratativa - Falha no primeiro contato',
        'Em tratativa - Aguardando atualização do transportador',
        'Em tratativa - Aguardando retorno da TIM',
        'Em tratativa - Aguardando retorno do canal',
        'AGUARDANDO DADOS',
        'DIFICIL ACESSO',
        'FERIADO',
        'SOLICITACAO ENTREGA POSTERIOR',
        'RETIRADA RECUSADA',
        'ENTREGA EFETUADA ERRADA',
        'DESTINATÁRIO FALECEU/FALIU',
        'AGUARDANDO INSTRUÇÃO',
        'FECHADO',
        'AGUARDANDO INSTRUÇÃO',
        'AGUARDANDO DADOS',
        'CORRECAO INFORMACAO DE EVENTO',
        'AVERIGUAR FALHA NA ENTREGA',
        'FALHA NA ENTREGA',
        'DIFICIL ACESSO',
        'FERIADO',
        'DESTINATÁRIO MUDOU-SE',
        'ENTREGA EFETUADA ERRADA',
        'BLOQUEADO PELO REMETENTE',
      ],
      micro: 'first-delivery-failed',
      macro: 'delivery-failed',
    };

    const hubTransfer: statusCodeMapper = {
      source: [
        'EM TRANSFERENCIA',
        'EM TRÂNSITO',
        'COLETA CHEGANDO',
        'CARGA REDESPACHADA',
        'EM TRANSFERENCIA',
        'EM TRÂNSITO',
        'SAIDA FILIAL',
        'Coleta Transferida',
      ],
      micro: 'hub-transfer',
      macro: 'in-transit',
    };

    const operationProblem: statusCodeMapper = {
      source: [
        'VOLUME RECUSADO',
        'EM ANALISE',
        'ENTREGA TEMPORARIAMENTE CANCELADA',
        'CORTE DE CARGA - EXCESSO DE CARGA / PESO',
        'VEÍCULO QUEBRADO',
        'REVERSA CANCELADA',
        'Carga Danificada',
        'Violado',
        'COLETA REVERSA  NÃO SOLICITADA',
        'COLETA REVERSA NÃO SOLICITADA',
        'ORDEM DE COLETA CANCELADA',
        'COLETA REALIZADA C/ NÃO CONFORMIDADE',
        'PEDIDO DE INVESTIGAÇÃO - ABERTO',
        'PEDIDO DE INVESTIGAÇÃO - COLETA DIVERGENTE',
        'SERVIÇO NÃO ATENDIDO',
        'EMBALAGEM EM ANALISE',
        'VEICULO ENTREGADOR AVARIADO',
        'Problemas Climáticos',
        'CT-e substituído',
        'CT-e cancelado',
        'CARGA ERRADA',
        'Código de autorização expirado',
        'Reversa Cancelada',
        'CARGA VENCIDA',
        'PACOTE NÃO ENCONTRADO',
        'DUPLICIDADE DE CARGA',
        'FATORES NATURAIS',
        'PROBLEMA OPERACIONAL',
        'CARGA INCOMPLETA',
        'CARGA DESCARTADA',
        'FALHA NA CRIAÇAO DA ETIQUETA',
        'PROBLEMA NA POSTAGEM',
        'CARGA TRAVADA',
        'CARGA RECUSADA PELA TRANSPORTADORA',
        'GREVE GERAL',
        'DELIVERY_FAILED EMB',
        'CARGA DESCARTADA',
        'COLETA INCOMPLETA',
        'Em análise EMB',
        'CANCELADO',
        'CARGA VENCIDA',
        'DUPLICIDADE DE CARGA',
        'FATORES NATURAIS',
        'Coleta Cancelada',
        'shipment order modified',
        'CARGA ERRADA',
        'PROBLEMA OPERACIONAL',
        'CARGA INCOMPLETA',
        'PROBLEMA NA POSTAGEM',
        'CARGA TRAVADA',
      ],
      micro: 'operational-problem',
      macro: 'delivery-failed',
    };

    const shippmentLoss: statusCodeMapper = {
      source: [
        'SINISTRO CONFIRMADO',
        'EM PROCESSO INDENIZAÇÃO',
        'PEDIDO INDENIZACAO',
        'indenizado',
        'INDENIZACAO PARCIAL',
        'INDENIZACAO RECUSADA',
        'INDENIZACAO TOTAL',
        'EXTRAVIO POR DIVERGÊNCIA DE COLETA',
        'EXTRAVIO DE MERCADORIA EM TRANSITO',
        'ACAREAÇÃO SEM SUCESSO – MERCADORIA EXTRAVIADA',
        'EXTRAVIO / AGENTE',
        'EXTRAVIO / COURIER OU MOTORISTA',
        'EXTRAVIO / TRANSFERÊNCIA AEREA',
        'EXTRAVIO / TRANSFERÊNCIA RODOVIARIA',
        'SINISTRO LIQUIDADO',
        'EXTRAVIO CONFIRMADO',
        'EXTRAVIO EMBARCADOR EMB',
        'EXTRAVIO CONFIRMADO',
        'EXTRAVIO PARCIAL',
      ],
      micro: 'shippment-loss',
      macro: 'delivery-failed',
    };

    const shippmentReturned: statusCodeMapper = {
      source: [
        'DEVOLVIDO PELOS CORREIOS',
        'DEVOLVIDO',
        'DEVOLVIDO',
        'Mercadoria devolvida',
        'DEVOLVIDO ORIGEM',
      ],
      micro: 'shippment-returned',
      macro: 'delivery-failed',
    };

    const shippmentReturning: statusCodeMapper = {
      source: [
        'Entrega suspensa/bloqueada',
        'DEVOLUÇÃO AUTORIZADA',
        'EM DEVOLUÇÃO',
        'DEVOLUCAO - EM TRANSITO',
        'DEVOLUCAO - SAIDA FILIAL',
        'DEVOLUCAO - ENTRADA FILIAL',
        'DEVOLUCAO - ENTRADA FILIAL DESTINO',
        'DEVOLUCAO - SAIDA FILIAL DESTINO',
        'Nota de retorno emitida',
        'Devolver - Cancelado',
        'Devolver - Endereço não localizado',
        'Devolver - Duplicidade de carga',
        'Devolver - Carga errada',
        'Devolver - Estabelecimento fechado',
        'Devolver - Carga incompleta',
        'Devolver - Destinatário faleceu/faliu',
        'Devolver - Destinatário ausente',
        'Devolver - Destinatário sem identificação',
        'Devolver - Dificil acesso',
        'Devolver - Destinatário mudou-se',
        'Devolver - Carga recusada pela transportadora',
        'Devolver - Área não atendida',
        'Devolver - Carga recusada pelo destinatário',
        'Devolver - Destinatário desconhecido',
        'Devolver - Destinatário não localizado',
        'Devolver - Endereço insuficiente',
        'Devolver - Área diferenciada',
        'Devolver - Bloqueado pelo remetente',
        'Aguardando criação de NF de retorno',
        'EM DEVOLUÇÃO',
        'BLOQUEADO PELO REMETENTE',
        'DEVOLUÇÃO RECUSADA PELO REMETENTE        ',
        'DEVOLUÇÃO RECUSADA PELO REMETENTE',
      ],
      micro: 'shippment-returning',
      macro: 'in-transit',
    };

    const shippmentStolen: statusCodeMapper = {
      source: [
        'EXTRAVIO / ROUBO - TRANSPORTADORAS',
        'EXTRAVIO / ROUBO - ECT',
        'ROUBO CONFIRMADO',
        'ROUBO',
      ],
      micro: 'shippment-stolen',
      macro: 'delivery-failed',
    };

    const taxStop: statusCodeMapper = {
      source: [
        'PARADO NA FISCALIZACAO',
        'CT-e para recolhimento de imposto complementar',
        'Mercadoria retida/liberada por Fiscalização',
        'ANÁLISE FISCAL',
        'ANALISE FISCAL',
      ],
      micro: 'tax-stop',
      macro: 'delivery-failed',
    };

    const unknownCustomer: statusCodeMapper = {
      source: [
        'DESTINATÁRIO MUDOU-SE',
        'DESTINATARIO SEM IDENTIFICACAO',
        'DESTINATÁRIO DESCONHECIDO',
        'DESTINATÁRIO SEM IDENTIFICAÇÃO',
        'DESTINATARIO DESCONHECIDO',
      ],
      micro: 'unknown-customer',
      macro: 'delivery-failed',
    };

    const waitingPostOfficePickup: statusCodeMapper = {
      source: [
        'ENTREGUE NO LOCAL DE RETIRADA',
        'PRONTO PARA RETIRADA',
        'NÃO FOI POSSÍVEL ENTREGAR. AGUARDANDO RETIRADA',
        'NAO FOI POSSIVEL ENTREGAR. AGUARDANDO RETIRADA',
      ],
      micro: 'waiting-post-office-pickup',
      macro: 'delivery-failed',
    };

    const zipCodeNotServiced: statusCodeMapper = {
      source: [
        'CIDADE NAO ATENDIDA',
        'CIDADE NÃO ATENDIDA',
        'CONFLITO CEP/LOCALIDADE',
        'AREA NAO ATENDIDA',
        'ÁREA NÃO ATENDIDA',
      ],
      micro: 'zip-code-not-serviced',
      macro: 'delivery-failed',
    };

    if (addressError.source.includes(status)) {
      return { micro: addressError.micro, macro: addressError.macro };
    }

    if (zipCodeNotServiced.source.includes(status)) {
      return {
        micro: zipCodeNotServiced.micro,
        macro: zipCodeNotServiced.macro,
      };
    }

    if (waitingPostOfficePickup.source.includes(status)) {
      return {
        micro: waitingPostOfficePickup.micro,
        macro: waitingPostOfficePickup.macro,
      };
    }

    if (unknownCustomer.source.includes(status)) {
      return { micro: unknownCustomer.micro, macro: unknownCustomer.macro };
    }

    if (taxStop.source.includes(status)) {
      return { micro: taxStop.micro, macro: taxStop.macro };
    }

    if (shippmentStolen.source.includes(status)) {
      return { micro: shippmentStolen.micro, macro: shippmentStolen.macro };
    }

    if (shippmentReturning.source.includes(status)) {
      return {
        micro: shippmentReturning.micro,
        macro: shippmentReturning.macro,
      };
    }

    if (shippmentReturned.source.includes(status)) {
      return { micro: shippmentReturned.micro, macro: shippmentReturned.macro };
    }

    if (shippmentLoss.source.includes(status)) {
      return { micro: shippmentLoss.micro, macro: shippmentLoss.macro };
    }

    if (operationProblem.source.includes(status)) {
      return { micro: operationProblem.micro, macro: operationProblem.macro };
    }

    if (hubTransfer.source.includes(status)) {
      return { micro: hubTransfer.micro, macro: hubTransfer.macro };
    }

    if (firstDeliveryFailed.source.includes(status)) {
      return {
        micro: firstDeliveryFailed.micro,
        macro: firstDeliveryFailed.macro,
      };
    }

    if (dispatched.source.includes(status)) {
      return { micro: dispatched.micro, macro: dispatched.macro };
    }

    if (deliveryRoute.source.includes(status)) {
      return { micro: deliveryRoute.micro, macro: deliveryRoute.macro };
    }

    if (deliveredSuccess.source.includes(status)) {
      return { micro: deliveredSuccess.micro, macro: deliveredSuccess.macro };
    }

    if (damage.source.includes(status)) {
      return { micro: damage.micro, macro: damage.macro };
    }

    if (customerRefused.source.includes(status)) {
      return { micro: customerRefused.micro, macro: customerRefused.macro };
    }

    if (created.source.includes(status)) {
      return { micro: created.micro, macro: created.macro };
    }

    if (carrierPossession.source.includes(status)) {
      return { micro: carrierPossession.micro, macro: carrierPossession.macro };
    }

    if (awayCustomer.source.includes(status)) {
      return { micro: awayCustomer.micro, macro: awayCustomer.macro };
    }

    if (addressNotFound.source.includes(status)) {
      return { micro: addressNotFound.micro, macro: addressNotFound.macro };
    }

    return { micro: '', macro: '' };
  }
}
