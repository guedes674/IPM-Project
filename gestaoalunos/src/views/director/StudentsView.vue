<template>
  <div class="students-container">
    <header class="students-header">
      <h1>Alunos</h1>
    </header>

    <main class="students-content">
      <div class="actions-bar">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Pesquisar alunos..."
            @input="handleSearch"
          />
        </div>
        <button class="publish-button" @click="publishSchedules">
          Publicar Horarios
        </button>
      </div>

      <div class="students-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item name-column">Nome</div>
          <div class="header-item status-column">Estatuto</div>
          <div class="header-item actions-column">Ações</div>
        </div>

        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando alunos..." />
        </div>

        <div v-else-if="filteredStudents.length === 0" class="empty-state">
          <p>Nenhum aluno encontrado.</p>
        </div>

        <div v-else class="table-content">
          <div
            v-for="student in paginatedStudents"
            :key="student.id"
            class="table-row"
          >
            <div class="cell id-column">{{ student.id }}</div>
            <div class="cell name-column">{{ student.name }}</div>
            <div class="cell status-column">{{ student.status }}</div>
            <div class="cell actions-column">
              <button
                class="details-button"
                @click="viewStudentDetails(student.id)"
              >
                Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination-controls">
        <div class="pagination-info">
          Mostrando {{ startItem }}-{{ endItem }} de
          {{ filteredStudents.length }} resultados
        </div>

        <div class="pagination-buttons">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            :class="{ disabled: currentPage === 1 }"
            class="pagination-button"
          >
            Anterior
          </button>

          <span class="page-numbers">
            <button
              v-for="page in displayedPages"
              :key="page"
              @click="goToPage(page)"
              :class="{ active: currentPage === page }"
              class="page-number"
            >
              {{ page }}
            </button>
          </span>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="{ disabled: currentPage === totalPages }"
            class="pagination-button"
          >
            Próximo
          </button>
        </div>
      </div>
    </main>
    <ConfirmationModal
      v-if="showConfirmModal"
      :show="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      :confirmText="'Publicar'"
      :cancelText="'Cancelar'"
      @confirm="confirmPublish"
      @cancel="cancelPublish"
    />

    <SuccessModal
      v-if="showSuccessModal"
      :show="showSuccessModal"
      :title="successModalTitle"
      :message="successModalMessage"
      @close="closeSuccessModal"
    />

    <ErrorModal
      v-if="showErrorModal"
      :show="showErrorModal"
      :title="errorModalTitle"
      :message="errorModalMessage"
      :details="errorDetails"
      @retry="retryPublish"
      @close="closeErrorModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiServices";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import LoadingState from "@/components/LoadingState.vue";

const router = useRouter();
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(true);
const students = ref([]);

// Estados para os modais
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);

// Conteúdo dos modais
const confirmModalTitle = ref("Publicar Horários");
const confirmModalMessage = ref(
  "Tem certeza que deseja publicar os horários para todos os alunos? Esta ação enviará notificações a todos os alunos cujos horários foram modificados."
);

const successModalTitle = ref("Horários Publicados");
const successModalMessage = ref(
  "Os horários foram publicados com sucesso e as notificações foram enviadas aos alunos."
);

const errorModalTitle = ref("Erro ao Publicar");
const errorModalMessage = ref("Não foi possível publicar os horários.");
const errorDetails = ref("");

// Funções para gerenciar a publicação de horários
const publishSchedules = () => {
  showConfirmModal.value = true;
};

const confirmPublish = async () => {
  showConfirmModal.value = false;

  try {
    // Chamar o método do apiService para publicar horários e notificar alunos
    const result = await apiService.publishAllSchedules();

    // Atualizar a mensagem de sucesso com base no resultado
    successModalMessage.value =
      result.message || "Os horários foram publicados com sucesso.";

    // Mostrar modal de sucesso
    showSuccessModal.value = true;
  } catch (error) {
    console.error("Erro ao publicar horários:", error);
    errorModalMessage.value = "Não foi possível publicar os horários.";
    errorDetails.value = error.message || JSON.stringify(error);
    showErrorModal.value = true;
  }
};

const cancelPublish = () => {
  showConfirmModal.value = false;
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

const closeErrorModal = () => {
  showErrorModal.value = false;
};

const retryPublish = () => {
  closeErrorModal();
  publishSchedules();
};

// Fetch students from API
const fetchStudents = async () => {
  isLoading.value = true;
  try {
    const data = await apiService.getStudents();
    students.value = data.map((student) => ({
      id: student.id,
      name: student.name,
      status: student.specialStatus ? "Trabalhador-Estudante" : "Normal",
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
  } finally {
    isLoading.value = false;
  }
};

// Função para pesquisar (com debounce)
let searchTimeout = null;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1; // Voltar para a primeira página ao pesquisar
  }, 300);
};

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value;

  const query = searchQuery.value.toLowerCase();
  return students.value.filter(
    (student) =>
      student.id.toString().toLowerCase().includes(query) ||
      student.name.toLowerCase().includes(query) ||
      student.status.toLowerCase().includes(query)
  );
});

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / itemsPerPage.value);
});

const startItem = computed(() => {
  return filteredStudents.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredStudents.value.length
  );
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredStudents.value.slice(start, end);
});

// Exibe até 5 números de página, centralizados na página atual
const displayedPages = computed(() => {
  if (totalPages.value <= 5) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  let start = Math.max(currentPage.value - 2, 1);
  let end = Math.min(start + 4, totalPages.value);

  if (end === totalPages.value) {
    start = Math.max(end - 4, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

const viewStudentDetails = (studentId) => {
  router.push({
    name: "student-details",
    params: { id: studentId },
  });
};

// Resetar página ao atualizar os filtros
watch([searchQuery], () => {
  currentPage.value = 1;
});

// Carregar dados iniciais
onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.students-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.students-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.students-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--text-light);
}

.students-content {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 19px;
  padding: 10px 20px;
  border: 1px solid rgba(207, 207, 207, 0.114);
  color: #fff;
  width: 300px;
}

.search-box input {
  background: transparent;
  border: none;
  color: #fff;
  width: 100%;
  outline: none;
  font-size: 14px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.publish-button {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 6px 14px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.publish-button:hover {
  background-color: rgba(100, 148, 255, 1);
}

.students-table {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  border: 1px solid rgba(49, 61, 79, 1);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 14px 14px 0 0;
  display: flex;
  padding: 15px 31px;
  font-weight: 800;
  border-bottom: 1px solid rgba(49, 61, 79, 1);
  width: 100%;
}

.header-item {
  white-space: nowrap;
  padding: 0 10px;
  text-align: left;
}

/* Larguras específicas para cada coluna */
.id-column {
  width: 15%;
  min-width: 100px;
}

.name-column {
  width: 50%;
  min-width: 200px;
}

.status-column {
  width: 20%;
  min-width: 120px;
}

.actions-column {
  width: 15%;
  min-width: 120px;
  text-align: center;
}

.table-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.table-row {
  display: flex;
  padding: 15px 31px;
  align-items: center;
  font-weight: 600;
  border-bottom: 1px solid rgba(49, 61, 79, 0.5);
  transition: background-color 0.2s;
  width: 100%;
}

.table-row:hover {
  background-color: rgba(50, 61, 78, 0.3);
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details-button {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 8px 15px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.details-button:hover {
  background-color: rgba(100, 148, 255, 1);
}

.pagination-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  font-size: 14px;
  font-weight: 600;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-button {
  background-color: rgba(50, 61, 78, 1);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-number {
  background-color: rgba(50, 61, 78, 1);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-number.active {
  background-color: rgba(72, 128, 255, 1);
}

.pagination-button:hover,
.page-number:hover {
  background-color: rgba(72, 128, 255, 0.7);
}

.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(50, 61, 78, 0.7);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  flex-grow: 1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: rgba(72, 128, 255, 1);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-wrapper {
  flex-grow: 1;
  display: flex;
  min-height: 300px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 991px) {
  .students-container {
    padding: 1.5rem;
  }

  .actions-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .students-container {
    padding: 1rem;
  }

  .students-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header,
  .table-row {
    padding: 10px 15px;
  }

  .actions-column {
    min-width: unset;
  }

  .details-button {
    width: 100%;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
