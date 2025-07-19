<template>
  <div class="app-wrapper">
    <template v-if="!isLoginPage">
      <AppHeader />
      <AppSidebar />
      <main class="main-content">
        <router-view></router-view>
      </main>
    </template>
    <router-view v-else></router-view>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";

const route = useRoute();
const isLoginPage = computed(() => route.path === "/login");
</script>

<style>
:root {
  /* Primary colors */
  --primary-color: #4880ff;
  --primary-hover: #2b6eff;
  --primary-active: #1a5eef;

  /* Dark theme colors */
  --background-dark: #1a2130;
  --surface-dark: #222b3c;
  --surface-darker: #1c2534;
  --surface-lighter: #2d3a4d;
  --border-dark: #3d4b60;

  /* Text colors */
  --text-light: #ffffff;
  --text-secondary: #b6c5e1;

  /* Action colors */
  --hover-color: #3a70ea;
  --danger-color: #f53e3e;
  --danger-hover: #e12929;

  /* Feedback colors */
  --success-color: #22c55e;
  --warning-color: #eab308;
  --info-color: #3b82f6;

  /* System colors (aliases) */
  --surface-color: var(--surface-dark);
  --background-color: var(--background-dark);
  --border-color: var(--border-dark);
  --text-primary: var(--text-light);
  --accent-color: #3a70ea;

  /* Animation durations */
  --transition-fast: 0.2s;
  --transition-medium: 0.3s;
  --transition-slow: 0.5s;
}

body {
  margin: 0;
  font-family: "Inter", "Nunito Sans", sans-serif;
  background-color: var(--background-dark);
  color: var(--text-light);
  transition: background-color var(--transition-medium) ease;
}

.app-wrapper {
  min-height: 100vh;
  background-color: var(--background-dark);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-medium) ease;
}

.main-content {
  margin-left: 280px;
  margin-top: 70px;
  padding: 32px;
  min-height: calc(100vh - 70px);
  max-width: calc(100vw - 280px);
  box-sizing: border-box;
  transition: margin var(--transition-medium) ease;
}

.card {
  background-color: var(--surface-dark);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-dark);
  transition: all var(--transition-medium) ease;
}

.card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

/* General input and button styles */
input,
button,
select,
textarea {
  font-family: "Inter", sans-serif;
  transition: all var(--transition-fast) ease;
}

button {
  cursor: pointer;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-medium) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--surface-darker);
}

::-webkit-scrollbar-thumb {
  background: var(--border-dark);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
