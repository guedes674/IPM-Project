<template>
  <div class="shifts-container">
    <header class="shifts-header">
      <h1>Gerenciamento de Turnos</h1>
    </header>

    <main class="shifts-content">
      <div class="shifts-actions">
        <div class="search-box">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Pesquisar turnos..."
            @input="handleSearch"
          />
        </div>
        <button class="publish-button" @click="publishSchedules">
          <i class="ti ti-calendar"></i>
          Publicar Horarios
        </button>
      </div>

      <div class="shifts-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item uc-column">UC</div>
          <div class="header-item type-column">Tipo</div>
          <div class="header-item shift-column">Nr do Turno</div>
          <div class="header-item occupation-column">Ocupação</div>
          <div class="header-item actions-column">Ações</div>
        </div>

        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando turnos..." />
        </div>

        <div v-else-if="filteredShifts.length === 0" class="empty-state">
          <p>Nenhum turno encontrado.</p>
        </div>

        <div v-else class="table-content">
          <div
            v-for="shift in paginatedShifts"
            :key="shift.id"
            class="table-row"
          >
            <div class="cell id-column">{{ shift.id }}</div>
            <div class="cell uc-column">{{ shift.ucName }}</div>
            <div class="cell type-column">{{ shift.type }}</div>
            <div class="cell shift-column">{{ shift.shiftNumber }}</div>
            <div class="cell occupation-column">
              {{ shift.current }}/{{ shift.capacity }}
            </div>
            <div class="cell actions-column">
              <button
                class="details-button"
                @click="viewShiftDetails(shift.id)"
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
          {{ filteredShifts.length }} resultados
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
      :show="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      :confirmText="'Publicar'"
      :cancelText="'Cancelar'"
      @confirm="confirmPublish"
      @cancel="cancelPublish"
    />

    <SuccessModal
      :show="showSuccessModal"
      :title="successModalTitle"
      :message="successModalMessage"
      @close="closeSuccessModal"
    />

    <ErrorModal
      :show="showErrorModal"
      :title="errorModalTitle"
      :message="errorModalMessage"
      :error-details="errorDetails"
      :retry="true"
      @close="closeErrorModal"
      @retry="retryPublish"
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

// Modal state
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);

// Modal content
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

const router = useRouter();

// Data and pagination state
const shifts = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const searchTerm = ref("");
const sortKey = ref("id");
const sortOrder = ref("asc");

// Fetch shifts data from API
const fetchShifts = async () => {
  isLoading.value = true;
  try {
    const data = await apiService.getShifts();

    // Handle potentially missing fields
    shifts.value = data.map((shift) => ({
      id: shift.id || "N/A",
      ucName: shift.ucName || "Curso desconhecido",
      type: shift.type || "Teorica",
      shiftNumber: shift.shiftNumber || "T1",
      current: shift.current || 0,
      capacity: shift.capacity,
      occupationRatio: `${shift.current || 0}/${shift.capacity}`,
    }));
  } catch (error) {
    console.error("Error fetching shifts:", error);
    // Provide fallback data in case of error
    shifts.value = [
      {
        id: "1",
        ucName: "Erro ao carregar dados",
        type: "Teorica",
        shiftNumber: "T1",
        current: 0,
        capacity: 25,
        occupationRatio: "0/25",
      },
    ];
  } finally {
    isLoading.value = false;
  }
};

// Filtered and sorted shifts
const filteredShifts = computed(() => {
  let result = [...shifts.value];

  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    result = result.filter(
      (shift) =>
        shift.id.toString().toLowerCase().includes(search) ||
        shift.ucName.toLowerCase().includes(search) ||
        shift.type.toLowerCase().includes(search) ||
        shift.shiftNumber.toLowerCase().includes(search)
    );
  }

  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0;
    if (a[sortKey.value] > b[sortKey.value]) {
      comparison = 1;
    } else if (a[sortKey.value] < b[sortKey.value]) {
      comparison = -1;
    }
    return sortOrder.value === "asc" ? comparison : -comparison;
  });

  return result;
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredShifts.value.length / itemsPerPage.value);
});

const startItem = computed(() => {
  return filteredShifts.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredShifts.value.length
  );
});

const paginatedShifts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredShifts.value.slice(start, end);
});

// Display up to 5 page numbers, centered on current page
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

// Page navigation functions
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

// Search with debounce
let searchTimeout = null;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1; // Return to first page when searching
  }, 300);
};

// Navigate to shift details
const viewShiftDetails = (shiftId) => {
  router.push({
    name: "shift-details",
    params: { id: shiftId },
  });
};

// Publish schedules
const publishSchedules = () => {
  showConfirmModal.value = true;
};

const confirmPublish = async () => {
  showConfirmModal.value = false;

  try {
    // Call API to publish schedules
    await apiService.publishAllSchedules();

    // Mark all shifts as published
    shifts.value = shifts.value.map((shift) => ({
      ...shift,
      published: true,
    }));

    // Refresh shifts data
    await fetchShifts();

    // Show success message
    showSuccessModal.value = true;
  } catch (error) {
    console.error("Error publishing schedules:", error);
    errorDetails.value = error.message || "Erro desconhecido";
    showErrorModal.value = true;
  }
};

// Modal control functions
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
  showErrorModal.value = false;
  publishSchedules();
};

// Reset to first page when search changes
watch([searchTerm], () => {
  currentPage.value = 1;
});

// Load initial data
onMounted(() => {
  fetchShifts();
});
</script>

<style scoped>
.shifts-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.shifts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.shifts-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--text-light);
}

.shifts-content {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.shifts-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.shifts-table {
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
  transition: color 0.2s;
  padding: 0 10px;
  text-align: left;
}

.id-column {
  width: 10%;
  min-width: 80px;
}

.uc-column {
  width: 35%;
  min-width: 200px;
}

.type-column {
  width: 15%;
  min-width: 120px;
}

.shift-column {
  width: 15%;
  min-width: 100px;
}

.occupation-column {
  width: 15%;
  min-width: 100px;
  text-align: center;
}

.actions-column {
  width: 10%;
  min-width: 100px;
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
  padding: 8px 25px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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

.loading-wrapper {
  flex-grow: 1;
  display: flex;
  min-height: 300px;
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

@media (max-width: 991px) {
  .shifts-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .table-header,
  .table-row {
    padding-left: 15px;
    padding-right: 15px;
  }

  .id-column,
  .type-column,
  .shift-column,
  .occupation-column,
  .actions-column {
    min-width: unset;
  }

  .uc-column {
    min-width: 150px;
  }
}

@media (max-width: 768px) {
  .shifts-container {
    padding: 1rem;
  }

  .shifts-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .table-header,
  .table-row {
    flex-wrap: wrap;
  }

  .header-item,
  .cell {
    width: 100%;
    padding: 5px 0;
  }

  .header-item:not(:first-child),
  .cell:not(:first-child) {
    border-top: 1px solid rgba(49, 61, 79, 0.3);
  }

  .actions-column {
    text-align: left;
  }
}
</style>
