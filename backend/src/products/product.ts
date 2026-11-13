export interface Product {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  image: string;
}

export type CreateProduct = Product;
