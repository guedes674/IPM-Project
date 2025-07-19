<template>
  <div v-if="show" class="modal-overlay" @click="$emit('cancel')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="close-button" @click="$emit('cancel')">×</button>
      </div>

      <div class="modal-content">
        <div class="modal-icon warning">
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
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            ></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="modal-message">{{ message }}</div>
        <div v-if="details" class="modal-details">{{ details }}</div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button
          class="confirm-button"
          :class="confirmButtonType"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

defineEmits(["confirm", "cancel"]);

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Confirmar Ação",
  },
  message: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: "",
  },
  confirmText: {
    type: String,
    default: "Confirmar",
  },
  cancelText: {
    type: String,
    default: "Cancelar",
  },
  confirmButtonType: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "approve", "danger", "reject"].includes(value),
  },
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

.modal-container {
  background-color: var(--surface-dark);
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.modal-content {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.modal-icon.warning {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

.modal-message {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-light);
  margin-bottom: 12px;
}

.modal-details {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 90%;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-button {
  background-color: rgba(50, 61, 78, 1);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: rgba(70, 81, 98, 1);
}

.confirm-button {
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-button.primary {
  background-color: var(--primary-color);
  color: #fff;
}

.confirm-button.primary:hover {
  background-color: var(--hover-color);
}

.confirm-button.approve {
  background-color: #48bb78;
  color: #fff;
}

.confirm-button.approve:hover {
  background-color: #38a169;
}

.confirm-button.danger,
.confirm-button.reject {
  background-color: #f56565;
  color: #fff;
}

.confirm-button.danger:hover,
.confirm-button.reject:hover {
  background-color: #e53e3e;
}
</style>
