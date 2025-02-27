import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { StockService } from "../services/stock.service";
import { IProduct } from "../schemas/models/product.interface";

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService){}

  @Get()
  async getAllStock(@Query('limit') limit: number, @Query('page') page: number) {
    return this.stockService.getAllStock(limit, page)
  }

  @Get(':productId')
  async getStockById(@Param('productId') productId: string) {
    return this.stockService.getStockById(productId)
  }

  @Post()
  async createStock(@Body() product: IProduct) {
    return this.stockService.createStock(product)
  }

  @Put(':productId')
  async updateStock(@Param('productId') productId: string, @Body('stock') stock: number) {
    return this.stockService.updateStock(productId, stock)
  }

  @Delete(':productId')
  async deleteStock(@Param('productId') productId: string) {
    return this.stockService.deleteStock(productId)
  }
}