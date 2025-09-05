<template>
  <div class="p-6 bg-white max-w-4xl mx-auto text-sm">
    <h1 class="text-2xl font-bold mb-2">{{ t('subscription.subscriptionDetails') }}</h1>

    <!-- Loading and Error States -->
    <div v-if="loading" class="text-gray-500">{{ t('subscription.loading') }}</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <!-- Subscription Details -->
    <div v-else-if="subscription">
      <!-- Product Card -->
      <CheckoutSteps :current-step="3" />
      <div class="border rounded-md bg-gray-50 p-4 mb-6">
        <div v-for="item in detailedItems" :key="item.id" class="flex items-start gap-4">
          <img
              :src="item.image"
              :alt="item.name"
              class="w-28 h-auto border rounded-md"
          />
          <div class="flex flex-col gap-1 flex-1">
            <div class="text-lg font-bold">{{ item.name }}</div>
            <div class="flex justify-between">
              <p class="font-medium">{{ t('subscription.price') }}:</p>
              <p>{{ n(Number(item.price), 'currency') }}</p>
            </div>
            <div class="flex justify-between">
              <p class="font-medium">{{ t('subscription.quantity') }}:</p>
              <p>{{ item.quantity }}</p>
            </div>
            <div class="flex justify-between">
              <p class="font-medium">{{ t('subscription.total') }}:</p>
              <p>{{ n(Number(item.price) * Number(item.quantity), 'currency') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Info -->
      <div class="border rounded-md bg-gray-50 p-4 mb-6 space-y-2">
        <div><strong>{{ t('subscription.status') }}:</strong> {{ $t(`account.subscriptions.details.status_options.${subscription.status}`) }}</div>
        <div><strong>{{ t('subscription.orderDate') }}:</strong> {{ subscription.order_date }}</div>
        <div><strong>{{ t('subscription.recurrenceInterval') }}:</strong> {{ getRecurrenceIntervalTranslation(subscription.recurrence_interval) }}</div>
        <div><strong>{{ t('subscription.recurrenceCount') }}:</strong> {{ subscription.recurrence_count }}</div>
        <div><strong>{{ t('subscription.nextOrderDate') }}:</strong> {{ subscription.next_order_date }}</div>
        <div v-if="subscription.recurrence_count"><strong>{{ t('subscription.subscriptionTotal') }}:</strong> {{ n(Number(subscription.subscription_total) * subscription.recurrence_count, 'currency') }}</div>
        <div v-else><strong>{{ t('subscription.subscriptionPrice') }}:</strong> {{ n(Number(subscription.subscription_total), 'currency') }}</div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
definePageMeta({
  middleware: ['auth-guard']
});
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import { productGetters } from '@plentymarkets/shop-api';
import { useCustomerOrder } from '~/composables/useCustomerOrder';
const route = useRoute();
const { n, t } = useI18n();

const subscription = ref<any>(null);
const loading = ref(true);
const error = ref('');
const detailedItems = ref<any[]>([]);
const order = ref<any>(null);

const { data: orderData, fetchOrder, error: orderError } = useCustomerOrder('soft-login');

type SubscriptionItem = { productId: number, id: number, quantity: number, price: number };

const parsedItems = computed<SubscriptionItem[]>(() => {
  if (!subscription.value?.subscription_variation_ids) return [];
  try {
    return JSON.parse(subscription.value.subscription_variation_ids);
  } catch {
    return [];
  }
});

async function fetchProductDetails() {
  const items = parsedItems.value;
  const results: any[] = [];

  for (const item of items) {
    try {
      const { data: product, fetchProduct } = useProduct(item.productId.toString());

      const newProduct = await fetchProduct({
        id: item.productId.toString(),
        variationId: item.id.toString(),
      });

      console.log("newProduct Here : ", newProduct);


      if (!newProduct) {
        throw new Error("Product not found");
      }

      results.push({
        id: item.id,
        name: productGetters.getName(newProduct) ?? "Product",
        image: productGetters.getCoverImage(newProduct) ?? "/placeholder.png",
        price: item.price,
        quantity: item.quantity,
      });
    } catch {
      results.push({
        id: item.id,
        name: "Product",
        image: "/placeholder.png",
        price: item.price,
        quantity: item.quantity,
      });
    }
  }
  detailedItems.value = results;
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await axios.get(`/rest/orders-subscription/subscription/${route.params.subscriptionID}`);
    if (data && data.success && data.data) {
      subscription.value = data.data;
      let orderId = subscription.value?.order_id;
      
      await fetchProductDetails();
    } else {
      error.value = 'Subscription not found.';
    }
  } catch (e: any) {
    error.value = 'Failed to fetch subscription.';
  } finally {
    loading.value = false;
  }
});

const getRecurrenceIntervalTranslation = (interval: string) => {
  if (!interval) return '';
  const key = interval.replace(/ /g, '_');
  return t(`account.subscriptions.details.recurrence_interval.${key}`);
};
</script>
