export const newOrderSchema = {
  type: 'object',
  properties: {
    _id: {
      type: 'object',
    },
    invoice: {
      type: 'object',
      properties: {
        serie: {
          type: 'string',
        },
        value: {
          type: 'number',
        },
        number: {
          type: 'string',
        },
        key: {
          type: 'string',
        },
        issuanceDate: {
          type: 'string',
        },
        carrierName: {
          type: 'string',
        },
        trackingNumber: {
          type: 'string',
        },
        trackingUrl: {
          type: 'string',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: {
                type: 'string',
              },
              quantity: {
                type: 'number',
              },
              price: {
                type: 'number',
              },
              isSubsidized: {
                type: 'boolean',
              },
            },
          },
        },
        customerDocument: {
          type: 'string',
        },
      },
    },
    customer: {
      type: 'object',
      properties: {
        phones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phone: {
                type: 'string',
              },
              type: {
                type: 'string',
              },
            },
          },
        },
        email: {
          type: 'string',
        },
        isCorporate: {
          type: 'boolean',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        document: {
          type: 'string',
        },
        documentType: {
          type: 'string',
        },
        corporateName: {
          type: 'string',
        },
        fullName: {
          type: 'string',
        },
      },
    },
    delivery: {
      type: 'object',
      properties: {
        receiverName: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        state: {
          type: 'string',
        },
        zipCode: {
          type: 'string',
        },
        country: {
          type: 'string',
        },
      },
    },
    statusCode: {
      type: 'object',
      properties: {
        micro: {
          type: 'number',
        },
        macro: {
          type: 'string',
        },
      },
      required: ['micro', 'macro'],
    },
    history: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          volumeNumber: { type: 'number' },
          dispatchDate: { type: 'string' },
          estimateDeliveryDateDeliveryCompany: {
            type: 'string',
          },
          partnerMessage: {
            type: 'string',
          },
          microStatus: {
            type: 'string',
          },
          lastOccurrenceMacro: {
            type: 'string',
          },
          lastOccurrenceMicro: {
            type: 'string',
          },
          lastOccurrenceMessage: {
            type: 'string',
          },
          partnerStatusId: {
            type: 'string',
          },
          partnerStatus: {
            type: 'string',
          },
          statusCode: {
            type: 'object',
            properties: {
              micro: {
                type: 'string',
              },
              macro: {
                type: 'string',
              },
            },
            required: ['micro', 'macro'],
          },
          orderUpdatedAt: {
            type: 'string',
          },
          i18n: {
            type: 'string',
          },
        },
        required: ['statusCode'],
      },
    },
    totals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          value: { type: 'number' },
        },
      },
    },
  },
  required: [
    'invoice',
    'customer',
    'delivery',
    'statusCode',
    'history',
    'totals',
  ],
};
