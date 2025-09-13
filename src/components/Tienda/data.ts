export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description?: string;
  category?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}
