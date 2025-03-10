import { IProduct } from "src/stock/schemas/models/product.interface";
import { ProductRepository } from "../product.repository";
import { Product } from "src/stock/schemas/product.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NotFoundException } from "@nestjs/common";

export class ProductMongooseRepository implements ProductRepository {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  getAllStock(limit: number, page: number): Promise<IProduct[]> {
    const offset = (page - 1) * limit

    return this.productModel.find().skip(offset).limit(limit).exec()
  }

  async getStockById(productId: string): Promise<IProduct> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) throw new NotFoundException(`Product not found`);
    return product
  }

  async createStock(product: IProduct): Promise<void> {
    const createStock = new this.productModel(product)
    await createStock.save()
  }

  async updateStock(productId: string, stock: number): Promise<void> {
    await this.productModel.updateOne({ _id: productId}, { quantity: stock}).exec()
  }

  async deleteStock(productId: string): Promise<void> {
    await this.productModel.deleteOne( { _id: productId }).exec()
  }
}