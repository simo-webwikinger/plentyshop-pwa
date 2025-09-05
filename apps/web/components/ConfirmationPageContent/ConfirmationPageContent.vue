<template>
  <div class="px-4 md:px-0 flex items-center flex-col" data-testid="order-success-page">
    <div class="p-4 md:p-6 flex flex-col max-w-2xl mx-auto">
      <h1 class="mt-6 mb-1 g-40 text-center" data-testid="success-header">
        {{ !orderGetters.isReturn(order) ? t('successInfoOrderHeader') : t('successInfoReturnHeader') }}
      </h1>
      <div v-if="!orderGetters.isReturn(order)" class="font-medium text-center">{{ t('successInfoMessage') }}</div>
      <div v-if="order?.order?.deliveryAddress?.options?.length" class="font-medium text-center">
        {{ t('orderConfirmation.confirmationSendTo', { email: orderGetters.getOrderEmail(order) }) }}
      </div>
    </div>

    <CheckoutSteps v-if="showSubscriptionConfirmModal" :current-step="2" />
    <div class="flex flex-col md:flex-row w-full md:w-auto lg:w-3/4 flex-wrap gap-x-6">
      <div class="flex-1">
        <div class="rounded bg-gray-100 p-4 w-full my-4 text-sm">
          <OrderDetails :order="order" />
        </div>

        <div v-if="order?.order" id="order-items" class="flex flex-col my-4">
          <div v-for="(item, index) in orderGetters.getItems(order)" :key="item.id">
            <OrderSummaryProductCard
              v-if="!orderGetters.isBundleItem(item) && !orderGetters.isCouponItem(item)"
              :order="order"
              :order-item="item"
              :index="index"
              :class="{ 'border-t': index === 0 }"
            />
          </div>
        </div>

        <div class="rounded bg-gray-100 p-4 w-full my-4 text-sm">
          <OrderTotals :order="order" />
        </div>
      </div>
      <div class="flex-1">
        <div class="rounded bg-gray-100 p-4 w-full my-4 text-sm">
          <OrderShippingSummary :order="order" />
          <OrderPaymentSummary :order="order" />
          <OrderBankDetails v-if="bankDetails" :bank-details="bankDetails" />
        </div>

        <div
          v-if="!isAuthorized"
          class="rounded bg-gray-100 p-4 w-full mt-4 text-sm items-center flex flex-col"
        >
          <div class="font-bold text-primary-700 md:text-lg text-center mt-5">
            {{ t('orderConfirmation.saveOrderToAccount') }}
          </div>
          <div class="font-bold text-center mt-3">{{ t('orderConfirmation.createAccountForBenefits') }}</div>
          <UiButton variant="primary" class="mt-5 mb-5" @click="isAuthenticationOpen = true">
            {{ t('orderConfirmation.signUp') }}
          </UiButton>
        </div>

        <OrderDocumentsList :order="order" />

        <OrderReturnItems
          v-if="orderGetters.isReturnable(order) && orderGetters.hasReturnableItems(order)"
          :order="order"
        />
        <OrderAgainButton v-if="isAuthorized" :order="order" />
      </div>
    </div>

    <UiButton :tag="NuxtLink" :href="localePath(paths.home)" class="max-md:w-full mt-6 mb-8" variant="secondary">
      {{ t('continueShopping') }}
    </UiButton>
  </div>

  <UiModal
    v-if="isAuthenticationOpen"
    v-model="isAuthenticationOpen"
    tag="section"
    class="h-full md:w-[500px] md:h-fit m-0 p-0 overflow-y-auto"
    aria-labelledby="login-modal"
  >
    <header>
      <UiButton square variant="tertiary" class="absolute right-2 top-2" @click="closeAuthentication()">
        <SfIconClose />
      </UiButton>
    </header>
    <Register
      :order="order"
      :email-address="orderGetters.getOrderEmail(order)"
      :is-modal="true"
      :changeable-view="false"
      @registered="closeAuthentication"
    />
  </UiModal>

  <UiModal v-model="showSubscriptionConfirmModal" tag="section" class="h-full md:w-[400px] md:h-fit m-0 p-0 overflow-y-auto" aria-labelledby="subscription-confirm-modal">
    <header>
      <h3 class="text-lg font-bold mb-4">{{ t('account.subscriptions.confirmSubscription.title') }}</h3>
    </header>
    <div class="mb-4">{{ t('account.subscriptions.confirmSubscription.message') }}</div>
    <div class="flex justify-end gap-4">
      <UiButton variant="secondary" @click="cancelSubscription">{{ t('account.subscriptions.confirmSubscription.no') }}</UiButton>
      <UiButton variant="primary" @click="confirmSubscription">{{ t('account.subscriptions.confirmSubscription.yes') }}</UiButton>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { orderGetters } from '@plentymarkets/shop-api';
import { SfIconClose, useDisclosure } from '@storefront-ui/vue';
import type { ConfirmationPageContentProps } from './types';
import { paths } from '~/utils/paths';
import { useSelectedSubscriptions } from '~/composables/useSelectedSubscriptions';
import { useCustomer } from '~/composables/useCustomer';
import axios from 'axios';
import { ref } from 'vue';

const NuxtLink = resolveComponent('NuxtLink');
const { order } = defineProps<ConfirmationPageContentProps>();
const { t } = useI18n();
const { isOpen: isAuthenticationOpen, toggle: closeAuthentication } = useDisclosure();
const { isAuthorized, data: customer } = useCustomer();
const { getActiveShippingCountries } = useActiveShippingCountries();
const localePath = useLocalePath();
const bankDetails = orderGetters.getOrderPaymentBankDetails(order);
const selectedSubscriptions = useSelectedSubscriptions();
useProcessingOrder().processingOrder.value = false;

const { paymentMethods } = useCheckoutPagePaymentAndShipping();

const showSubscriptionConfirmModal = ref(false);

// Helper to get selected subscription variation IDs from sessionStorage
function getSelectedSubscriptionVariationIds() {
  try {
    const stored = sessionStorage.getItem('selectedSubscriptionVariationIds');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading selectedSubscriptionVariationIds from sessionStorage', e);
  }
  return [];
}

// Helper to get selected interval from sessionStorage
function getSelectedSubscriptionInterval() {
  try {
    const stored = sessionStorage.getItem('selectedSubscriptionInterval');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading selectedSubscriptionInterval from sessionStorage', e);
  }
  return '1 month';
}

// Helper to get selected recurrence count from sessionStorage
function getSelectedSubscriptionRecurrenceCount() {
  try {
    const stored = sessionStorage.getItem('selectedSubscriptionRecurrenceCount');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading selectedSubscriptionRecurrenceCount from sessionStorage', e);
  }
  return 12;
}

// Helper to get selected subscription products from sessionStorage
function getSelectedSubscriptionProducts() {
  try {
    const stored = sessionStorage.getItem('selectedSubscriptionProducts');
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Error reading selectedSubscriptionProducts', e); }
  return [];
}

// Helper to get selected subscription products total from sessionStorage
function getSelectedSubscriptionProductsTotal() {
  try {
    const stored = sessionStorage.getItem('selectedSubscriptionProductsTotal');
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Error reading selectedSubscriptionProductsTotal', e); }
  return 0;
}

// Add this function before the setup code
function calculateNextOrderDate(interval: string): string {
  const parts = interval.split(' ');
  if (parts.length !== 2) {
    // Default to tomorrow if interval is invalid
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  const number = parseInt(parts[0]);
  let unit = parts[1].toLowerCase();

  // Convert to singular form
  if (unit.endsWith('s')) {
    unit = unit.slice(0, -1);
  }

  const date = new Date();
  switch (unit) {
    case 'month':
      date.setMonth(date.getMonth() + number);
      break;
    case 'week':
      date.setDate(date.getDate() + (number * 7));
      break;
    case 'day':
      date.setDate(date.getDate() + number);
      break;
    default:
      date.setDate(date.getDate() + 1); // Default to tomorrow
  }

  return date.toISOString().split('T')[0];
}

// Handle subscription creation and payment if needed
const handleSubscriptionPayment = async () => {
  // Find the payment method object for the current order by name
  const paymentMethodsList = paymentMethods.value?.list || [];
  const usedPayment = paymentMethodsList.find(
    (pm) => pm.name === order.paymentMethodName
  );
  // Check if this payment method is a Mollie method
  const isMolliePayment = usedPayment?.key === 'Mollie';

  // Get selected subscription variation IDs, interval, and recurrence count from session
  const selectedVariationIds = getSelectedSubscriptionVariationIds();
  const selectedInterval = getSelectedSubscriptionInterval();
  const selectedRecurrenceCount = getSelectedSubscriptionRecurrenceCount();
  const selectedProducts = getSelectedSubscriptionProducts();
  const selectedProductsTotal = getSelectedSubscriptionProductsTotal();
  
  // Get all variation IDs from the order
  const orderVariationIds = Object.keys(order?.variations || {}).map(Number);

  // First verify which products are subscription products from the order
  const { data: verifiedOrderSubscriptionProducts } = await axios.post('/rest/orders-subscription/verify-products', {
    productIds: orderVariationIds
  });

  // Filter to include only those that are also explicitly selected by the user
  const finalSubscriptionProductIds = (verifiedOrderSubscriptionProducts?.subscriptionProductIds || []).filter((id: number) => 
    selectedVariationIds.includes(id)
  );
  const hasSubscriptionItems = finalSubscriptionProductIds.length > 0;
  const subscriptionProductsPayload = [];

  if (order?.order?.orderItems) {
    for (const orderItem of order.order.orderItems) {
      if (finalSubscriptionProductIds.includes(orderItem.itemVariationId)) {
        subscriptionProductsPayload.push({
          productId: order.variations[orderItem.itemVariationId]?.item.id,
          id: orderItem.itemVariationId,
          quantity: orderItem.quantity,
          price: orderItem.amounts?.[0]?.priceGross * orderItem.quantity || 0,
        });
      }
    }
  }
  
  // Check if a subscription already exists for this order
  try {
    const { data: existingSub } = await axios.get(`/rest/orders-subscription/order/${order.order.id}/subscription`);
    if (existingSub.success && existingSub.data?.subscription) {
      // Subscription exists, do not show modal or run logic
      return;
    }
  } catch (e) {
    // Log the error and proceed to show modal
    console.error('Error checking for existing subscription:', e);
  }

  if (isMolliePayment && hasSubscriptionItems) {

    showSubscriptionConfirmModal.value = true;
    return; // Wait for user confirmation
  }
};

const confirmSubscription = async () => {
  showSubscriptionConfirmModal.value = false;
  // ... move the subscription creation and payment logic here ...
  // Get selected subscription variation IDs, interval, and recurrence count from session
  const selectedVariationIds = getSelectedSubscriptionVariationIds();
  const selectedInterval = getSelectedSubscriptionInterval();
  const selectedRecurrenceCount = getSelectedSubscriptionRecurrenceCount();
  const selectedProducts = getSelectedSubscriptionProducts();
  const selectedProductsTotal = getSelectedSubscriptionProductsTotal();

  // Get all variation IDs from the order
  const orderVariationIds = Object.keys(order?.variations || {}).map(Number);

  // First verify which products are subscription products from the order
  const { data: verifiedOrderSubscriptionProducts } = await axios.post('/rest/orders-subscription/verify-products', {
    productIds: orderVariationIds
  });
  
  // Filter to include only those that are also explicitly selected by the user
  const finalSubscriptionProductIds = (verifiedOrderSubscriptionProducts?.subscriptionProductIds || []).filter((id: number) => 
    selectedVariationIds.includes(id)
  );
  const hasSubscriptionItems = finalSubscriptionProductIds.length > 0;
  const subscriptionProductsPayload = [];

  if (hasSubscriptionItems) {
    if (order?.order?.orderItems) {
      for (const orderItem of order.order.orderItems) {
        if (finalSubscriptionProductIds.includes(orderItem.itemVariationId)) {
          subscriptionProductsPayload.push({
            productId: order.variations[orderItem.itemVariationId]?.item.id,
            id: orderItem.itemVariationId,
            quantity: orderItem.quantity,
            price: orderItem.amounts?.[0]?.priceGross || 0,
          });
        }
      }
    }

    const subscriptionData = {
      customer_id: customer.value.user?.id,
      email: customer.value.user?.email,
      name: `${customer.value.user?.firstName} ${customer.value.user?.lastName}`.trim(),
      order_id: order.order.id,
      has_subscription_items: true,
      status: 'active',
      recurrence_interval: selectedInterval,
      recurrence_count: selectedRecurrenceCount,
      order_date: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(),
      next_order_date: calculateNextOrderDate(selectedInterval),
      subscription_products: selectedProducts,
      subscription_total: selectedProductsTotal,
      subscription_variation_ids: subscriptionProductsPayload
    };

    let mollieCustomerId, savedSubscriptionId;
    try {
      const { data } = await axios.post('/rest/orders-subscription/save-subscription', subscriptionData);
      mollieCustomerId = data?.data?.mollie_customer?.mollie_data?.id;
      savedSubscriptionId = data?.data?.subscription?.id;
    } catch (error) {
      console.error('Error saving subscription:', error);
      return;
    }

    // Then handle the payment
    const paymentPayload = {
      amount: "0.0",
      currency: "EUR",
      customer_id: customer.value.user?.id,
      name: `${customer.value.user?.firstName} ${customer.value.user?.lastName}`.trim(),
      email: customer.value.user?.email,
      redirect_url: window.location.origin + "/subscription/" + savedSubscriptionId,
      webhook_url: useRuntimeConfig().public.apiEndpoint +"/rest/orders-subscription/webhook/mollie",
    };

    try {
      const { data: paymentResponse } = await axios.post(
        "/rest/orders-subscription/payments/first",
        paymentPayload
      );

      if (!paymentResponse.success) {
        console.error('Error creating subscription payment:', paymentResponse);
        return;
      }

      await navigateTo(paymentResponse.data.checkoutUrl, { external: true });
    } catch (error) {
      console.error('Error creating subscription payment:', error);
    }
  }
};

const cancelSubscription = () => {
  showSubscriptionConfirmModal.value = false;
};

onMounted(async () => {
  await getActiveShippingCountries();
  await usePaymentMethods().fetchPaymentMethods();
  await handleSubscriptionPayment();
});
</script>
