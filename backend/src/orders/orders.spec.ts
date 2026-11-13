import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

describe("Orders", () => {
  let controller: OrdersController;

  beforeEach(() => {
    controller = new OrdersController(new OrdersService(new ProductsService()));
  });

  it("starts with an empty order list", () => {
    expect(controller.findAll()).toEqual({ orders: [] });
  });

  it("creates an order and calculates its total", () => {
    const order = controller.create({ customerName: "Lab Student", productId: "day-bottle", quantity: 2 }).order;
    expect(order.id).toBe("ORDER-1");
    expect(order.subtotalCents).toBe(7600);
    expect(order.totalCents).toBe(8208);
    expect(order.productId).toBe("day-bottle");
  });

  it("creates one multi-item order", () => {
    const order = controller.create({
      customerName: "Lab Student",
      items: [
        { productId: "day-bottle", quantity: 1 },
        { productId: "field-pack", quantity: 2 },
      ],
    }).order;
    expect(order.items).toHaveLength(2);
    expect(order.subtotalCents).toBe(22600);
    expect(order.totalCents).toBe(24408);
    expect(order.productId).toBeUndefined();
  });

  it("rejects invalid quantities", () => {
    expect(() => controller.create({ customerName: "Lab Student", productId: "day-bottle", quantity: 0 })).toThrow(BadRequestException);
  });

  it("rejects unknown products", () => {
    expect(() => controller.create({ customerName: "Lab Student", productId: "missing", quantity: 1 })).toThrow(NotFoundException);
  });
});
