import { BadRequestException } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

describe("Products", () => {
  let service: ProductsService;
  let controller: ProductsController;

  beforeEach(() => {
    service = new ProductsService();
    controller = new ProductsController(service);
  });

  it("lists the four existing storefront products", () => {
    expect(controller.findAll().products).toHaveLength(4);
  });

  it("creates a product", () => {
    const product = controller.create({ id: "desk-lamp", name: "Desk Lamp", category: "Home", priceCents: 4500, image: "/assets/desk-lamp.png" }).product;
    expect(product.name).toBe("Desk Lamp");
    expect(controller.findAll().products).toHaveLength(5);
  });

  it("rejects duplicate product ids", () => {
    expect(() => controller.create({ id: "day-bottle", name: "Duplicate", category: "Test", priceCents: 100, image: "/test.png" })).toThrow(BadRequestException);
  });
});
