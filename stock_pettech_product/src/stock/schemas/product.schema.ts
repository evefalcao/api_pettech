import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { IProduct } from "./models/product.interface";
import mongoose, { HydratedDocument } from "mongoose";

export type ProductDocument = HydratedDocument<Product>

@Schema()
export class Product implements IProduct{

  @Prop({ type: mongoose.Schema.Types.ObjectId})
  id?: number | undefined;
  @Prop()
  name: string;




  
  @Prop()
  quantity: number;
  @Prop()
  relationalId: number;

}

export const ProductSchema = SchemaFactory.createForClass(Product);