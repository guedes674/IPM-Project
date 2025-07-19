<template>
  <div class="notification-container">
    <button
      class="notification-button"
      @click="toggleNotifications"
      aria-label="Notificações"
    >
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
        class="bell-icon"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="notification-badge" v-if="unreadCount > 0">
        {{ unreadCount > 9 ? "9+" : unreadCount }}
      </span>
    </button>

    <div v-if="showNotifications" class="notification-dropdown">
      <div class="notification-header">
        <h3>Notificações</h3>
        <button
          class="clear-button"
          @click="clearNotifications"
          v-if="notifications.length > 0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Limpar todas</span>
        </button>
      </div>

      <div class="notification-list" v-if="notifications.length > 0">
        <div
          v-for="(notification, index) in notifications"
          :key="index"
          class="notification-item"
          @click="handleNotificationClick(notification, index)"
        >
          <div class="notification-dot" v-if="!notification.read"></div>
          <div class="notification-icon">
            <svg
              v-if="notification.type === 'warning'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
            <svg
              v-else-if="notification.type === 'info'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <svg
              v-else-if="notification.type === 'success'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
            <svg
              v-else-if="notification.type === 'request'"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div
            class="notification-content"
            :class="{ read: notification.read }"
          >
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
          <button
            class="notification-dismiss"
            @click.stop="removeNotification(index)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="notification-empty">
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
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
          <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
          <path d="M18 8a6 6 0 0 0-9.33-5"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
        <p>Não há notificações</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import apiService from "@/services/apiServices";
import { useRouter } from "vue-router";

const router = useRouter();
const showNotifications = ref(false);
const notifications = ref([]);
const isLoading = ref(false);

// Get user info from localStorage
const userId = parseInt(localStorage.getItem("userId") || "1");
const userRole = localStorage.getItem("userRole") || "director";

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.read).length;
});

const fetchNotifications = async () => {
  try {
    isLoading.value = true;
    const notifs = await apiService.getNotifications(userId, userRole);
    notifications.value = notifs;
  } catch (error) {
    console.error("Error fetching notifications:", error);
  } finally {
    isLoading.value = false;
  }
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const clearNotifications = () => {
  notifications.value = [];
};

const handleNotificationClick = async (notification, index) => {
  // Mark as read first
  await markAsRead(index);

  // Navigate based on notification type
  navigateToTarget(notification);

  // Close dropdown
  showNotifications.value = false;
};

const navigateToTarget = (notification) => {
  // Map notification types to routes
  switch (notification.type) {
    case "shift_request":
      if (notification.requestId) {
        router.push(`/requests?id=${notification.requestId}&type=shift`);
      } else {
        router.push("/requests");
      }
      break;

    case "classroom_request":
      if (notification.requestId) {
        router.push(`/requests?id=${notification.requestId}&type=classroom`);
      } else {
        router.push("/requests");
      }
      break;

    case "conflict":
      if (notification.conflictId) {
        const studentId = notification.message?.match(/Aluno ID (\d+)/)?.[1];
        console.log("Student ID:", studentId);
        if (studentId) {
          router.push(`/students/${studentId}`);
        } else {
          router.push("/students");
        }
      } else {
        router.push("/students");
      }
      break;

    case "shift_response":
      router.push("/schedule");
      break;

    case "schedule_update":
      router.push("/student-schedule");
      break;

    case "classroom_response":
      router.push("/classes");
      break;

    case "warning":
    case "info":
    case "success":
    case "request":
      if (notification.message?.includes("turno")) {
        router.push("/shifts");
      } else if (notification.message?.includes("sala")) {
        router.push("/classrooms");
      } else if (notification.message?.includes("aluno")) {
        router.push("/students");
      } else {
        console.log("No specific route for this notification type");
      }
      break;

    default:
      // Handle unknown notification types or stay on the current page
      console.log("Unknown notification type:", notification.type);
  }
};

const markAsRead = async (index) => {
  try {
    const notification = notifications.value[index];
    await apiService.markNotificationAsRead(notification.id, userRole);
    notifications.value[index].read = true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

const removeNotification = (index) => {
  notifications.value.splice(index, 1);
};

// Fetch notifications when component mounts
onMounted(() => {
  fetchNotifications();
});
</script>
<style scoped>
.notification-container {
  position: relative;
}

.notification-button {
  width: 40px;
  height: 40px;
  background-color: var(--surface-darker);
  border-radius: 8px;
  border: 1px solid var(--border-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.notification-button:hover {
  background-color: var(--surface-lighter);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.bell-icon {
  color: var(--text-secondary);
  transition: all var(--transition-fast) ease;
}

.notification-button:hover .bell-icon {
  color: var(--text-light);
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: var(--danger-color);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--background-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: -12px;
  background: var(--surface-dark);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  width: 350px;
  max-height: 500px;
  overflow-y: auto;
  z-index: 1000;
  border: 1px solid var(--border-dark);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-dark);
  background-color: var(--surface-darker);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.notification-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all var(--transition-fast) ease;
}

.clear-button:hover {
  color: var(--danger-color);
  background-color: rgba(255, 77, 79, 0.1);
}

.notification-list {
  padding: 0.5rem 0;
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-dark);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.notification-item:hover {
  background-color: var(--surface-lighter);
}

.notification-dot {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background-color: var(--surface-darker);
  border-radius: 50%;
  color: var(--primary-color);
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-content.read {
  opacity: 0.7;
}

.notification-title {
  font-size: 0.9rem;
  color: var(--text-light);
  margin: 0;
  line-height: 1.4;
}

.notification-message {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.notification-dismiss {
  visibility: hidden;
  opacity: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  padding: 0;
  transition: all var(--transition-fast) ease;
}

.notification-item:hover .notification-dismiss {
  visibility: visible;
  opacity: 1;
}

.notification-dismiss:hover {
  background-color: rgba(255, 77, 79, 0.15);
  color: var(--danger-color);
}

.notification-empty {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.notification-empty svg {
  opacity: 0.6;
}

.notification-empty p {
  margin: 0;
}
</style>
