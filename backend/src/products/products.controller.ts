import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateProduct, Product } from "./product";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): { products: Product[] } {
    return { products: this.productsService.findAll() };
  }

  @Post()
  create(@Body() input: CreateProduct): { product: Product } {
    return { product: this.productsService.create(input) };
  }
}
