export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrder {
  customerName: string;
  productId?: string;
  quantity?: number;
  items?: CreateOrderItem[];
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface OrderItem extends CreateOrderItem {
  productName: string;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  customerName: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPriceCents?: number;
}
