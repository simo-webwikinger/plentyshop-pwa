<template>
  <div class="flex items-center justify-center py-6 px-4">
    <div
      v-for="(step, index) in steps"
      :key="step.name"
      class="flex items-center"
    >
      <!-- Step -->
      <div
        class="flex items-center"
        :class="getStepClasses(index + 1)"
      >
        <svg
          v-if="index + 1 <= currentStep"
          class="w-5 h-5 mr-2 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <span :class="{ 'font-bold': currentStep === index + 1 }">{{ step.name }}</span>
        <div v-if="step.info" class="relative group ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-center text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
            {{ step.tooltipText }}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
          </div>
        </div>
      </div>

      <!-- Connector -->
      <div
        v-if="index < steps.length - 1"
        class="w-16 mx-2 border-t-2"
        :class="currentStep > index + 1 ? 'border-primary-500' : 'border-gray-300'"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
});

const steps = ref([
  { name: '1. Konfiguration' },
  { name: '2. Zahlung', info: true, tooltipText: 'Im zweiten Schritt muss der Kunde eine 0-Euro-Zahlung leisten, um die wiederkehrende Zahlung zu speichern' },
  { name: '3. Übersicht' },
]);

const getStepClasses = (stepIndex: number) => {
  if (props.currentStep === stepIndex) {
    return 'bg-primary-100 text-primary-800 border border-primary-500 rounded-lg px-3 py-1.5';
  }
  if (props.currentStep > stepIndex) {
    return 'text-gray-900';
  }
  return 'text-gray-500';
};
</script>
