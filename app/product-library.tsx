import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import {
  Package,
  Plus,
  X,
  Calendar,
  DollarSign,
  AlertCircle,
  Star,
  Check,
} from 'lucide-react-native';
import { useProductTracking } from '@/contexts/ProductTrackingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SkincareProduct } from '@/types/products';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, shadow } from '@/constants/theme';
import PremiumPaywall from '@/components/PremiumPaywall';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'cleanser', label: 'Cleanser' },
  { id: 'moisturizer', label: 'Moisturizer' },
  { id: 'serum', label: 'Serum' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'treatment', label: 'Treatment' },
];

export default function ProductLibraryScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = createStyles(palette);
  
  const {
    products,
    alerts,
    addProduct,
    deleteProduct,
    dismissAlert,
    getExpiringProducts,
    getExpiredProducts,
    getActiveProducts,
  } = useProductTracking();
  
  const { state } = useSubscription();
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleAddProduct = () => {
    if (!state.isPremium && !state.hasStartedTrial) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  React.useEffect(() => {
    if (!state.isPremium && !state.hasStartedTrial) {
      setShowPaywall(true);
    }
  }, [state.isPremium, state.hasStartedTrial]);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const expiringProducts = getExpiringProducts();
  const expiredProducts = getExpiredProducts();
  const activeProducts = getActiveProducts();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Product Library',
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>Alerts</Text>
            {alerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, shadow.card]}>
                <View style={styles.alertHeader}>
                  <AlertCircle 
                    color={alert.priority === 'high' ? '#F44336' : alert.priority === 'medium' ? '#FF9800' : '#FFC107'}
                    size={20}
                    strokeWidth={2}
                  />
                  <Text style={styles.alertText}>{alert.message}</Text>
                </View>
                <TouchableOpacity onPress={() => dismissAlert(alert.id)} style={styles.alertDismiss}>
                  <Text style={styles.alertDismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.card]}>
            <Package color={palette.blush} size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{activeProducts.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <Calendar color="#FF9800" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{expiringProducts.length}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
          <View style={[styles.statCard, shadow.card]}>
            <AlertCircle color="#F44336" size={24} strokeWidth={2} />
            <Text style={styles.statValue}>{expiredProducts.length}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === cat.id && styles.categoryChipTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package color={palette.textSecondary} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your skincare products to never miss an expiry date
            </Text>
            <TouchableOpacity onPress={handleAddProduct} style={styles.emptyButton}>
              <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={styles.emptyButtonGradient}>
                <Plus color={palette.textLight} size={20} strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Add First Product</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} palette={palette} onDelete={deleteProduct} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={handleAddProduct} style={styles.fab}>
          <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={styles.fabGradient}>
            <Plus color={palette.textLight} size={28} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addProduct}
        palette={palette}
      />

      {showPaywall && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.paywallOverlay}>
            <View style={styles.paywallContent}>
              <View style={styles.paywallHeader}>
                <Text style={styles.paywallTitle}>Product Library</Text>
                <Text style={styles.paywallSubtitle}>Premium Feature</Text>
              </View>
              <Text style={styles.paywallDescription}>
                Track your skincare products, get expiry alerts, and discover which products work best for your skin.
              </Text>
              <View style={styles.paywallFeatures}>
                <View style={styles.paywallFeature}>
                  <Text style={styles.paywallFeatureText}>✓ Unlimited product tracking</Text>
                </View>
                <View style={styles.paywallFeature}>
                  <Text style={styles.paywallFeatureText}>✓ Expiry date alerts</Text>
                </View>
                <View style={styles.paywallFeature}>
                  <Text style={styles.paywallFeatureText}>✓ Routine optimization</Text>
                </View>
                <View style={styles.paywallFeature}>
                  <Text style={styles.paywallFeatureText}>✓ Product effectiveness tracking</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.paywallButton}
                onPress={() => {
                  setShowPaywall(false);
                  router.push('/start-trial');
                }}
              >
                <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={styles.paywallButtonGradient}>
                  <Text style={styles.paywallButtonText}>Start 7-Day Free Trial</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.paywallClose}
                onPress={() => router.back()}
              >
                <Text style={styles.paywallCloseText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

interface ProductCardProps {
  product: SkincareProduct;
  palette: ReturnType<typeof getPalette>;
  onDelete: (id: string) => Promise<void>;
}

function ProductCard({ product, palette, onDelete }: ProductCardProps) {
  const styles = createCardStyles(palette);
  
  const expiryDate = product.openedDate ? new Date(product.openedDate) : null;
  if (expiryDate) {
    expiryDate.setMonth(expiryDate.getMonth() + product.shelfLifeMonths);
  }
  
  const daysUntilExpiry = expiryDate 
    ? Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
    
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiring = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{product.category}</Text>
          </View>
        </View>
        {product.rating && (
          <View style={styles.rating}>
            <Star color={palette.gold} size={16} fill={palette.gold} strokeWidth={2} />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {expiryDate && (
        <View style={styles.expiryInfo}>
          <Calendar color={isExpired ? '#F44336' : isExpiring ? '#FF9800' : palette.textSecondary} size={16} strokeWidth={2} />
          <Text style={[
            styles.expiryText,
            isExpired && { color: '#F44336' },
            isExpiring && { color: '#FF9800' },
          ]}>
            {isExpired ? 'Expired' : isExpiring ? `Expires in ${daysUntilExpiry} days` : `Expires ${expiryDate.toLocaleDateString()}`}
          </Text>
        </View>
      )}

      {product.price && (
        <View style={styles.priceInfo}>
          <DollarSign color={palette.textSecondary} size={16} strokeWidth={2} />
          <Text style={styles.priceText}>${product.price.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (product: Omit<SkincareProduct, 'id' | 'usageCount' | 'inUse'>) => Promise<void>;
  palette: ReturnType<typeof getPalette>;
}

function AddProductModal({ visible, onClose, onSave, palette }: AddProductModalProps) {
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [category, setCategory] = useState<SkincareProduct['category']>('serum');
  const [shelfLifeMonths, setShelfLifeMonths] = useState<string>('12');
  const [price, setPrice] = useState<string>('');

  const handleSave = async () => {
    if (!name.trim() || !brand.trim()) return;

    const product: Omit<SkincareProduct, 'id' | 'usageCount' | 'inUse'> = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      openedDate: new Date(),
      shelfLifeMonths: parseInt(shelfLifeMonths) || 12,
      price: price ? parseFloat(price) : undefined,
      concerns: [],
      timeOfDay: 'both',
    };
    
    await onSave(product);
    setName('');
    setBrand('');
    setPrice('');
    onClose();
  };

  const styles = createModalStyles(palette);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={palette.textSecondary} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Product Name*</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.modalInput}
                placeholder="e.g. Vitamin C Serum"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Brand*</Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                style={styles.modalInput}
                placeholder="e.g. The Ordinary"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat as SkincareProduct['category'])}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Shelf Life (months)</Text>
              <TextInput
                value={shelfLifeMonths}
                onChangeText={setShelfLifeMonths}
                keyboardType="number-pad"
                style={styles.modalInput}
                placeholder="12"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Price (optional)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={styles.modalInput}
                placeholder="29.99"
                placeholderTextColor={palette.textSecondary}
              />
            </View>
          </ScrollView>

          <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
            <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={styles.modalSaveGradient}>
              <Text style={styles.modalSaveText}>Add Product</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  alertsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  alertText: {
    fontSize: 14,
    color: palette.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  alertDismiss: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.surfaceElevated,
  },
  alertDismissText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.gold,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
    marginTop: 4,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: palette.surface,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: palette.blush,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  categoryChipTextActive: {
    color: palette.textLight,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
  },
  productList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  paywallContent: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 32,
  },
  paywallHeader: {
    marginBottom: 20,
  },
  paywallTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  paywallSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.gold,
  },
  paywallDescription: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  paywallFeatures: {
    marginBottom: 32,
  },
  paywallFeature: {
    marginBottom: 12,
  },
  paywallFeatureText: {
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  paywallButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  paywallButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  paywallButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textLight,
  },
  paywallClose: {
    alignItems: 'center',
  },
  paywallCloseText: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '600',
  },
});

const createCardStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.gold,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
});

const createModalStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.textPrimary,
  },
  categorySelector: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: palette.surfaceElevated,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: palette.blush,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  categoryButtonTextActive: {
    color: palette.textLight,
    fontWeight: '700',
  },
  modalSaveButton: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
  },
});
