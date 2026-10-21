export type AppRole = 'manager' | 'operator';

export type ProductStatus = 'available' | 'low' | 'out_of_stock';

export interface StorageBox {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity?: number;
  color: string;
  notes?: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  boxId: string; // The box/container the manager placed this in
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  unit: 'un' | 'cx' | 'kg' | 'lt' | 'pct';
  notes?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  boxId: string;
  boxName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string;
  authorRole: AppRole;
  timestamp: string;
  linkedTransactionId?: string;
}
