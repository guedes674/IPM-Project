<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="error-modal" @click.stop>
      <div class="error-icon">
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
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div v-if="errorDetails" class="error-details">
        <div class="details-header" @click="toggleDetails">
          <span>Detalhes do erro</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="{ rotate: showDetails }"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div v-if="showDetails" class="details-content">
          {{ errorDetails }}
        </div>
      </div>
      <button class="primary-button" @click="$emit('close')">
        {{ buttonText }}
      </button>
      <button v-if="retry" class="retry-button" @click="$emit('retry')">
        Tentar Novamente
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from "vue";

defineEmits(["close", "retry"]);

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Erro",
  },
  message: {
    type: String,
    required: true,
  },
  errorDetails: {
    type: String,
    default: "",
  },
  buttonText: {
    type: String,
    default: "Fechar",
  },
  retry: {
    type: Boolean,
    default: false,
  },
});

const showDetails = ref(false);

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
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

.error-modal {
  background-color: var(--surface-dark);
  border-radius: 12px;
  width: 450px;
  max-width: 90%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: error-shake 0.5s cubic-bezier(0, 0.07, 0.58, 1);
}

@keyframes error-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-10px);
  }
  40%,
  80% {
    transform: translateX(10px);
  }
}

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(245, 101, 101, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #f56565;
}

.error-modal h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--text-light);
}

.error-modal p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.error-details {
  width: 100%;
  margin-bottom: 24px;
  border: 1px solid rgba(245, 101, 101, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.details-header {
  padding: 12px 16px;
  background-color: rgba(245, 101, 101, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  color: var(--text-light);
  font-weight: 500;
}

.details-header svg {
  transition: transform 0.3s ease;
}

.details-header svg.rotate {
  transform: rotate(180deg);
}

.details-content {
  padding: 16px;
  background-color: rgba(50, 61, 78, 1);
  color: var(--text-secondary);
  font-size: 14px;
  text-align: left;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
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
  margin-bottom: 12px;
}

.primary-button:hover {
  background-color: var(--hover-color);
  transform: translateY(-2px);
}

.retry-button {
  background-color: transparent;
  color: var(--text-light);
  border: 1px solid var(--text-secondary);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
</style>
