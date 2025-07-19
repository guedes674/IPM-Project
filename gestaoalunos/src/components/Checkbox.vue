<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const toggle = () => {
  emit("update:modelValue", !props.modelValue);
};
</script>

<template>
  <div class="checkbox" @click="toggle" :class="{ checked: modelValue }">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Simplified circle background -->
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="white"
        stroke="#333"
        stroke-width="2"
      />

      <!-- Checkmark that only shows when checked -->
      <path
        v-if="modelValue"
        d="M7 12L10 15L17 8"
        stroke="#4880FF"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<style scoped>
.checkbox {
  width: 25px;
  height: 25px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox.checked {
  color: #4880ff;
}

.checkbox svg {
  filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1));
}
</style>
