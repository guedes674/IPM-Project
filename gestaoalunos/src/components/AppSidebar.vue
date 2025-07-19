<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import LogoutButton from "./LogoutButton.vue";

const route = useRoute();
const router = useRouter();

// Get user role from localStorage
const userRole = ref(localStorage.getItem("userRole") || "director");

// Define navigation items based on role
const directorNavItems = [
  {
    name: "Perfil",
    path: "/profile",
    icon: "profile",
  },
  {
    name: "Pedidos",
    path: "/requests",
    icon: "requests",
  },
  {
    name: "Alunos",
    path: "/students",
    icon: "students",
  },
  {
    name: "Turnos",
    path: "/shifts",
    icon: "shifts",
  },
];

const studentNavItems = [
  {
    name: "Perfil",
    path: "/student-profile",
    icon: "profile",
  },
  {
    name: "Horário",
    path: "/student-schedule",
    icon: "schedule",
  },
  {
    name: "Meus Pedidos",
    path: "/student-requests",
    icon: "requests",
  },
  {
    name: "Unidades Curriculares",
    path: "/student-UCs",
    icon: "student-UCs",
  },
];

const navigationItems = computed(() => {
  return userRole.value === "director" ? directorNavItems : studentNavItems;
});

const isRouteActive = (navPath) => {
  return (
    route.path === navPath ||
    (navPath !== "/" && route.path.startsWith(navPath))
  );
};

const navigateTo = (path) => {
  router.push(path);
};

const handleLogout = () => {
  // Clear authentication data
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  localStorage.removeItem("userId");

  // Redirect to login page
  router.push("/login");
};

// Function to return the correct SVG based on icon name
const getIconSvg = (iconName) => {
  switch (iconName) {
    case "profile":
      return "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";
    case "requests":
      return "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M14 2v4H8v-4 M11 14H9 M15 14h-2 M11 18H9 M15 18h-2";
    case "students":
      return "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75";
    case "shifts":
      return "M12 2v10 M12 22v-4 M4.93 10.93l1.41 1.41 M19.07 12.34l-1.41-1.41 M2 18h2 M20 18h2 M6 18a6 6 0 1 1 12 0";
    case "schedule":
      return "M17 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01 M16 18h.01";
    case "new-request":
      return "M12 9v6 M9 12h6 M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z";
    case "student-UCs":
      return "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.5 14.5h-3v-3h3zm0-4.5h-3v-3h3zm4.5 4.5h-3v-3h3zm0-4.5h-3v-3h3z";
    default:
      return "";
  }
};
</script>

<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li
          v-for="item in navigationItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isRouteActive(item.path) }"
          @click="navigateTo(item.path)"
        >
          <div class="nav-icon">
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
              <path :d="getIconSvg(item.icon)"></path>
            </svg>
          </div>
          <span class="nav-text">{{ item.name }}</span>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <div class="user-role">
        {{ userRole === "director" ? "Diretor de Curso" : "Aluno" }}
      </div>
      <LogoutButton @click="handleLogout" />
    </div>
  </aside>
</template>

<style scoped>
.user-role {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 500;
  padding: 8px 16px;
  background-color: var(--surface-darker);
  border-radius: 6px;
}

.app-sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  width: 280px;
  background-color: var(--surface-dark);
  border-right: 1px solid var(--border-dark);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: all var(--transition-medium) ease;
}

.sidebar-nav {
  padding: 24px 12px;
  flex: 1;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
}

.nav-item:hover {
  background-color: var(--surface-lighter);
  color: var(--text-light);
  transform: translateX(4px);
}

.nav-item.active {
  background-color: var(--primary-color);
  color: var(--text-light);
  box-shadow: 0 4px 8px rgba(72, 128, 255, 0.25);
}

.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-dark);
}
</style>
