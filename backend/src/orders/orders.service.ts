import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { CreateOrder, Order } from "./order";

const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
const STANDARD_SHIPPING_CENTS = 750;
const TAX_RATE = 0.08;

@Injectable()
export class OrdersService {
  private readonly orders: Order[] = [];
  private nextId = 1;

  constructor(private readonly productsService: ProductsService) {}

  findAll(): Order[] {
    return this.orders;
  }

  create(input: CreateOrder): Order {
    if (!input?.customerName?.trim()) {
      throw new BadRequestException("customerName is required.");
    }

    const requestedItems = input.items?.length
      ? input.items
      : input.productId
        ? [{ productId: input.productId, quantity: input.quantity ?? 0 }]
        : [];
    if (!requestedItems.length) {
      throw new BadRequestException("At least one order item is required.");
    }

    const items = requestedItems.map((requestedItem) => {
      if (!Number.isInteger(requestedItem.quantity) || requestedItem.quantity < 1) {
        throw new BadRequestException("Each quantity must be a positive integer.");
      }
      const product = this.productsService.findById(requestedItem.productId);
      if (!product) throw new NotFoundException(`Product ${requestedItem.productId} not found.`);
      return {
        productId: product.id,
        productName: product.name,
        quantity: requestedItem.quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents: product.priceCents * requestedItem.quantity,
      };
    });

    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const singleItem = items.length === 1 ? items[0] : null;

    const order: Order = {
      id: `ORDER-${this.nextId++}`,
      customerName: input.customerName.trim(),
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      city: input.city?.trim() || undefined,
      country: input.country?.trim() || undefined,
      postalCode: input.postalCode?.trim() || undefined,
      items,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents: subtotalCents + shippingCents + taxCents,
      createdAt: new Date().toISOString(),
      ...(singleItem
        ? {
            productId: singleItem.productId,
            productName: singleItem.productName,
            quantity: singleItem.quantity,
            unitPriceCents: singleItem.unitPriceCents,
          }
        : {}),
    };
    this.orders.push(order);
    return order;
  }
}
