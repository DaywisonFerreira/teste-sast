import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { Document } from 'mongoose';
import { SalesChannelEntity } from '../../sales-channel/schemas/sales-channel.schema';

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

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ default: false, required: false })
  active: boolean;

  @Prop({ type: String, required: true })
  document: string;

  @Prop({ type: String, required: false, default: '' })
  externalWarehouseCode: string;

  @Prop({ type: AccountTypeEnum, enum: Object.values(AccountTypeEnum) })
  accountType: AccountTypeEnum;

  @Prop({ default: true, required: false })
  shipToAddress: boolean;

  @Prop({ default: [], required: false })
  accounts: any[];

  @Prop({
    default: [],
    required: false,
  })
  @Type(() => SalesChannelEntity)
  salesChannels: SalesChannelEntity[];

  createdAt: Date;

  updatedAt: Date;
}

export type AccountDocument = AccountEntity & Document;

export const AccountSchema = SchemaFactory.createForClass(AccountEntity).index({
  code: 'text',
  name: 'text',
  document: 'text',
});