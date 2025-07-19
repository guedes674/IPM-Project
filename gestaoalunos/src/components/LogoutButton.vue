<template>
  <div
    class="logout-button"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keypress.enter="$emit('click')"
  >
    <div class="logout-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    </div>
    <span>Logout</span>
  </div>
</template>

<script setup>
defineEmits(["click"]);
</script>

<style scoped>
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-medium) ease;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.15) 0%,
    rgba(239, 68, 68, 0.25) 100%
  );
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  gap: 10px;
  width: 100%;
}

.logout-button:hover {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(239, 68, 68, 0.35) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.4);
}

.logout-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

.logout-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
}

.logout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-medium) ease;
}

.logout-button:hover .logout-icon {
  transform: translateX(3px);
}
</style>
