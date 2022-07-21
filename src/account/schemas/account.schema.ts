import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum AccountTypeEnum {
  location = 'location',
  seller = 'seller',
  account = 'account',
  service = 'service',
}

@Schema({ collection: 'accounts', timestamps: true })
export class AccountEntity extends Document {
  @Prop({ required: true })
  id: string;

  @Prop({ required: false })
  icon: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false })
  zipCode: string;

  @Prop({ type: String, required: false })
  code: string;

  @Prop({ default: false, required: false })
  active: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  integrateIntelipost: boolean;

  @Prop({ type: String, required: true })
  document: string;

  @Prop({ type: String, required: false, default: '' })
  externalWarehouseCode: string;

  @Prop({ type: AccountTypeEnum, enum: Object.values(AccountTypeEnum) })
  accountType: string;

  @Prop({ default: true, required: false })
  shipToAddress: boolean;

  @Prop({ default: [], required: false })
  accounts: any[];

  @Prop({
    default: [],
    required: false,
  })
  salesChannels: string[];

  @Prop({ type: Boolean, default: false, required: false })
  generateNotfisFile: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export type AccountDocument = AccountEntity & Document;

export const AccountSchema = SchemaFactory.createForClass(AccountEntity).index({
  code: 'text',
  name: 'text',
  document: 'text',
});
