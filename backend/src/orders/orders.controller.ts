import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateOrder, Order } from "./order";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): { orders: Order[] } {
    return { orders: this.ordersService.findAll() };
  }

  @Post()
  create(@Body() input: CreateOrder): { order: Order } {
    return { order: this.ordersService.create(input) };
  }
}
