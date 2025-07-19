<script setup>
import NotificationButton from "./NotificationButton.vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userName = ref("Aluno");
const userInitials = ref("A");

const goToProfile = () => {
  const userRole = localStorage.getItem("userRole");

  if (userRole === "director") {
    router.push({ name: "director-profile" });
  } else if (userRole === "student") {
    router.push({ name: "student-profile" });
  } else {
    router.push({ name: "login" });
  }
};

onMounted(() => {
  const storedName = localStorage.getItem("username");
  if (storedName) {
    userName.value = storedName;

    const nameParts = storedName.split(" ");
    if (nameParts.length > 1) {
      userInitials.value = `${nameParts[0][0]}${
        nameParts[nameParts.length - 1][0]
      }`;
    } else if (nameParts.length === 1) {
      userInitials.value = nameParts[0][0];
    }
  }
});
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="app-title">Gestão de Alunos</h1>
    </div>

    <div class="header-right">
      <NotificationButton />
      <div class="user-menu" @click="goToProfile">
        <img
          :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(
            userInitials
          )}&background=4880FF&color=ffffff`"
          :alt="`Avatar de ${userName}`"
          class="user-avatar"
        />
        <span class="user-name">{{ userName }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: var(--surface-dark);
  border-bottom: 1px solid var(--border-dark);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  z-index: 100;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-light);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-menu:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.user-name {
  color: var(--text-light);
  font-size: 14px;
  font-weight: 500;
}
</style>
