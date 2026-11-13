import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateProduct, Product } from "./product";

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    { id: "arc-headphones", name: "Arc Headphones", category: "Audio", priceCents: 12900, image: "/assets/product-headphones.png" },
    { id: "day-bottle", name: "Day Bottle", category: "Hydration", priceCents: 3800, image: "/assets/product-bottle.png" },
    { id: "field-pack", name: "Field Pack", category: "Carry", priceCents: 9400, image: "/assets/product-backpack.png" },
    { id: "tempo-runner", name: "Tempo Runner", category: "Footwear", priceCents: 11200, image: "/assets/product-sneaker.png" },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findById(id: string): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  create(input: CreateProduct): Product {
    if (
      !input?.id?.trim() ||
      !input.name?.trim() ||
      !input.category?.trim() ||
      !input.image?.trim() ||
      !Number.isInteger(input.priceCents) ||
      input.priceCents < 1
    ) {
      throw new BadRequestException("All product fields are required and priceCents must be a positive integer.");
    }
    if (this.findById(input.id)) {
      throw new BadRequestException("A product with this id already exists.");
    }

    const product = {
      ...input,
      id: input.id.trim(),
      name: input.name.trim(),
      category: input.category.trim(),
      image: input.image.trim(),
    };
    this.products.push(product);
    return product;
  }
}
