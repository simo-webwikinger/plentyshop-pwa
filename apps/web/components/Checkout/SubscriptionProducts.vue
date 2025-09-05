<template>
  <div v-if="subscriptionProducts.length" class="mb-4">
    <CheckoutSteps :current-step="1" />
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-lg font-bold">{{ $t('SubscriptionProducts') }}</h3>
      <label
        class="cursor-pointer select-none flex items-center text-primary-800"
      >
        <SfCheckbox
          :model-value="selectedSubscriptions.allSelected.value"
          @update:modelValue="handleSelectAll"
          class="mr-2"
        />
        {{ $t('SelectAll') }}
      </label>
    </div>
    <div v-for="(cartItem, index) in subscriptionProducts" :key="cartItem.variationId">
      <UiSubscriptionProducts
        :cart-item="cartItem" 
        :class="{ 'border-t': index === 0 }"
        :is-selected="selectedSubscriptions.isSelected(cartItem.variationId)"
        @toggle-selection="handleToggleSelection"
      />
    </div>

    <div class="mb-4">
      <UiFormLabel>{{ $t('SubscriptionInterval') }}</UiFormLabel>
      <select
        v-model="selectedInterval"
        class="w-full text-base text-neutral-900 gap-2 bg-white rounded-md ring-1 text-neutral-500 hover:ring-primary-700 focus-within:ring-primary-700 focus-within:ring-2 ring-1 ring-neutral-300 p-2"
      >
        <option value="1 days">{{ $t('account.subscriptions.details.recurrence_interval.1_days') }}</option>
        <option value="1 week">{{ $t('account.subscriptions.details.recurrence_interval.1_week') }}</option>
        <option value="2 weeks">{{ $t('account.subscriptions.details.recurrence_interval.2_weeks') }}</option>
        <option value="1 month">{{ $t('account.subscriptions.details.recurrence_interval.1_month') }}</option>
        <option value="3 months">{{ $t('account.subscriptions.details.recurrence_interval.3_months') }}</option>
        <option value="6 months">{{ $t('account.subscriptions.details.recurrence_interval.6_months') }}</option>
        <option value="12 months">{{ $t('account.subscriptions.details.recurrence_interval.12_months') }}</option>
      </select>
    </div>

    <div class="mb-4">
      <UiFormLabel>{{ $t('NumberofPayments') }}</UiFormLabel>
      <select
        v-model="selectedRecurrenceCount"
        class="w-full text-base text-neutral-900 gap-2 bg-white rounded-md ring-1 text-neutral-500 hover:ring-primary-700 focus-within:ring-primary-700 focus-within:ring-2 ring-1 ring-neutral-300 p-2"
      >
        <option value="null">{{$t('UntilCanceled')}}</option>
        <option value="3">3 {{$t('payments')}}</option>
        <option value="6">6 {{$t('payments')}}</option>
        <option value="9">9 {{$t('payments')}}</option>
        <option value="12">12 {{$t('payments')}}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { SfCheckbox } from '@storefront-ui/vue';
import type { CartItem } from '@plentymarkets/shop-api';
import { cartGetters } from '@plentymarkets/shop-api';
import { useSelectedSubscriptions } from '~/composables/useSelectedSubscriptions';
const { t, n } = useI18n();

const emit = defineEmits(['update:interval', 'update:recurrenceCount']);
const { data: cart } = useCart();
const subscriptionProducts = ref<CartItem[]>([]);
const selectedSubscriptions = useSelectedSubscriptions();
const selectedInterval = ref('1 month');
const selectedRecurrenceCount = ref('null');

// Watch for interval changes and emit the new value
watch(selectedInterval, (newInterval) => {
  emit('update:interval', newInterval);
  selectedSubscriptions.setInterval(newInterval);
  sessionStorage.setItem('selectedSubscriptionInterval', JSON.stringify(newInterval));
});

const getShippingAmount = (amount: number) => {
  return amount === 0 ? t('shippingMethod.free') : n(Number(amount), 'currency');
};

// Watch for recurrence count changes
watch(selectedRecurrenceCount, (newCount) => {
  emit('update:recurrenceCount', newCount === 'null' ? null : parseInt(newCount));
  selectedSubscriptions.setRecurrenceCount(newCount === 'null' ? null : parseInt(newCount));
  sessionStorage.setItem('selectedSubscriptionRecurrenceCount', JSON.stringify(newCount === 'null' ? null : parseInt(newCount)));
});

watch(() => selectedSubscriptions.selectedVariationIds.value, (newIds) => {
  sessionStorage.setItem('selectedSubscriptionVariationIds', JSON.stringify(newIds));
}, { deep: true });

watch(() => selectedSubscriptions.selectedProducts.value, (newProducts) => {
  sessionStorage.setItem('selectedSubscriptionProducts', JSON.stringify(newProducts));
}, { deep: true });

watch(() => selectedSubscriptions.selectedProductsTotal.value, (newTotal) => {
  sessionStorage.setItem('selectedSubscriptionProductsTotal', JSON.stringify(newTotal));
});

const handleToggleSelection = (variationId: number) => {
  console.log('Handling toggle selection for:', variationId);
  selectedSubscriptions.toggleSelection(variationId);
};

const handleSelectAll = (value: boolean | any[] | Set<any> | "true" | "false" | undefined) => {
  if (typeof value === 'boolean') {
    selectedSubscriptions.setSelectAll(value);
  }
};

const loadSubscriptionProducts = async () => {
  try {
    console.log('Loading subscription products...');
    const { data } = await axios.post('/rest/orders-subscription/verify-products', {
      productIds: cart.value?.items?.map(item => item.variationId) || []
    });

    console.log('Subscription products response:', data);

    if (data.subscriptionProductIds?.length) {
      const filteredProducts = (cart.value?.items || []).filter(item => 
        data.subscriptionProductIds.includes(item.variationId)
      );
      console.log('Filtered subscription products:', filteredProducts);
      subscriptionProducts.value = filteredProducts;
      selectedSubscriptions.setSubscriptionProducts(filteredProducts);
    }
  } catch (error) {
    console.error('Error loading subscription products:', error);
  }
};

// Watch for cart changes and reload subscription products
watch(() => cart.value?.items, () => {
  if (cart.value?.items?.length) {
    loadSubscriptionProducts();
  }
}, { immediate: true });

onMounted(() => {
  if (cart.value?.items?.length) {
    loadSubscriptionProducts();
  }
});
</script>