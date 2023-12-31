export const account = {
  _id: {
    $oid: '6310f86828b7a43323757cce',
  },
  generateNotfisFile: false,
  salesChannels: ['b6ff3536-cf3e-4e32-9c12-feed42683b3a'],
  accounts: [],
  shipToAddress: false,
  externalWarehouseCode: '',
  integrateIntelipost: false,
  active: true,
  id: '61a9fbac5d4828001172df30',
  name: 'Infrastore',
  icon: 'https://www.infracommerce.com.br/image/infracommerce.svg',
  accountType: 'account',
  createdAt: {
    $date: {
      $numberLong: '1662049432457',
    },
  },
  updatedAt: {
    $date: {
      $numberLong: '1662058725156',
    },
  },
  document: '35978191000145',
  zipCode: '04548005',
  __v: 0,
};

export const location = {
  _id: { $oid: '61f2d90daa458d001195ae6f' },
  salesChannels: [],
  accounts: [],
  shipToAddress: true,
  active: false,
  id: '61f2d90c05a09500117f1584',
  code: 'Teste Lct-location',
  name: 'Teste Lct',
  icon: 'https://nike.com.br/icon.png',
  accountType: 'location',
  createdAt: { $date: '2022-01-27T17:40:28.347Z' },
  updatedAt: { $date: '2022-01-27T17:40:28.347Z' },
  document: '51.671.398/0001-29',
  zipCode: '04548-005',
  externalWarehouseCode: '120',
  __v: 0,
};

export const carrier = {
  _id: { $oid: '61f3dc93aa458d001195aef2' },
  active: true,
  id: '17ff8d7e-bcc9-49bd-881c-1a7cb28f52e0',
  carrier: 'Delivery Hub Carrier',
  document: '88730487000109',
  createdAt: { $date: '2022-01-28T12:07:47.774Z' },
  updatedAt: { $date: '2022-06-13T18:56:04.287Z' },
  __v: 0,
  generateNotfisFile: true,
  integration: {
    type: 'FTP',
    endpoint: '',
    attributes: [
      { key: 'user', value: 'teste' },
      { key: 'password', value: 'teste' },
      { key: 'port', value: 21 },
      { key: 'secure', value: false },
      { key: 'destPath', value: '/teste' },
      { key: '61940ba2e689060011f69be1', value: '/pathByAccount' },
    ],
  },
  externalDeliveryMethods: [
    { deliveryModeName: 'LS SAMEDAY', externalDeliveryMethodId: '15111' },
    { deliveryModeName: 'LS NEXTDAY', externalDeliveryMethodId: '740' },
    { deliveryModeName: 'NORMAL', externalDeliveryMethodId: '1' },
    { deliveryModeName: 'Teste Intelipost', externalDeliveryMethodId: '1' },
  ],
  externalDeliveryMethodId: '368',
};
