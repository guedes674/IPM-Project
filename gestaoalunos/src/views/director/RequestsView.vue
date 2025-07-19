<template>
  <div class="requests-container">
    <header class="requests-header">
      <h1>Pedidos</h1>
    </header>

    <main class="requests-content">
      <!-- Search and Filters -->
      <div class="content-header">
        <div class="actions-bar">
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Pesquisar pedidos..."
              @input="handleSearch"
            />
          </div>
        </div>

        <div class="filter-section">
          <!-- Status Filter -->
          <div class="filter-group">
            <div class="filter-label">Status:</div>
            <div class="filter-options">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                class="filter-btn"
                :class="{ active: selectedStatus === status.value }"
                @click="selectedStatus = status.value"
              >
                {{ status.label }}
              </button>
            </div>
          </div>

          <!-- Type Filter -->
          <div class="filter-group">
            <div class="filter-label">Tipo:</div>
            <div class="filter-options">
              <button
                v-for="type in typeOptions"
                :key="type.value"
                class="filter-btn"
                :class="{ active: selectedType === type.value }"
                @click="selectedType = type.value"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="requests-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item type-column">Tipo</div>
          <div class="header-item student-column">Aluno</div>
          <div class="header-item course-column">Disciplina</div>
          <div class="header-item date-column">Data</div>
          <div class="header-item status-column">Status</div>
          <div class="header-item actions-column">Ações</div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando pedidos..." />
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredRequests.length === 0" class="empty-state">
          <p>Nenhum pedido encontrado.</p>
        </div>

        <!-- Requests List -->
        <div v-else class="table-content">
          <div
            v-for="(request, index) in paginatedRequests"
            :key="request.id"
            class="request-row-container"
          >
            <!-- Main Row -->
            <div class="table-row">
              <div class="cell id-column" data-label="ID:">
                #{{ request.id }}
              </div>
              <div class="cell type-column" data-label="Tipo:">
                <span
                  class="type-badge"
                  :class="getTypeBadgeClass(request.type)"
                >
                  {{ request.type }}
                </span>
              </div>
              <div class="cell student-column" data-label="Aluno:">
                {{ request.student }}
              </div>
              <div class="cell course-column" data-label="Unidade Curricular:">
                {{ request.course || "N/A" }}
              </div>
              <div class="cell date-column" data-label="Data:">
                {{ request.date }}
              </div>
              <div class="cell status-column" data-label="Status:">
                <span class="status-badge" :class="request.status">
                  {{ getStatusLabel(request.status) }}
                </span>
              </div>
              <div class="cell actions-column">
                <div class="action-buttons">
                  <button
                    class="action-btn details-btn"
                    @click="toggleDetails(index)"
                    :title="
                      expandedRequests[index]
                        ? 'Ocultar detalhes'
                        : 'Mostrar detalhes'
                    "
                  >
                    <span class="btn-text"
                      >{{
                        expandedRequests[index] ? "Ocultar" : "Mostrar"
                      }}
                      Detalhes</span
                    >
                  </button>

                  <button
                    class="action-btn resolve-btn"
                    @click="resolveRequest(request)"
                    title="Resolver este pedido"
                  >
                    <span class="btn-text">Resolver</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Expanded Details -->
            <div v-if="expandedRequests[index]" class="request-details">
              <div class="details-grid">
                <!-- Person Details Card -->
                <div class="detail-card">
                  <div class="detail-card-header">
                    <h3>
                      {{
                        request.type && request.type.includes("Sala")
                          ? "Dados do Professor"
                          : "Dados do Aluno"
                      }}
                    </h3>
                  </div>
                  <div class="detail-card-content">
                    <div class="detail-item">
                      <div class="detail-label">Nome:</div>
                      <div class="detail-value">
                        {{ request.student || request.teacher || "N/A" }}
                      </div>
                    </div>
                    <div
                      class="detail-item"
                      v-if="!request.type || !request.type.includes('Sala')"
                    >
                      <div class="detail-label">Status:</div>
                      <div class="detail-value">
                        {{ request.studentStatus || "Regular" }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Specific Type Details -->
                <div
                  class="detail-card"
                  v-if="!request.type || request.type.includes('Turno')"
                >
                  <div class="detail-card-header">
                    <h3>Dados do Turno</h3>
                  </div>
                  <div class="detail-card-content">
                    <div class="detail-item">
                      <div class="detail-label">UC:</div>
                      <div class="detail-value">
                        {{ request.course || "N/A" }}
                      </div>
                    </div>
                    <div class="detail-item">
                      <div class="detail-label">Turno:</div>
                      <div class="detail-value">
                        {{ request.shiftName || "N/A" }}
                      </div>
                    </div>
                    <div
                      class="detail-item"
                      v-if="request.requestData?.alternativeShiftId"
                    >
                      <div class="detail-label">Pretende:</div>
                      <div class="detail-value">
                        {{ request.alternativeShiftName || "N/A" }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="detail-card"
                  v-else-if="request.type && request.type.includes('Sala')"
                >
                  <div class="detail-card-header">
                    <h3>Dados da Sala</h3>
                  </div>
                  <div class="detail-card-content">
                    <div class="detail-item">
                      <div class="detail-label">Sala:</div>
                      <div class="detail-value">
                        {{ request.building || "CP1" }}
                        {{
                          request.roomNumber ||
                          `#${request.requestData?.classroomId}` ||
                          "N/A"
                        }}
                      </div>
                    </div>
                    <div class="detail-item">
                      <div class="detail-label">Unidade Curricular:</div>
                      <div class="detail-value">
                        {{ request.course || "N/A" }}
                      </div>
                    </div>
                    <div
                      class="detail-item"
                      v-if="request.requestData?.shiftId"
                    >
                      <div class="detail-label">Turno:</div>
                      <div class="detail-value">
                        {{
                          request.shiftName || `#${request.requestData.shiftId}`
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Request Reason -->
              <div class="reason-section" v-if="request.reason">
                <h3 class="reason-header">Motivo do pedido</h3>
                <div class="reason-content">{{ request.reason }}</div>
              </div>

              <!-- Response Section -->
              <div class="reason-section" v-if="request.response">
                <h3
                  class="reason-header"
                  :class="{
                    approved: request.response === 'approved',
                    rejected: request.response === 'rejected',
                  }"
                >
                  <i :class="getResponseIcon(request.response)"></i>
                  Resposta
                </h3>
                <div class="reason-content">
                  {{ getResponseText(request.response) }}
                </div>
              </div>

              <!-- Action Buttons for Pending Requests -->
              <div class="details-actions" v-if="isPendingRequest(request)">
                <button
                  class="approve-action-btn"
                  @click="approveRequest(request)"
                >
                  Aprovar
                </button>
                <button
                  class="reject-action-btn"
                  @click="rejectRequest(request)"
                >
                  Rejeitar
                </button>
              </div>

              <!-- Action Buttons for Approved Requests -->
              <div
                class="details-actions"
                v-else-if="isApprovedRequest(request)"
              >
                <button
                  class="resolve-action-btn"
                  @click="resolveRequest(request)"
                >
                  Ver Detalhes do Aluno
                </button>
                <button
                  class="confirm-action-btn"
                  @click="confirmRequestDone(request)"
                >
                  Marcar como Implementado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" v-if="filteredRequests.length > 0">
        <div class="pagination-info">
          Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }}-{{
            Math.min(currentPage * itemsPerPage, filteredRequests.length)
          }}
          de {{ filteredRequests.length }} resultados
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
              class="page-number"
              :class="{ active: currentPage === page }"
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

    <!-- Modals -->
    <ConfirmationModal
      :show="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      :details="confirmModalDetails"
      :confirm-text="getConfirmButtonText()"
      :confirm-button-type="getConfirmButtonType()"
      @confirm="confirmAction"
      @cancel="cancelAction"
    />

    <SuccessModal
      :show="showSuccessModal"
      :title="successModalTitle"
      :message="successModalMessage"
      button-text="OK"
      :auto-close="true"
      :auto-close-delay="3000"
      @close="closeSuccessModal"
    />

    <ErrorModal
      :show="showErrorModal"
      :title="errorModalTitle"
      :message="errorModalMessage"
      :error-details="errorDetails"
      :retry="!!retryAction"
      @close="closeErrorModal"
      @retry="retryLastAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiServices";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import LoadingState from "@/components/LoadingState.vue";

// Router and state
const router = useRouter();
const searchQuery = ref("");
const selectedStatus = ref("all");
const selectedType = ref("all");
const isLoading = ref(true);
const requests = ref([]);
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Filter options
const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
];

const typeOptions = [
  { value: "all", label: "Todos" },
  {
    value: "shift-change",
    label: "Troca de Turno",
  },
  {
    value: "classroom-change",
    label: "Mudança de Sala",
  },
];

// Expanded request details control
const expandedRequests = reactive({});

// Modal states
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);

// Modal content
const confirmModalTitle = ref("");
const confirmModalMessage = ref("");
const confirmModalDetails = ref("");
const confirmActionType = ref(""); // 'approve', 'reject', 'confirm'
const currentRequest = ref(null);

const successModalTitle = ref("");
const successModalMessage = ref("");

const errorModalTitle = ref("Erro");
const errorModalMessage = ref("");
const errorDetails = ref("");
const retryAction = ref(null);

// Toggle details visibility
const toggleDetails = (index) => {
  expandedRequests[index] = !expandedRequests[index];
};

// Search with debounce
let searchTimeout = null;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
  }, 300);
};

// Fetch requests from API
const fetchRequests = async () => {
  isLoading.value = true;
  try {
    const allRequests = await apiService.getRequests("director", null);
    const enhancedRequests = await Promise.all(
      allRequests.map(async (request) => {
        try {
          // Handle shift change requests
          if (request.type.includes("Troca de Turno") && request.requestData) {
            await enhanceShiftRequest(request);
          }
          // Handle classroom change requests
          else if (
            request.type.includes("Mudança de Sala") &&
            request.requestData
          ) {
            await enhanceClassroomRequest(request);
          }
          return request;
        } catch (error) {
          console.error(`Error enhancing request ${request.id}:`, error);
          return request;
        }
      })
    );

    requests.value = enhancedRequests;
  } catch (error) {
    console.error("Error fetching requests:", error);
    requests.value = [];
    showErrorWithRetry(
      "Erro ao Carregar Pedidos",
      "Não foi possível carregar a lista de pedidos.",
      error,
      fetchRequests
    );
  } finally {
    isLoading.value = false;
  }
};

// Helper functions to enhance requests with additional data
const enhanceShiftRequest = async (request) => {
  if (request.requestData.shiftId) {
    try {
      const shift = await apiService.getShiftById(request.requestData.shiftId);
      request.shiftName = shift.name || `Turno ${shift.shiftNumber}`;
      request.shiftType = shift.type;

      if (shift.courseId) {
        try {
          const course = await apiService.getCourseById(shift.courseId);
          request.course = course.name;
        } catch (error) {
          console.error(`Error fetching course for shift ${shift.id}:`, error);
        }
      }
    } catch (error) {
      console.error(
        `Error fetching shift details for request ${request.id}:`,
        error
      );
    }
  }

  if (request.requestData.alternativeShiftId) {
    try {
      const altShift = await apiService.getShiftById(
        request.requestData.alternativeShiftId
      );
      request.alternativeShiftName =
        altShift.name || `Turno ${altShift.shiftNumber}`;
      request.alternativeShiftType = altShift.type;
    } catch (error) {
      console.error(
        `Error fetching alternative shift details for request ${request.id}:`,
        error
      );
    }
  }
};

const enhanceClassroomRequest = async (request) => {
  if (request.requestData.classroomId) {
    try {
      const classroom = await apiService.getClassroomById(
        request.requestData.classroomId
      );
      request.roomNumber = classroom.name;

      const buildings = await apiService.getBuildings();
      const building = buildings.find((b) => b.id === classroom.buildingId);
      request.building = building ? building.name : "CP1";

      if (request.requestData.shiftId) {
        try {
          const shift = await apiService.getShiftById(
            request.requestData.shiftId
          );
          request.shiftName = shift.name || shift.shiftNumber;

          if (shift.courseId) {
            try {
              const course = await apiService.getCourseById(shift.courseId);
              request.course = course.name;
            } catch (error) {
              console.error(
                `Error fetching course for shift ${shift.id}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error(
            `Error fetching shift details for classroom request ${request.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        `Error fetching classroom details for request ${request.id}:`,
        error
      );
    }
  }
};

const getTypeBadgeClass = (type) => {
  if (type.includes("Troca de Turno")) return "shift-change";
  if (type.includes("Mudança de Sala")) return "classroom-change";
  return "other";
};

const getResponseText = (response) => {
  if (response === "approved" || response === "ok") return "Pedido aprovado.";
  if (response === "rejected") return "Pedido rejeitado.";
  return response;
};

const getStatusLabel = (status) => {
  const statusMap = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };
  return statusMap[status] || status;
};

const isPendingRequest = (request) => {
  return (
    !request.response ||
    (request.response !== "approved" &&
      request.response !== "rejected" &&
      request.response !== "ok")
  );
};

const isApprovedRequest = (request) => {
  return request.response === "approved" || request.response === "ok";
};

// Filtered and sorted requests
const filteredRequests = computed(() => {
  let result = [...requests.value];

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (req) =>
        req.id.toString().toLowerCase().includes(query) ||
        req.type.toLowerCase().includes(query) ||
        (req.student && req.student.toLowerCase().includes(query)) ||
        (req.teacher && req.teacher.toLowerCase().includes(query)) ||
        (req.course && req.course.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  if (selectedStatus.value !== "all") {
    result = result.filter((req) => req.status === selectedStatus.value);
  }

  // Apply type filter
  if (selectedType.value !== "all") {
    if (selectedType.value === "shift-change") {
      result = result.filter((req) => req.type.includes("Troca de Turno"));
    } else if (selectedType.value === "classroom-change") {
      result = result.filter((req) => req.type.includes("Mudança de Sala"));
    }
  }

  // Sort: pending first, then by date
  result.sort((a, b) => {
    // Prioritize pending requests
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    // Then sort by date (newest first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  return result;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredRequests.value.length / itemsPerPage.value) || 1;
});

const paginatedRequests = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredRequests.value.slice(startIndex, endIndex);
});

const displayedPages = computed(() => {
  const totalPagesCount = totalPages.value;

  if (totalPagesCount <= 5) {
    return Array.from({ length: totalPagesCount }, (_, i) => i + 1);
  }

  const current = currentPage.value;
  let start = Math.max(current - 2, 1);
  let end = Math.min(start + 4, totalPagesCount);

  if (end - start < 4) {
    start = Math.max(end - 4, 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

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

// Request actions
const resolveRequest = (request) => {
  if (request.type && request.type.includes("Sala")) {
    const shiftId = request.requestData?.shiftId || request.shiftId;
    if (shiftId) {
      router.push(`/shifts/${shiftId}/details`);
    } else {
      showError(
        "Erro ao Resolver",
        "Não foi possível encontrar o turno associado a este pedido de sala."
      );
    }
  } else {
    const studentId = request.requestData?.studentId || request.studentId;
    if (studentId) {
      router.push(`/students/${studentId}`);
    } else {
      showError(
        "Erro ao Resolver",
        "Não foi possível encontrar o aluno associado a este pedido."
      );
    }
  }
};

const approveRequest = (request) => {
  if (!request) return;

  currentRequest.value = request;
  confirmActionType.value = "approve";
  confirmModalTitle.value = "Aprovar Pedido";
  confirmModalMessage.value = `Tem certeza que deseja aprovar o pedido #${request.id}?`;
  confirmModalDetails.value = `Este pedido é de ${request.type} do aluno ${
    request.student
  }${request.course ? ` para a Unidade Curricular ${request.course}` : ""}.`;
  showConfirmModal.value = true;
};

const rejectRequest = (request) => {
  if (!request) return;

  currentRequest.value = request;
  confirmActionType.value = "reject";
  confirmModalTitle.value = "Rejeitar Pedido";
  confirmModalMessage.value = `Tem certeza que deseja rejeitar o pedido #${request.id}?`;
  confirmModalDetails.value = `Este pedido é de ${request.type} do aluno ${
    request.student
  }${request.course ? ` para a Unidade Curricular ${request.course}` : ""}.`;
  showConfirmModal.value = true;
};

const confirmRequestDone = (request) => {
  if (!request) return;

  currentRequest.value = request;
  confirmActionType.value = "confirm";
  confirmModalTitle.value = "Confirmar Conclusão";
  confirmModalMessage.value = `Confirmar que o pedido #${request.id} foi totalmente implementado?`;
  confirmModalDetails.value =
    "Este pedido foi aprovado e agora será marcado como totalmente concluído no sistema.";
  showConfirmModal.value = true;
};

const confirmAction = async () => {
  if (!currentRequest.value) {
    showConfirmModal.value = false;
    return;
  }

  try {
    const requestId = currentRequest.value.id;
    const newStatus =
      confirmActionType.value === "approve" ? "approved" : "rejected";
    const requestType = currentRequest.value.type.includes("Sala")
      ? "classroom"
      : "shift";

    await apiService.updateRequestStatus(requestId, newStatus, requestType);

    // Set success message based on action type
    if (confirmActionType.value === "approve") {
      showSuccess(
        "Pedido Aprovado",
        `O pedido #${requestId} foi aprovado com sucesso.`
      );
    } else if (confirmActionType.value === "reject") {
      showSuccess(
        "Pedido Rejeitado",
        `O pedido #${requestId} foi rejeitado com sucesso.`
      );
    } else {
      showSuccess(
        "Pedido Concluído",
        `O pedido #${requestId} foi marcado como concluído.`
      );
    }

    await fetchRequests();
    showConfirmModal.value = false;
    currentRequest.value = null;
  } catch (error) {
    console.error("Erro ao processar pedido:", error);

    const actionText =
      confirmActionType.value === "approve"
        ? "aprovar"
        : confirmActionType.value === "reject"
        ? "rejeitar"
        : "confirmar";

    showErrorWithRetry(
      "Erro ao Processar Pedido",
      `Não foi possível ${actionText} o pedido.`,
      error,
      confirmAction
    );

    showConfirmModal.value = false;
  }
};

// Modal helper functions
const getConfirmButtonText = () => {
  if (confirmActionType.value === "approve") return "Aprovar";
  if (confirmActionType.value === "reject") return "Rejeitar";
  return "Confirmar";
};

const getConfirmButtonType = () => {
  if (confirmActionType.value === "approved") return "approve";
  if (confirmActionType.value === "rejected") return "reject";
  return "primary";
};

// Modal management
const showError = (title, message) => {
  errorModalTitle.value = title;
  errorModalMessage.value = message;
  showErrorModal.value = true;
};

const showErrorWithRetry = (title, message, error, retry) => {
  errorModalTitle.value = title;
  errorModalMessage.value = message;
  errorDetails.value = error.message || JSON.stringify(error);
  retryAction.value = retry;
  showErrorModal.value = true;
};

const showSuccess = (title, message) => {
  successModalTitle.value = title;
  successModalMessage.value = message;
  showSuccessModal.value = true;
};

const cancelAction = () => {
  showConfirmModal.value = false;
  currentRequest.value = null;
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
};

const closeErrorModal = () => {
  showErrorModal.value = false;
  retryAction.value = null;
};

const retryLastAction = () => {
  showErrorModal.value = false;
  if (retryAction.value) {
    const action = retryAction.value;
    retryAction.value = null;
    action();
  }
};

// Calculate optimal number of items per page based on screen height
const calculateItemsPerPage = () => {
  const windowHeight = window.innerHeight;
  const estimatedRowHeight = 300; // height per row in pixels
  const headerFooterSpace = 100; // space for headers, filters, pagination
  const availableHeight = windowHeight - headerFooterSpace;

  return Math.max(
    3,
    Math.min(10, Math.floor(availableHeight / estimatedRowHeight))
  );
};

// Lifecycle hooks
onMounted(() => {
  fetchRequests();
  itemsPerPage.value = calculateItemsPerPage();

  window.addEventListener("resize", () => {
    itemsPerPage.value = calculateItemsPerPage();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", () => {
    itemsPerPage.value = calculateItemsPerPage();
  });
});
</script>
<style scoped>
.requests-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.requests-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requests-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-light);
  letter-spacing: -0.11px;
}

.requests-content {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Content Header and Search */
.content-header {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 19px;
  padding: 10px 16px;
  border: 1px solid rgba(207, 207, 207, 0.114);
  color: #fff;
  width: 300px;
  display: flex;
  align-items: center;
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

/* Filters */
.filter-section {
  background-color: rgba(50, 61, 78, 0.3);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  font-weight: 600;
  min-width: 80px;
  color: rgba(255, 255, 255, 0.8);
}

.filter-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  background-color: rgba(50, 61, 78, 1);
  border: none;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-btn:hover {
  background-color: rgba(72, 128, 255, 0.7);
  transform: translateY(-2px);
}

.filter-btn.active {
  background-color: rgba(72, 128, 255, 1);
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(72, 128, 255, 0.4);
}

/* Table Structure */
.requests-table {
  background-color: rgba(50, 61, 78, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(49, 61, 79, 1);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  background-color: rgba(50, 61, 78, 1);
  display: flex;
  padding: 15px 24px;
  font-weight: 600;
  border-bottom: 1px solid rgba(49, 61, 79, 1);
  width: 100%;
}

.header-item {
  white-space: nowrap;
  padding: 0 10px;
  text-align: left;
  font-size: 14px;
}

/* Column widths */
.id-column {
  width: 8%;
  min-width: 60px;
}
.type-column {
  width: 15%;
  min-width: 120px;
}
.student-column {
  width: 20%;
  min-width: 150px;
}
.course-column {
  width: 20%;
  min-width: 150px;
}
.date-column {
  width: 12%;
  min-width: 100px;
}
.status-column {
  width: 12%;
  min-width: 100px;
}
.actions-column {
  width: 13%;
  min-width: 120px;
  text-align: right;
}

.table-content {
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Table Rows */
.request-row-container {
  border-bottom: 1px solid rgba(49, 61, 79, 0.5);
  transition: all 0.2s;
}

.request-row-container:last-child {
  border-bottom: none;
}

.request-row-container:hover .table-row {
  background-color: rgba(72, 128, 255, 0.1);
  transform: translateY(-1px);
}

.table-row {
  display: flex;
  padding: 40px 24px;
  align-items: center;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
}

.cell {
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Type Badges */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.shift-change {
  background-color: rgba(72, 128, 255, 0.15);
  color: rgba(72, 128, 255, 1);
}

.type-badge.classroom-change {
  background-color: rgba(245, 158, 11, 0.15);
  color: rgba(245, 158, 11, 1);
}

.type-badge.other {
  background-color: rgba(102, 126, 151, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

/* Status Badges */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-badge.pending {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

.status-badge.approved {
  background-color: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.status-badge.rejected {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  min-width: 120px;
}

.action-btn {
  height: 36px;
  border-radius: 6px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 12px;
  font-size: 13px;
  width: 100%;
}

.details-btn {
  background-color: rgba(72, 128, 255, 0.1);
  color: var(--primary-color, rgba(72, 128, 255, 1));
  height: 34px;
}

.details-btn:hover {
  background-color: rgba(72, 128, 255, 0.3);
  color: var(--primary-color, rgba(72, 128, 255, 1));
}

.resolve-btn {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.resolve-btn:hover {
  background-color: #8b5cf6;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.btn-text {
  margin-left: 6px;
}

/* Expanded Details Section */
.request-details {
  background-color: rgba(50, 61, 78, 0.3);
  padding: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.detail-card {
  background-color: rgba(50, 61, 78, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.detail-card-header {
  background-color: rgba(72, 128, 255, 0.2);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.detail-card-content {
  padding: 16px;
}

.detail-item {
  display: flex;
  margin-bottom: 10px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  width: 100px;
  color: rgba(255, 255, 255, 0.7);
}

.detail-value {
  flex: 1;
}

/* Reason Section */
.reason-section {
  background-color: rgba(50, 61, 78, 0.8);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reason-header {
  background-color: rgba(246, 173, 85, 0.2);
  padding: 12px 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #f6ad55;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reason-content {
  padding: 16px;
  white-space: pre-wrap;
  line-height: 1.5;
}

/* Action Buttons in Details */
.details-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.approve-action-btn,
.reject-action-btn,
.resolve-action-btn,
.confirm-action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.approve-action-btn {
  background-color: rgba(72, 187, 120, 1);
  color: white;
}

.approve-action-btn:hover {
  background-color: rgba(56, 161, 105, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.reject-action-btn {
  background-color: rgba(245, 101, 101, 1);
  color: white;
}

.reject-action-btn:hover {
  background-color: rgba(229, 62, 62, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
}

.resolve-action-btn {
  background-color: rgba(90, 103, 216, 1);
  color: white;
}

.resolve-action-btn:hover {
  background-color: rgba(67, 81, 203, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(90, 103, 216, 0.4);
}

.confirm-action-btn {
  background-color: rgba(76, 175, 80, 1);
  color: white;
}

.confirm-action-btn:hover {
  background-color: rgba(56, 142, 60, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

/* Pagination */
.pagination-controls {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
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
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-button:hover:not(.disabled) {
  background-color: rgba(72, 128, 255, 0.7);
  transform: translateY(-1px);
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-number {
  background-color: rgba(50, 61, 78, 1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.page-number.active {
  background-color: rgba(72, 128, 255, 1);
  font-weight: 600;
}

.page-number:hover:not(.active) {
  background-color: rgba(72, 128, 255, 0.5);
  transform: translateY(-1px);
}

.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(50, 61, 78, 0.7);
}

/* Loading and Empty States */
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
  padding: 3rem 2rem;
  text-align: center;
  flex-grow: 1;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: rgba(72, 128, 255, 1);
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 991px) {
  .requests-container {
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

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .filter-label {
    width: auto;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .requests-container {
    padding: 1rem;
  }

  .requests-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .cell {
    width: 100%;
    padding: 8px 0;
    display: flex;
    align-items: center;
    white-space: normal;
  }

  .cell:before {
    content: attr(data-label);
    font-weight: 600;
    width: 120px;
    min-width: 120px;
    color: rgba(255, 255, 255, 0.7);
  }

  .action-buttons {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .action-btn {
    width: 48%;
    height: auto;
    padding: 10px 16px;
    gap: 8px;
  }

  .details-actions {
    flex-direction: column;
    gap: 12px;
  }

  .approve-action-btn,
  .reject-action-btn,
  .resolve-action-btn,
  .confirm-action-btn {
    width: 100%;
  }
}
</style>
