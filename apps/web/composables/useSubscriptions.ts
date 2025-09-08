import { ref } from 'vue';
import type { Ref } from 'vue';

interface Subscription {
  id: string;
  customer_id: string;
  order_id: string;
  has_subscription_items: string;
  status: string;
  order_date: string;
  recurrence_interval: string;
  recurrence_count: string;
  next_order_date: string;
  subscription_total: string;
  subscription_variation_ids: number[];
  created_at: string;
  updated_at: string;
}

interface SubscriptionResponse {
  success: boolean;
  data: {
    subscriptions: Subscription[];
    count: number;
  };
}

export function useSubscriptions() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const subscriptions: Ref<Subscription[]> = ref([]);
  const count = ref(0);
  const { data: customer } = useCustomer();

  const fetchSubscriptions = async () => {
    const customerId = customer.value?.user?.id;
    
    if (!customerId) {
      error.value = 'Customer not found';
      return;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const rawResponse = await $fetch<string>(`/rest/orders-subscription/customer/${customerId}/subscriptions`, {
        method: 'GET',
      });

      const response = JSON.parse(rawResponse) as SubscriptionResponse;
      console.log('Parsed response:', response);
      
      if (response.success) {
        console.log('Subscriptions array:', response.data.subscriptions);
        subscriptions.value = response.data.subscriptions;
        count.value = response.data.count;
      } else {
        error.value = 'Failed to fetch subscriptions';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      error.value = err instanceof Error ? err.message : 'An error occurred while fetching subscriptions';
    } finally {
      loading.value = false;
    }
  };

  const disableSubscription = async (subscriptionId: string) => {
    try {
      const rawResponse = await $fetch<string>(`/rest/orders-subscription/subscription/${subscriptionId}/disable`, {
        method: 'POST',
      });
      const response = JSON.parse(rawResponse) as { success: boolean };

      if (response.success) {
        // Update the local subscription status
        subscriptions.value = subscriptions.value.map(subscription => 
          subscription.id === subscriptionId 
            ? { ...subscription, status: 'disabled' }
            : subscription
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Disable subscription error:', err);
      error.value = 'Failed to disable subscription';
      return false;
    }
  };

  return {
    loading,
    error,
    subscriptions,
    count,
    fetchSubscriptions,
    disableSubscription,
  };
} 