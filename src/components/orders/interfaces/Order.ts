import { common } from 'ihub-framework-ts';

export class Order extends common.Types.BaseEntity {
    _id: string;
    __v: number;
    ackData: ACKData;
    affiliateId: string;
    allowEdition: boolean;
    backOfficeIntegrationSkipped: boolean;
    billingAddress: Address;
    createdAt: Date;
    creationDate: Date;
    customData: null;
    customer: Customer;
    deliveryAddress: Address;
    erpInfo: ERPInfo;
    externalOrderId: string;
    externalRefOrderId: string;
    history: History[];
    integrations: Integration[];
    internalOrderId: number;
    items: Item[];
    logisticInfo: LogisticInfoElement[];
    marketingData: MarketingData;
    orderClassification: string;
    orderDestination: string;
    orderType: string;
    origin: string;
    packageAttachment: PackageAttachment;
    payments: Payment[];
    ratesAndBenefitsData: RatesAndBenefitsDatum[];
    saleChannelId: number;
    sellerCode: string;
    sequence: string;
    status: string;
    storeCode: string;
    storeId: string;
    totals: Total[];
    updatedAt: Date;
    value: Value;
    visitorIp: string;

    /**
     * List of standard public fields for this entity. Commonly used for return in APIs.
     */
    static getPublicFields = [
        'orderId',
        'orderCreatedAt',
        'receiverName',
        'logisticInfo.deliveryCompany',
        'logisticInfo.shippingEstimateDate',
        'orderUpdatedAt',
        'orderSale', // pedido VTEX
        'order', //pedido erp,
        'status', //status da entrega
        'billingData.invoiceValue', // valor NF
        'billingData.trackingUrl',
    ];
}

export interface ACKData {
    exchange: string;
    key: string;
    body: Body[];
}

export interface Body {
    eventId: string;
    handle: string;
    domain: string;
    state: string;
    lastState: string;
    orderId: string;
    lastChange: Date;
    currentChange: Date;
    availableDate: Date;
}

export interface Address {
    addressType: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string | null;
    reference: string | null;
    receiverName?: string;
}

export interface Customer {
    phones: Phone[];
    email: string;
    isCorporate: boolean;
    firstName: string;
    lastName: string;
    document: string;
    documentType: string;
    fullName: string;
}

export interface Phone {
    phone: string;
    type: string;
}

export interface ERPInfo {
    logisticInfo: ERPInfoLogisticInfo;
    warehouseId: string;
    name: string;
    orderId: string | null;
    status: string;
    externalOrderId: string | null;
}

export interface ERPInfoLogisticInfo {
    tracking: any[];
}

export interface History {
    _id: string;
    date: Date;
    status: string;
    createdAt: Date;
    errorCode?: number;
    errorMessage?: string;
}

export interface Integration {
    name: string;
    status: string;
}

export interface Item {
    isSubsidized: boolean;
    isService: boolean;
    invoiceToGift: boolean;
    _id: string;
    uniqueId: string;
    quantity: number;
    name: string;
    listPrice: Value;
    price: Value;
    sellingPrice: Value;
    preSaleDate: null;
    isGift: boolean;
    imageUrl: string;
    detailUrl: string;
    promotions: Promotion[];
    messageToGift: string;
    customizations: any[];
    taxes: any[];
    components: any[];
    sku: string;
    externalSkuId: string;
    description: string;
}

export interface Value {
    $numberDecimal: number;
}

export interface Promotion {
    _id: string;
    name: string;
    value: Value;
    isPercentual: boolean;
    identifier: string;
}

export interface LogisticInfoElement {
    shipsTo: string[];
    _id: string;
    itemIndex: number;
    logisticContract: string;
    lockTTL: string;
    price: Value;
    listPrice: Value;
    sellingPrice: Value;
    deliveryWindow: null;
    deliveryCompany: string;
    shippingEstimate: string;
    shippingEstimateDate: Date;
    deliveryIds: DeliveryID[];
    deliveryChannel: string;
    pickupStoreInfo: PickupStoreInfo;
}

export interface DeliveryID {
    _id: string;
    courierId: string;
    courierName: string;
    dockId: string;
    quantity: number;
    warehouseId: string;
}

export interface PickupStoreInfo {
    additionalInfo: null;
    dockId: null;
    friendlyName: null;
    isPickupStore: boolean;
}

export interface MarketingData {
    id: string;
    utmSource: string;
    utmPartner: null;
    utmMedium: null;
    utmCampaign: string;
    coupon: null;
    utmiCampaign: string;
    utmipage: string;
    utmiPart: string;
    marketingTags: any[];
}

export interface PackageAttachment {
    packages: any[];
}

export interface Payment {
    creditExpirationTime: any[];
    _id: string;
    paymentId: string;
    externalPaymentId: string;
    value: Value;
    interestAmount: Value;
    interestRate: Value;
    group: string;
    dueDate: null;
    installments: number;
    tid: string;
    redemptionCode: null;
    url: null;
    cardHoldersName: null;
    firstDigits: null;
    lastDigits: null;
    cvv2: null;
    expireMonth: null;
    expireYear: null;
    externalTransactionId: string;
}

export interface RatesAndBenefitsDatum {
    _id: string;
    id: string;
    rateAndBenefitsIdentifiers: RateAndBenefitsIdentifier[];
}

export interface RateAndBenefitsIdentifier {
    _id: string;
    description: string;
    featured: boolean;
    name: string;
    additionalInfo: null;
}

export interface Total {
    _id: string;
    id: string;
    name: string;
    value: Value;
}
