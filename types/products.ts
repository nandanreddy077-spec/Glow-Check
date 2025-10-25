export interface SkincareProduct {
  id: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask' | 'exfoliant' | 'other';
  openedDate?: Date;
  expiryDate?: Date;
  shelfLifeMonths: number;
  price?: number;
  where?: string;
  ingredients?: string[];
  concerns: string[];
  timeOfDay: 'morning' | 'evening' | 'both';
  photo?: string;
  notes?: string;
  rating?: number;
  inUse: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export interface ProductAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'expiring_soon' | 'expired' | 'running_low' | 'repurchase';
  message: string;
  priority: 'high' | 'medium' | 'low';
  date: Date;
  dismissed: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  date: Date;
  rating: number;
  effectiveness: number;
  skinFeel: number;
  wouldRepurchase: boolean;
  pros: string[];
  cons: string[];
  notes?: string;
}
