import { TimeStub, QueryValueObject } from "fauna";
import { Product } from "./products.model";
import { Customer } from "./customers.model";

export interface Order extends QueryValueObject {
  id: string;
  createdAt: TimeStub;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
}

export interface OrderItem extends QueryValueObject {
  id: string;
  order: Order;
  product: Product;
  quantity: number;
}

export enum OrderStatus {
  Cart = "cart",
  Processing = "processing",
  Shipped = "shipped",
  Delivered = "delivered",
}