<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click="autoClose ? $emit('close') : null"
  >
    <div class="success-modal" @click.stop>
      <div class="success-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button class="primary-button" @click="$emit('close')">
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Sucesso!",
  },
  message: {
    type: String,
    required: true,
  },
  buttonText: {
    type: String,
    default: "OK",
  },
  autoClose: {
    type: Boolean,
    default: false,
  },
  autoCloseDelay: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(["close"]);

let autoCloseTimer = null;

// Handle ESC key to close modal
const handleKeyDown = (e) => {
  if (e.key === "Escape" && props.show) {
    emit("close");
  }
};

// Setup and clear auto-close timer
const setupAutoClose = () => {
  clearAutoCloseTimer();

  if (props.autoClose && props.show) {
    autoCloseTimer = setTimeout(() => {
      emit("close");
    }, props.autoCloseDelay);
  }
};

const clearAutoCloseTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
};

// Watch for show changes to handle auto-close
watch(
  () => props.show,
  (newValue) => {
    if (newValue && props.autoClose) {
      setupAutoClose();
    }
  }
);

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
  setupAutoClose();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  clearAutoCloseTimer();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.success-modal {
  background-color: var(--surface-dark);
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: success-appear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: transform, opacity;
}

@keyframes success-appear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(72, 187, 120, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #48bb78;
}

.success-modal h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--text-light);
}

.success-modal p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.primary-button {
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-button:hover {
  background-color: var(--hover-color);
  transform: translateY(-2px);
}
</style>
