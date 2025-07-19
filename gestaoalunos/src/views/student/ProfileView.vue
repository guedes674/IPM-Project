<template>
  <div class="profile-view">
    <div class="section-header">
      <h1>Perfil do Estudante</h1>
    </div>

    <div class="profile-content">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando perfil...</p>
      </div>

      <div v-else class="profile-info-card">
        <div class="profile-header">
          <div class="profile-image">
            <img
              :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(
                profileData.name
              )}&background=4880FF&color=ffffff&size=180`"
              alt="Profile"
            />
            <div class="profile-name">{{ profileData.name }}</div>
            <div class="profile-role">Estudante</div>
          </div>

          <div class="profile-details">
            <div class="details-section">
              <h2 class="section-title">Informação Pessoal</h2>
              <div class="details-grid">
                <div class="info-group">
                  <h3 class="info-title">ID de Estudante</h3>
                  <span class="info-value">{{ profileData.id }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Email</h3>
                  <span class="info-value">{{ profileData.email }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Status</h3>
                  <span class="info-value">{{
                    profileData.specialStatus
                      ? "Trabalhador-Estudante"
                      : "Regular"
                  }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Disciplinas Inscritas</h3>
                  <span class="info-value"
                    >{{ enrolledCourses.length }} disciplinas</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="objectives-section">
          <h2 class="section-title">Disciplinas Inscritas</h2>

          <div class="courses-grid">
            <div
              v-for="course in enrolledCourses"
              :key="course.id"
              class="course-card"
            >
              <div class="course-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3 class="course-title">{{ course.name }}</h3>
              <p class="course-code">{{ course.abbreviation }}</p>
              <p class="course-info">
                Ano {{ course.year }}, Semestre {{ course.semester }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import apiService from "@/services/apiServices";

// Estado dos dados
const profileData = ref({});
const enrolledCourses = ref([]);
const isLoading = ref(true);

// Carregar dados do perfil
const loadProfileData = async () => {
  isLoading.value = true;
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("ID do usuário não encontrado");
      return;
    }

    // Buscar dados do estudante
    const student = await apiService.getStudentById(userId);
    profileData.value = student;

    // Buscar dados das disciplinas inscritas
    if (student.enrolled && student.enrolled.length > 0) {
      const coursesPromises = student.enrolled.map((courseId) =>
        apiService.getCourseById(courseId)
      );
      enrolledCourses.value = await Promise.all(coursesPromises);
    }
  } catch (error) {
    console.error("Erro ao carregar dados do perfil:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadProfileData();
});
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeIn var(--transition-medium) ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: rgba(72, 128, 255, 1);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.section-header {
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-light);
}

.profile-content {
  width: 100%;
}

.profile-info-card {
  background-color: var(--surface-dark);
  border: 1px solid var(--border-dark);
  border-radius: 16px;
  padding: 32px;
  color: var(--text-light);
  font-family: "Inter", "Nunito Sans", sans-serif;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.profile-header {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.profile-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-image img {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--primary-color);
  box-shadow: 0 0 0 4px rgba(72, 128, 255, 0.2);
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  margin-top: 16px;
  color: var(--text-light);
}

.profile-role {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 200px;
  text-align: center;
  margin-top: 4px;
}

.profile-details {
  flex: 1;
}

.details-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--primary-color);
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), transparent);
  border-radius: 2px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.info-group {
  background-color: var(--surface-darker);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-dark);
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-light);
}

.objectives-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--border-dark);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.course-card {
  background-color: var(--surface-darker);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border-dark);
  transition: all 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.course-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: rgba(72, 128, 255, 0.15);
  border-radius: 50%;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.course-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-light);
}

.course-code {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.course-info {
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 991px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .profile-image {
    margin-bottom: 24px;
  }

  .details-grid,
  .courses-grid {
    grid-template-columns: 1fr;
  }

  .profile-info-card {
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
