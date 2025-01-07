import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SSOUser extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  company: string;

  @Prop({ type: [String], default: [] })
  role: string[];
}

export const UserSchema = SchemaFactory.createForClass(SSOUser);
