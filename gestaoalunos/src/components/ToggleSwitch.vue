<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="toggle-container">
    <div
      class="toggle-switch"
      :class="{ active: modelValue }"
      @click="emit('update:modelValue', !modelValue)"
    >
      <div class="toggle-handle"></div>
    </div>
  </div>
</template>

<style scoped>
.toggle-container {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 24px;
  background-color: #e6e8ea;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.toggle-switch.active {
  background-color: #4880ff;
}

.toggle-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-handle {
  transform: translateX(16px);
}
</style>
