/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-plusplus */
/* eslint-disable default-case */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jjv from 'jjv';
import { chunkArray } from 'src/commons/utils/array.utils';
import { isBefore } from 'date-fns';
import { OrderDocument, OrderEntity } from '../schemas/order.schema';
import { newOrderSchema } from './schemas/schemaOrderRootRequired';

@Injectable()
export class UpdateStructureOrder {
  private readonly logger = new Logger(UpdateStructureOrder.name);

  constructor(
    @InjectModel(OrderEntity.name)
    private OrderModel: Model<OrderDocument>,
  ) {}

  async updateStructureOrders() {
    const ordersToMigrateFilter = {
      // 'statusCode.macro': '',
      statusCode: null,
    };
    const count = await this.OrderModel.countDocuments(ordersToMigrateFilter);

    const size = 2000;
    const pages = Math.ceil(count / size);

    const jsonSchema = jjv();
    jsonSchema.addSchema('order', newOrderSchema);

    this.logger.log(`TOTAL: ${count}`);

    const result = { success: 0, errors: 0 };

    for (let index = 0; index < pages; index++) {
      // eslint-disable-next-line no-await-in-loop
      const orders = await this.OrderModel.find(ordersToMigrateFilter)
        .limit(size)
        .skip(index * size);

      this.logger.log(
        `Start ${orders.length} records, part ${index + 1}/${pages}`,
      );

      const chunkOrders = chunkArray(orders, size / 10);
      // eslint-disable-next-line no-await-in-loop
      for await (const orders of chunkOrders) {
        await Promise.all(
          orders.map(async order => {
            const validation = await this.validateOrder(
              order.toJSON(),
              jsonSchema,
            );
            if (validation) {
              result.success++;
            } else {
              result.errors++;
            }
          }),
        );
      }
      this.logger.log(
        `Finish part ${index + 1}/${pages} with totals: ${
          result.success
        } updated, ${result.errors} already updated`,
      );
    }
  }

  private async validateOrder(
    order: OrderEntity,
    jsonSchema: jjv.Env,
  ): Promise<boolean> {
    const errors = jsonSchema.validate('order', order, {
      checkRequired: true,
    });

    if (!errors) {
      return false;
    }
    return this.checkAndUpdateOrder(order, errors);
  }

  private async checkAndUpdateOrder(
    order: OrderEntity,
    errors: jjv.Errors,
  ): Promise<boolean> {
    const { validation } = errors;
    const missingData: Partial<OrderEntity> = {};
    let document = '';

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
                  isSubsidized: item.isSubsidized ?? false,
                };
              }),
            };
          } else {
            missingData.invoice = {
              serie: '',
              value: 0,
              number: '',
              key: '',
              // @ts-ignore
              issuanceDate: '',
              carrierName: '',
              trackingNumber: '',
              trackingUrl: '',
              items: [
                {
                  sku: '',
                  quantity: 0,
                  price: 0,
                  isSubsidized: false,
                },
              ],
            };
          }
          break;
        case 'customer':
          if (order.billingData && order.billingData.length > 0) {
            document = order.billingData[0].customerDocument || '';
          }
          missingData.customer = {
            phones: order.receiverPhones
              ? order.receiverPhones.map(phone => ({
                  phone: `${phone.phone}`,
                  type: phone.type,
                }))
              : [{ phone: '', type: '' }],
            email: order.receiverEmail ?? '',
            isCorporate: false,
            firstName: order.receiverName
              ? order.receiverName.split(' ')[0]
              : '',
            lastName: order.receiverName
              ? order.receiverName.split(' ')[1]
                ? order.receiverName.split(' ')[1]
                : ''
              : '',
            document,
            documentType: 'cpf',
            corporateName: '',
            fullName: order.receiverName ?? '',
          };
          break;
        case 'delivery':
          missingData.delivery = {
            receiverName: order.receiverName ?? '',
            city: order.deliveryCity ?? '',
            state: order.deliveryState ?? '',
            zipCode: order.deliveryZipCode ?? '',
            country: 'BRA',
          };
          break;
        case 'statusCode':
          missingData.statusCode = this.getStatusCode(
            order.lastOccurrenceMicro,
            order.status,
          );
          break;
        case 'history':
          if (order?.history && order?.history.length > 0) {
            missingData.history = order.history.map(item => ({
              ...item,
              statusCode: this.getStatusCode(
                item?.lastOccurrenceMicro,
                order?.status,
              ),
            }));
          } else {
            missingData.history = [
              {
                volumeNumber: order.volumeNumber ? order.volumeNumber : 0,
                // @ts-ignore
                dispatchDate: order.dispatchDate ?? '',
                // @ts-ignore
                estimateDeliveryDateDeliveryCompany:
                  order.estimateDeliveryDateDeliveryCompany ?? '',
                partnerMessage: order.partnerMessage ?? '',
                microStatus: order.microStatus ?? '',
                lastOccurrenceMacro: order.lastOccurrenceMacro ?? '',
                lastOccurrenceMicro: order.lastOccurrenceMicro ?? '',
                lastOccurrenceMessage: order.lastOccurrenceMessage ?? '',
                partnerStatusId: order.partnerStatusId ?? '',
                partnerStatus: order.partnerStatus ?? '',
                statusCode: this.getStatusCode(
                  order?.lastOccurrenceMicro,
                  order?.status,
                ),
                // @ts-ignore
                orderUpdatedAt: order.orderUpdatedAt ?? '',
                i18n: order.i18n ?? '',
              },
            ];
          }
          break;
        case 'totals':
          if (order?.totals && order?.totals.length > 0) {
            missingData.totals = order.totals;
          } else {
            missingData.totals = [
              {
                id: 'Items',
                name: 'Total dos Itens',
                value: 0,
              },
              {
                id: 'Discounts',
                name: 'Total dos Descontos',
                value: 0,
              },
              {
                id: 'Shipping',
                name: 'Total do Frete',
                value: 0,
              },
            ];
          }
          break;
      }
    });

    if (!this.isEmpty(missingData)) {
      try {
        await this.OrderModel.findOneAndUpdate(
          { _id: order._id },
          missingData,
          {
            useFindAndModify: false,
          },
        );
        return true;
      } catch (error) {
        this.logger.error(error);
        if (error.message.includes('E11000')) {
          const resultToMerge = await this.OrderModel.find({
            orderSale: order.orderSale,
          });
          const result = this.handleDuplicateKeys(resultToMerge);
          await this.OrderModel.deleteMany({ _id: { $in: result.toDelete } });

          await this.OrderModel.findOneAndUpdate(
            { _id: result.toSave._id },
            result.toSave,
            {
              useFindAndModify: false,
            },
          );
        }
        return true;
      }
    } else {
      return false;
    }
  }

  private isEmpty(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  private getStatusCode(status: string, stat?: string) {
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

    if (stat === 'invoiced' && !status) {
      return { micro: 'invoiced', macro: 'order-created' };
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
        'Objeto recebido na unidade de distribuição',
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
        'CLIENTE ALEGA FALTA DE MERCADORIA',
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
        'ENTREGUE NO DESTINO 3',
        'ENTREGUE',
        'ENTREGUE FORA DO DESTINO',
        'Objeto entregue na Caixa de Correios Inteligente',
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
        'MERCADORIA EM DEVOLUCAO EM OUTRA OPERACAO',
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

  private handleDuplicateKeys(duplicateValues: Partial<OrderEntity>[]) {
    const [firstCreated] = duplicateValues.sort((a: any, b: any): any => {
      let dateOne = a.createdAt;
      let dateTwo = b.createdAt;
      if (typeof a.createdAt === 'string') {
        dateOne = new Date(a.createdAt);
      }

      if (typeof b.createdAt === 'string') {
        dateTwo = new Date(b.createdAt);
      }
      if (isBefore(dateOne, dateTwo)) {
        return -1;
      }
      return 1;
    });

    const [lastUpdated, ...rest] = duplicateValues.sort(
      (a: any, b: any): any => {
        let dateOne = a.orderUpdatedAt;
        let dateTwo = b.orderUpdatedAt;
        if (typeof a.orderUpdatedAt === 'string') {
          dateOne = new Date(a.orderUpdatedAt);
        }

        if (typeof b.orderUpdatedAt === 'string') {
          dateTwo = new Date(b.orderUpdatedAt);
        }
        if (isBefore(dateOne, dateTwo)) {
          return 1;
        }
        return -1;
      },
    );

    const { orderCreatedAt } = firstCreated;

    const historyToMerge = [];

    duplicateValues.forEach(order => {
      order.history.forEach(history => {
        const resultWithStatusCode = {
          ...history,
          statusCode: this.getStatusCode(history?.lastOccurrenceMicro),
        };
        historyToMerge.push(resultWithStatusCode);
      });
    });

    const sortHistory = historyToMerge.sort((a: any, b: any): any => {
      let dateOne = a.orderUpdatedAt;
      let dateTwo = b.orderUpdatedAt;
      if (typeof a.orderUpdatedAt === 'string') {
        dateOne = new Date(a.orderUpdatedAt);
      }

      if (typeof b.orderUpdatedAt === 'string') {
        dateTwo = new Date(b.orderUpdatedAt);
      }
      if (isBefore(new Date(dateOne), new Date(dateTwo))) {
        return -1;
      }
      return 1;
    });

    let result = {} as any;

    rest.forEach(item => {
      result = { ...item.toJSON() };
    });

    result = Object.assign(result, lastUpdated.toJSON());

    let invoice;
    let document;
    if (result.billingData && result.billingData.length > 0) {
      invoice = {
        serie: result.billingData[0].invoiceSerialNumber ?? '',
        value: result.billingData[0].invoiceValue ?? 0,
        number: result.billingData[0].invoiceNumber ?? '',
        key: result.billingData[0].invoiceKey ?? '',
        issuanceDate: result.billingData[0].issuanceDate ?? new Date(),
        carrierName: result.billingData[0].carrierName ?? '',
        trackingNumber: result.billingData[0].trackingNumber ?? '',
        trackingUrl: result.billingData[0].trackingUrl ?? '',
        items: result.billingData[0].items.map((item: any) => {
          return {
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            isSubsidized: item.isSubsidized ?? false,
          };
        }),
      };
    } else {
      invoice = {
        serie: '',
        value: 0,
        number: '',
        key: '',
        // @ts-ignore
        issuanceDate: '',
        carrierName: '',
        trackingNumber: '',
        trackingUrl: '',
        items: [
          {
            sku: '',
            quantity: 0,
            price: 0,
            isSubsidized: false,
          },
        ],
      };
    }

    if (result.billingData && result.billingData.length > 0) {
      document = result.billingData[0].customerDocument || '';
    }
    const customer = {
      phones: result.receiverPhones
        ? result.receiverPhones.map(phone => ({
            phone: `${phone.phone}`,
            type: phone.type,
          }))
        : [{ phone: '', type: '' }],
      email: result.receiverEmail ?? '',
      isCorporate: false,
      firstName: result.receiverName ? result.receiverName.split(' ')[0] : '',
      lastName: result.receiverName
        ? result.receiverName.split(' ')[1]
          ? result.receiverName.split(' ')[1]
          : ''
        : '',
      document,
      documentType: 'cpf',
      corporateName: '',
      fullName: result.receiverName ?? '',
    };

    const delivery = {
      receiverName: result.receiverName ?? '',
      city: result.deliveryCity ?? '',
      state: result.deliveryState ?? '',
      zipCode: result.deliveryZipCode ?? '',
      country: 'BRA',
    };

    const toSave = {
      ...result,
      invoice,
      customer,
      delivery,
      history: sortHistory,
      orderCreatedAt,
      statusCode: this.getStatusCode(result.lastOccurrenceMicro, result.status),
    };

    return {
      toSave,
      toDelete: rest.filter(item => item._id !== toSave._id),
    };
  }
}
