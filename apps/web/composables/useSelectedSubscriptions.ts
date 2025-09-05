import { ref, computed } from 'vue';
import type { CartItem } from '@plentymarkets/shop-api';
import { cartGetters } from '@plentymarkets/shop-api';

// Create a singleton instance
const selectedItems = ref<number[]>([]);
const subscriptionProducts = ref<CartItem[]>([]);
const selectedInterval = ref('1 month');
const selectedRecurrenceCount = ref<number | null>(12);

export const useSelectedSubscriptions = () => {
  const selectedProducts = computed(() => {
    const products = subscriptionProducts.value.filter(item => 
      selectedItems.value.includes(item.variationId)
    );
    console.log('Selected Products:', products);
    return products;
  });

  const selectedProductsTotal = computed(() => {
    const total = selectedProducts.value.reduce((total, item) => {
      return total + (cartGetters.getCartItemPrice(item) * cartGetters.getItemQty(item));
    }, 0);
    console.log('Selected Products Total:', total);
    return total;
  });

  const setSubscriptionProducts = (products: CartItem[]) => {
    console.log('Setting subscription products:', products);
    subscriptionProducts.value = [...products];
  };

  const toggleSelection = (variationId: number) => {
    console.log('Toggling selection for:', variationId);
    const index = selectedItems.value.indexOf(variationId);
    if (index === -1) {
      selectedItems.value = [...selectedItems.value, variationId];
    } else {
      selectedItems.value = selectedItems.value.filter(id => id !== variationId);
    }
    console.log('Selected items after toggle:', selectedItems.value);
  };

  const toggleSelectAll = () => {
    console.log('Toggle Select All - Current selected:', selectedItems.value.length);
    if (selectedItems.value.length === subscriptionProducts.value.length) {
      selectedItems.value = [];
    } else {
      selectedItems.value = [...subscriptionProducts.value.map(item => item.variationId)];
    }
    console.log('Selected items after toggle all:', selectedItems.value);
  };

  const setSelectAll = (value: boolean) => {
    console.log('Setting select all to:', value);
    if (value) {
      selectedItems.value = [...subscriptionProducts.value.map(item => item.variationId)];
    } else {
      selectedItems.value = [];
    }
    console.log('Selected items after set all:', selectedItems.value);
  };

  const isSelected = (variationId: number) => {
    return selectedItems.value.includes(variationId);
  };

  const allSelected = computed(() => {
    const result = subscriptionProducts.value.length > 0 && 
           selectedItems.value.length === subscriptionProducts.value.length;
    console.log('All Selected state:', result);
    return result;
  });

  const setInterval = (interval: string) => {
    console.log('Setting subscription interval:', interval);
    selectedInterval.value = interval;
  };

  const setRecurrenceCount = (count: number | null) => {
    console.log('Setting recurrence count:', count);
    selectedRecurrenceCount.value = count;
  };

  const getInterval = computed(() => selectedInterval.value);
  const getRecurrenceCount = computed(() => selectedRecurrenceCount.value);

  return {
    selectedProducts,
    selectedProductsTotal,
    selectedVariationIds: selectedItems,
    setSubscriptionProducts,
    toggleSelection,
    toggleSelectAll,
    setSelectAll,
    isSelected,
    allSelected,
    setInterval,
    interval: getInterval,
    setRecurrenceCount,
    recurrenceCount: getRecurrenceCount
  };
}; 