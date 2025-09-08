<template>
  <ClientOnly>
    <UiDivider class="col-span-3 -mx-4 !w-auto md:mx-0" />
    <h2
      class="hidden md:block col-span-3 typography-headline-4 font-bold mx-4 capitalize"
      data-testid="account-subscriptions-heading"
    >
      {{ t('account.subscriptions.section.mySubscriptions') }}
    </h2>

    <div v-if="loading">
      <SfLoaderCircular class="absolute top-0 bottom-0 right-0 left-0 m-auto z-[999]" size="2xl" />
    </div>

    <div v-if="error" class="col-span-3 text-center text-red-500 my-4">
      {{ error }}
    </div>

    <div
      v-else-if="!subscriptions.length"
      class="col-span-3 text-center"
      data-testid="account-subscriptions-content"
    >
      <h3 class="typography-headline-3 font-bold mt-6 mb-4">{{ t('account.subscriptions.emptySubscriptions') }}</h3>
      <UiButton :tag="NuxtLink" :to="localePath(paths.category)" variant="secondary" class="!ring-neutral-200">
        {{ t('account.ordersAndReturns.continue') }}
      </UiButton>
    </div>
    <div v-else class="col-span-3" data-testid="account-subscriptions-content">
      <div class="relative col-span-3" :class="{ 'pointer-events-none opacity-50': loading }">
        <template v-if="viewport.isLessThan('md')">
          <ul v-for="subscription in subscriptions" :key="subscription.id" class="my-4 last-of-type:mb-0">
            <li>
              <p class="block typography-text-sm font-medium">{{ t('account.subscriptions.details.subscriptionId') }}</p>
              <span class="block typography-text-sm mb-2">{{ subscription.id }}</span>
            </li>
            <li>
              <p class="block typography-text-sm font-medium">{{ t('account.subscriptions.details.orderDate') }}</p>
              <span class="block typography-text-sm mb-2">{{ subscription.order_date }}</span>
            </li>
            <li>
              <p class="block typography-text-sm font-medium">{{ t('account.subscriptions.details.total') }}</p>
              <span class="block typography-text-sm mb-2">{{ $n(Number(Number(subscription.subscription_total).toFixed(2)), 'currency') }}</span>
            </li>
            <li>
              <p class="block typography-text-sm font-medium">{{ t('account.subscriptions.details.status') }}</p>
              <span class="block typography-text-sm mb-2 capitalize">{{
                t(`account.subscriptions.details.status_options.${subscription.status}`)
              }}</span>
            </li>
            <li>
              <p class="block typography-text-sm font-medium">{{ t('account.subscriptions.details.recurrence') }}</p>
              <span class="block typography-text-sm mb-2 capitalize"
                >{{ getRecurrenceIntervalTranslation(subscription.recurrence_interval) }} ({{
                  subscription.recurrence_count
                }}x)</span
              >
            </li>
            <li class="mt-4">
              <UiButton
                v-if="subscription.status !== 'disabled'"
                variant="secondary"
                size="sm"
                @click="handleDisable(subscription.id)"
                :disabled="disablingId === subscription.id"
              >
                {{
                  disablingId === subscription.id
                    ? t('account.subscriptions.details.disabling')
                    : t('account.subscriptions.details.disable')
                }}
              </UiButton>
            </li>
            <UiDivider class="col-span-3 -mx-4 !w-auto md:mx-0" />
          </ul>
        </template>
        <table v-else class="md:block md:overflow-x-auto text-left typography-text-sm w-auto mx-4 scrollbar-hidden">
          <caption class="hidden">
            {{
              t('account.subscriptions.details.listCaption')
            }}
          </caption>
          <thead class="border-b-2 border-neutral-200">
            <tr>
              <th class="lg:py-4 py-2 lg:pr-4 pr-2 font-medium">
                {{ t('account.subscriptions.details.subscriptionId') }}
              </th>
              <th class="lg:p-4 p-2 font-medium lg:whitespace-nowrap">
                {{ t('account.subscriptions.details.orderDate') }}
              </th>
              <th class="lg:p-4 p-2 font-medium">{{ t('account.subscriptions.details.total') }}</th>
              <th class="lg:p-4 p-2 font-medium">{{ t('account.subscriptions.details.status') }}</th>
              <th class="lg:p-4 p-2 font-medium">{{ t('account.subscriptions.details.recurrence') }}</th>
              <th class="lg:p-4 p-2 font-medium">{{ t('account.subscriptions.details.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subscription in subscriptions" :key="subscription.id" class="border-b border-neutral-200">
              <td class="lg:py-4 py-2 lg:pr-4 pr-2 lg:whitespace-nowrap">{{ subscription.id }}</td>
              <td class="lg:p-4 p-2 lg:whitespace-nowrap">{{ subscription.order_date }}</td>
              <td class="lg:p-4 p-2">{{ $n(Number(Number(subscription.subscription_total).toFixed(2)), 'currency') }}</td>
              <td class="lg:p-4 p-2 capitalize">
                {{ t(`account.subscriptions.details.status_options.${subscription.status}`) }}
              </td>
              <td class="lg:p-4 p-2 capitalize">
                {{ getRecurrenceIntervalTranslation(subscription.recurrence_interval) }} ({{
                  subscription.recurrence_count
                }}x)
              </td>
              <td class="lg:p-4 p-2">
                <UiButton
                  v-if="subscription.status !== 'disabled'"
                  variant="secondary"
                  size="sm"
                  @click="handleDisable(subscription.id)"
                  :disabled="disablingId === subscription.id"
                >
                  {{
                    disablingId === subscription.id
                      ? t('account.subscriptions.details.disabling')
                      : t('account.subscriptions.details.disable')
                  }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { SfLoaderCircular } from '@storefront-ui/vue';
import { paths } from '~/utils/paths';

definePageMeta({
  layout: 'account',
  pageType: 'static',
  middleware: ['auth-guard'],
});

const NuxtLink = resolveComponent('NuxtLink');
const localePath = useLocalePath();
const { t } = useI18n();
const viewport = useViewport();
const { send } = useNotification();

const { loading, error, subscriptions, fetchSubscriptions, disableSubscription } = useSubscriptions();
const disablingId = ref<string | null>(null);

const getRecurrenceIntervalTranslation = (interval: string) => {
  if (!interval) return '';
  const key = interval.replace(/ /g, '_');
  return t(`account.subscriptions.details.recurrence_interval.${key}`);
};

const handleDisable = async (subscriptionId: string) => {
  disablingId.value = subscriptionId;
  try {
    const success = await disableSubscription(subscriptionId);
    if (!success) {
      // Show error notification or handle error
      console.error('Failed to disable subscription');
    } else {
      // Show success notification and reload page after 3s
      send({ message: t('account.subscriptions.disableSuccess'), type: 'positive' });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  } finally {
    disablingId.value = null;
  }
};

onMounted(() => {
  fetchSubscriptions();
});
</script>
