<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import Checkbox from "../components/Checkbox.vue";
import apiService from "@/services/apiServices";

const router = useRouter();
const showPassword = ref(false);
const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const isDirector = ref(false);
const loginError = ref("");
const isLoading = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async (event) => {
  // Prevent default form submission
  if (event) event.preventDefault();

  if (!username.value || !password.value) {
    loginError.value = "Por favor, insira usuário e senha";
    return;
  }

  loginError.value = "";
  isLoading.value = true;

  try {
    const role = isDirector.value ? "director" : "student";
    const user = await apiService.login(username.value, password.value, role);

    // Store user info in localStorage
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("username", user.name);
    localStorage.setItem("userId", user.id);

    if (rememberMe.value) {
      localStorage.setItem("rememberMe", "true");
    }

    router.push("/");
  } catch (error) {
    loginError.value = "Usuário ou senha inválidos";
    console.error("Login error:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-content">
        <div class="login-header">
          <div class="login-title">LOGIN</div>
          <div class="role-toggle">
            <ToggleSwitch v-model="isDirector" />
            <div class="role-labels">
              <div class="role-label" :class="{ active: !isDirector }">
                Aluno
              </div>
              <div class="role-label" :class="{ active: isDirector }">
                Diretor de Curso
              </div>
            </div>
          </div>
        </div>

        <form class="login-form" @submit="handleLogin">
          <div v-if="loginError" class="error-message">
            {{ loginError }}
          </div>

          <div class="input-wrapper">
            <input
              type="text"
              placeholder="Username"
              v-model="username"
              class="login-input"
              name="username"
              autocomplete="username"
            />
          </div>

          <div class="input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              v-model="password"
              class="login-input"
              name="password"
              autocomplete="current-password"
            />
            <span class="eye-icon" @click="togglePasswordVisibility">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6C7 6 2.73 9.11 1 12C2.73 14.89 7 18 12 18C17 18 21.27 14.89 23 12C21.27 9.11 17 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z"
                  fill="currentColor"
                />
                <line
                  v-if="!showPassword"
                  x1="2"
                  y1="2"
                  x2="22"
                  y2="22"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
            </span>
          </div>

          <div class="form-footer">
            <div class="remember-section">
              <Checkbox v-model="rememberMe" />
              <span class="remember-text">Lembrar</span>
            </div>
            <button
              type="submit"
              class="login-button"
              :disabled="isLoading"
              :class="{ loading: isLoading }"
            >
              <span v-if="isLoading" class="spinner"></span>
              <span v-else>Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background-dark);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 650px;
  background-color: var(--surface-dark);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.login-content {
  padding: 40px;
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.login-title {
  color: var(--primary-color);
  font-family: "Istok Web", sans-serif;
  font-size: 42px;
  font-weight: 700;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.error-message {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.input-wrapper {
  position: relative;
}

.login-input {
  width: 100%;
  height: 62px;
  padding: 12px 16px;
  border: 2px solid var(--border-dark);
  border-radius: 8px;
  font-size: 20px;
  color: var(--text-light);
  font-weight: 300;
  background-color: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.login-input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(72, 128, 255, 0.2);
}

.login-input::placeholder {
  color: var(--text-secondary);
}

.eye-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-secondary);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.login-button {
  width: 180px;
  height: 56px;
  border-radius: 8px;
  border: none;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button:hover:not(:disabled) {
  background-color: var(--hover-color);
  transform: translateY(-2px);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled,
.login-button.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.remember-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.remember-text {
  color: var(--text-secondary);
  font-size: 16px;
}

.role-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-labels {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-label {
  font-size: 16px;
  line-height: 24px;
  color: var(--text-secondary);
  transition: color 0.3s;
}

.role-label.active {
  color: var(--primary-color);
  font-weight: 500;
}

@media (max-width: 768px) {
  .login-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .login-content {
    padding: 30px;
  }

  .role-toggle {
    align-self: flex-end;
  }

  .login-button {
    width: 155px;
  }
}
</style>
