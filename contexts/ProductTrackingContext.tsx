import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { SkincareProduct, ProductAlert, ProductReview } from '@/types/products';
import { Platform } from 'react-native';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }
};

interface ProductTrackingContextType {
  products: SkincareProduct[];
  alerts: ProductAlert[];
  reviews: ProductReview[];
  addProduct: (product: Omit<SkincareProduct, 'id' | 'usageCount' | 'inUse'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<SkincareProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  logProductUsage: (productId: string) => Promise<void>;
  addReview: (review: Omit<ProductReview, 'id'>) => Promise<void>;
  getExpiringProducts: () => SkincareProduct[];
  getExpiredProducts: () => SkincareProduct[];
  dismissAlert: (alertId: string) => Promise<void>;
  getProductsByCategory: (category: string) => SkincareProduct[];
  getActiveProducts: () => SkincareProduct[];
  calculateProductValue: (product: SkincareProduct) => number;
}

const STORAGE_KEYS = {
  PRODUCTS: 'glowcheck_products',
  ALERTS: 'glowcheck_product_alerts',
  REVIEWS: 'glowcheck_product_reviews',
};

export const [ProductTrackingProvider, useProductTracking] = createContextHook<ProductTrackingContextType>(() => {
  const [products, setProducts] = useState<SkincareProduct[]>([]);
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const loadData = async () => {
    try {
      const [productsData, alertsData, reviewsData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.PRODUCTS),
        storage.getItem(STORAGE_KEYS.ALERTS),
        storage.getItem(STORAGE_KEYS.REVIEWS),
      ]);

      if (productsData) {
        setProducts(JSON.parse(productsData));
      }
      if (alertsData) {
        setAlerts(JSON.parse(alertsData));
      }
      if (reviewsData) {
        setReviews(JSON.parse(reviewsData));
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  const checkProductAlerts = useCallback(() => {
    const newAlerts: ProductAlert[] = [];
    const now = new Date();

    products.forEach(product => {
      if (!product.openedDate) return;

      const openedDate = new Date(product.openedDate);
      const expiryDate = new Date(openedDate);
      expiryDate.setMonth(expiryDate.getMonth() + product.shelfLifeMonths);

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        newAlerts.push({
          id: `alert_${product.id}_expired`,
          productId: product.id,
          productName: product.name,
          type: 'expired',
          message: `${product.name} has expired and should be replaced`,
          priority: 'high',
          date: now,
          dismissed: false,
        });
      } else if (daysUntilExpiry <= 14) {
        newAlerts.push({
          id: `alert_${product.id}_expiring`,
          productId: product.id,
          productName: product.name,
          type: 'expiring_soon',
          message: `${product.name} expires in ${daysUntilExpiry} days`,
          priority: 'medium',
          date: now,
          dismissed: false,
        });
      }

      if (product.lastUsed) {
        const lastUsed = new Date(product.lastUsed);
        const daysSinceUsed = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        
        if (product.inUse && daysSinceUsed > 30) {
          newAlerts.push({
            id: `alert_${product.id}_unused`,
            productId: product.id,
            productName: product.name,
            type: 'running_low',
            message: `Haven't used ${product.name} in ${daysSinceUsed} days`,
            priority: 'low',
            date: now,
            dismissed: false,
          });
        }
      }

      if (product.rating && product.rating >= 4 && product.usageCount > 10 && daysUntilExpiry < 30) {
        newAlerts.push({
          id: `alert_${product.id}_repurchase`,
          productId: product.id,
          productName: product.name,
          type: 'repurchase',
          message: `Time to repurchase ${product.name}`,
          priority: 'medium',
          date: now,
          dismissed: false,
        });
      }
    });

    const existingAlertIds = new Set(alerts.map(a => a.id));
    const filteredNewAlerts = newAlerts.filter(a => !existingAlertIds.has(a.id));

    if (filteredNewAlerts.length > 0) {
      const updatedAlerts = [...alerts, ...filteredNewAlerts];
      setAlerts(updatedAlerts);
      storage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updatedAlerts));
    }
  }, [products, alerts]);

  const addProduct = useCallback(async (product: Omit<SkincareProduct, 'id' | 'usageCount' | 'inUse'>) => {
    try {
      const newProduct: SkincareProduct = {
        ...product,
        id: `product_${Date.now()}`,
        usageCount: 0,
        inUse: true,
      };

      const updated = [...products, newProduct];
      setProducts(updated);
      await storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding product:', error);
    }
  }, [products]);

  const updateProduct = useCallback(async (id: string, updates: Partial<SkincareProduct>) => {
    try {
      const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
      setProducts(updated);
      await storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      await storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }, [products]);

  const logProductUsage = useCallback(async (productId: string) => {
    try {
      const updated = products.map(p => 
        p.id === productId 
          ? { ...p, usageCount: p.usageCount + 1, lastUsed: new Date() }
          : p
      );
      setProducts(updated);
      await storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error logging product usage:', error);
    }
  }, [products]);

  const addReview = useCallback(async (review: Omit<ProductReview, 'id'>) => {
    try {
      const newReview: ProductReview = {
        ...review,
        id: `review_${Date.now()}`,
      };

      const updated = [newReview, ...reviews];
      setReviews(updated);
      await storage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));

      await updateProduct(review.productId, { rating: review.rating });
    } catch (error) {
      console.error('Error adding review:', error);
    }
  }, [reviews, updateProduct]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const updated = alerts.map(a => a.id === alertId ? { ...a, dismissed: true } : a);
      setAlerts(updated);
      await storage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }, [alerts]);

  const getExpiringProducts = useCallback(() => {
    const now = new Date();
    return products.filter(product => {
      if (!product.openedDate) return false;

      const openedDate = new Date(product.openedDate);
      const expiryDate = new Date(openedDate);
      expiryDate.setMonth(expiryDate.getMonth() + product.shelfLifeMonths);

      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
  }, [products]);

  const getExpiredProducts = useCallback(() => {
    const now = new Date();
    return products.filter(product => {
      if (!product.openedDate) return false;

      const openedDate = new Date(product.openedDate);
      const expiryDate = new Date(openedDate);
      expiryDate.setMonth(expiryDate.getMonth() + product.shelfLifeMonths);

      return expiryDate < now;
    });
  }, [products]);

  const getProductsByCategory = useCallback((category: string) => {
    return products.filter(p => p.category === category);
  }, [products]);

  const getActiveProducts = useCallback(() => {
    return products.filter(p => p.inUse);
  }, [products]);

  const calculateProductValue = useCallback((product: SkincareProduct) => {
    if (!product.price || !product.openedDate) return 0;

    const now = new Date();
    const openedDate = new Date(product.openedDate);
    const daysUsed = Math.floor((now.getTime() - openedDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = product.shelfLifeMonths * 30;

    const costPerDay = product.price / totalDays;
    const valueUsed = costPerDay * daysUsed;
    const valueRemaining = product.price - valueUsed;

    return Math.max(0, valueRemaining);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      checkProductAlerts();
    }
  }, [products]);

  return useMemo(() => ({
    products,
    alerts: alerts.filter(a => !a.dismissed),
    reviews,
    addProduct,
    updateProduct,
    deleteProduct,
    logProductUsage,
    addReview,
    getExpiringProducts,
    getExpiredProducts,
    dismissAlert,
    getProductsByCategory,
    getActiveProducts,
    calculateProductValue,
  }), [
    products,
    alerts,
    reviews,
    addProduct,
    updateProduct,
    deleteProduct,
    logProductUsage,
    addReview,
    getExpiringProducts,
    getExpiredProducts,
    dismissAlert,
    getProductsByCategory,
    getActiveProducts,
    calculateProductValue,
  ]);
});
