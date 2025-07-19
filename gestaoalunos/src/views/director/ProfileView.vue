<template>
  <div class="profile-view">
    <div class="section-header">
      <h1>Perfil</h1>
      <div class="section-actions"></div>
    </div>

    <div class="profile-content">
      <div class="profile-info-card">
        <div class="profile-header">
          <div class="profile-image">
            <img
              src="https://placeholder.pics/svg/100/DEDEDE/321FFF-222FFF/Jose"
              alt="Profile"
            />
            <div class="profile-name">{{ profileData.nome }}</div>
            <div class="profile-role">{{ profileData.profissao }}</div>
          </div>

          <div class="profile-details">
            <div class="details-section">
              <h2 class="section-title">Informação Pessoal</h2>
              <div class="details-grid">
                <div class="info-group">
                  <h3 class="info-title">Idade</h3>
                  <span class="info-value">{{ profileData.idade }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Localização</h3>
                  <span class="info-value">{{ profileData.localizacao }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Educação</h3>
                  <span class="info-value">{{ profileData.educacao }}</span>
                </div>

                <div class="info-group">
                  <h3 class="info-title">Interesses</h3>
                  <span class="info-value">{{ profileData.interesses }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="objectives-section">
          <h2 class="section-title">Objetivos e Desafios</h2>

          <div class="objectives-grid">
            <div class="objective-card">
              <div class="objective-icon">
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 class="objective-title">Objetivos</h3>
              <p class="objective-text">{{ profileData.objetivos }}</p>
            </div>

            <div class="objective-card">
              <div class="objective-icon">
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
                  <polygon
                    points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                  ></polygon>
                </svg>
              </div>
              <h3 class="objective-title">Desafios</h3>
              <p class="objective-text">{{ profileData.desafios }}</p>
            </div>
          </div>

          <div class="quote-card">
            <div class="quote-mark">"</div>
            <p class="quote-text">{{ profileData.citacao }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// Mock data that would come from a JSON server
const profileData = ref({
  nome: "José",
  idade: "35 Anos",
  localizacao: "Braga",
  educacao: "Doutoramento em informática",
  profissao: "Docente do ensino superior; diretor de curso",
  interesses: "Automóveis, futebol, séries",
  objetivos:
    "Manter o curso a funcionar de forma eficiente, minimizando o esforço burocrático de gestão; maximizar as possibilidades de aprendizagem dos alunos.",
  desafios:
    "Sucesso do curso leva a um número crescente de alunos inscritos. Soluções: Automatizar processos para diminuir trabalho burocrático.",
  citacao:
    "Eu gosto do que faço, mas a direção de curso ocupa-me muito tempo com tarefas de gestão com pouco valor acrescentado para o curso. O novo sistema deverá ajudar a minimizar isso. Espero que seja de utilização eficaz e eficiente.",
});

/* Future implementation:
import { ref, onMounted } from "vue";
import apiService from "@/services/apiServices";

const profileData = ref({});

onMounted(async () => {
  try {
    profileData.value = await apiService.getDirectorProfile();
  } catch (error) {
    console.error('Error loading profile data:', error);
  }
});
*/
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
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

.section-actions {
  display: flex;
  gap: 12px;
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

.objectives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.objective-card {
  background-color: var(--surface-darker);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border-dark);
  position: relative;
  overflow: hidden;
}

.objective-icon {
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

.objective-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-light);
}

.objective-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.quote-card {
  background: linear-gradient(
    to right,
    var(--surface-darker),
    var(--surface-dark)
  );
  padding: 32px;
  border-radius: 12px;
  border: 1px solid var(--border-dark);
  position: relative;
  margin-top: 24px;
}

.quote-mark {
  position: absolute;
  top: 20px;
  left: 24px;
  font-size: 80px;
  line-height: 0;
  color: rgba(72, 128, 255, 0.2);
  font-family: Georgia, serif;
  font-weight: 700;
}

.quote-text {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-secondary);
  font-style: italic;
  padding-left: 24px;
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
  .objectives-grid {
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

  .section-actions {
    width: 100%;
  }
}
</style>
