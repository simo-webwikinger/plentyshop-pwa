<template>
  <div class="relative flex border-neutral-200 border-b min-w-[320px] py-4 last:mb-0" data-testid="subscription-product-card">
    <div class="flex items-start min-w-[180px] flex-1">
      <div class="flex-shrink-0 mr-4">
        <input
          type="checkbox"
          :checked="isSelected"
          @change="$emit('toggle-selection', cartItem.variationId)"
          class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
        />
      </div>
      
      <div class="flex mb-[-13%] lg:mb-0">
        <div class="relative overflow-hidden w-[100px] sm:w-[128px] kl-card-image-zoom">
          <SfLink :tag="NuxtLink" :to="path" class="flex items-center justify-center">
            <NuxtImg
              ref="img"
              :src="addModernImageExtension(cartItemImage) || '/images/placeholder.png'"
              :alt="cartGetters.getItemName(cartItem)"
              loading="lazy"
              class="w-full h-auto" />
            <SfLoaderCircular v-if="!imageLoaded" class="absolute" size="sm" />
          </SfLink>
        </div>

        <div class="pl-4">
          <SfLink
            :tag="NuxtLink"
            :to="path"
            variant="secondary"
            class="w-fit no-underline g-12 lg:g-16 mt-2 block">
            {{ cartGetters.getItemName(cartItem) }}
          </SfLink>

          <p class="g-12-m lg:g-16-m mt-1">
            Einzelpreis: {{ n(cartItem.price, 'currency') }}
          </p>

          <div v-if="!cartItem.variation?.bundleComponents">
            {{ n(cartGetters.getCartItemPrice(cartItem), 'currency') }}
          </div>

          <div v-if="!cartItem.variation?.bundleComponents">
            <div v-if="cartItem.variation" class="mt-2">
              <BasePrice
                v-if="productGetters.showPricePerUnit(cartItem.variation)"
                :base-price="basePriceSingleValue"
                :unit-content="productGetters.getUnitContent(cartItem.variation)"
                :unit-name="productGetters.getUnitName(cartItem.variation)" />
            </div>
            <div class="my-2">
              <ul class="text-xs font-normal leading-5 sm:typography-text-sm text-neutral-700">
                <li v-for="attribute in cartGetters.getItemAttributes(cartItem)" :key="attribute.name">
                  <span class="mr-1">{{ attribute.label }}:</span>
                  <span class="font-medium">{{ attribute.value }}</span>
                </li>
              </ul>
              <div
                class="text-xs font-normal leading-5 sm:typography-text-sm text-neutral-700"
                v-if="cartItem.basketItemOrderParams.length > 0">
                <div class="text-[15px]">{{ t('orderProperties.additionalCostsPerItem') }}:</div>
                <CartOrderProperty
                  v-for="property in cartItem.basketItemOrderParams"
                  :key="property.propertyId"
                  :cart-item="cartItem"
                  :basket-item-order-param="property" />
              </div>
              <div
                v-if="cartGetters.getVariation(cartItem)"
                class="text-xs font-normal leading-5 sm:typography-text-sm text-neutral-700 mt-3">
                <VariationProperties :product="cartGetters.getVariation(cartItem)" />
              </div>
            </div>
          </div>
          <div v-if="cartItem.variation?.bundleComponents" class="my-2 mb-6">
            <div v-for="(item, index) in cartItem.variation.bundleComponents" :key="index">
              <SfLink
                :tag="NuxtLink"
                v-if="productBundleGetters.isItemBundleSalable(item)"
                :to="localePath(productBundleGetters.getBundleItemUrl(item))"
                variant="secondary"
                class="no-underline typography-text-sm">
                {{ productBundleGetters.getBundleItemQuantity(item) }}x
                <span class="px-1 h-">{{ productBundleGetters.getBundleItemName(item) }}</span>
              </SfLink>
            </div>
          </div>
        </div>
      </div>

      <span
        v-if="currentFullPrice"
        class="sm:order-1 g-12 lg:g-16 text-right mt-auto lg:mt-0 ml-auto">
        {{ n(currentFullPrice || 0, 'currency') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { productGetters, productBundleGetters, cartGetters } from '@plentymarkets/shop-api';
import { SfLink, SfLoaderCircular } from '@storefront-ui/vue';
import type { CartProductCardProps } from '~/components/SubscriptionProducts/types';
import type { Product } from '@plentymarkets/shop-api';
const NuxtLink = resolveComponent('NuxtLink');

interface Props extends CartProductCardProps {
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isSelected: false
});

const emit = defineEmits(['load', 'toggle-selection']);

const { addModernImageExtension, getImageForViewport } = useModernImage();
const { t, n } = useI18n();
const localePath = useLocalePath();

const imageLoaded = ref(false);
const img = ref();

onMounted(() => {
  const imgElement = (img.value?.$el as HTMLImageElement) || null;

  if (imgElement) {
    if (!imageLoaded.value) {
      if (imgElement.complete) imageLoaded.value = true;
      imgElement.addEventListener('load', () => (imageLoaded.value = true));
    }

    nextTick(() => {
      if (!imgElement.complete) emit('load');
    });
  }
});

const currentFullPrice = computed(() => {
  return cartGetters.getCartItemPrice(props.cartItem) * cartGetters.getItemQty(props.cartItem);
});

const cartItemImage = computed(() => {
  if (props.cartItem && props.cartItem.variation) {
    return getImageForViewport(props.cartItem.variation, 'CartProductCard');
  }
  return '';
});

const basePriceSingleValue = computed(
  () =>
    productGetters.getGraduatedPriceByQuantity(props.cartItem.variation ?? ({} as Product), props.cartItem.quantity)?.basePrice ??
    productGetters.getDefaultBasePrice(props.cartItem.variation ?? ({} as Product)),
);

const path = computed(() => localePath('/' + cartGetters.getProductPath(props.cartItem)));
</script>
