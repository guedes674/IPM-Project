<template>
  <div class="shift-details-container">
    <!-- Room Change Request Modal -->
    <div
      v-if="showRequestModal"
      class="modal-overlay"
      @click.self="showRequestModal = false"
    >
      <div class="request-modal">
        <div class="request-modal-header">
          <h2>Pedido de Troca de Sala</h2>
          <button class="close-button" @click="showRequestModal = false">
            ×
          </button>
        </div>
        <div class="request-modal-body">
          <div class="request-info">
            <p>
              Existe um pedido de troca de sala para o turno
              <strong>{{ shift.shiftNumber }}</strong> da disciplina
              <strong>{{ shift.ucName }}</strong
              >.
            </p>

            <div class="request-details">
              <h3>Detalhes do Pedido:</h3>
              <div class="request-status-info">
                <div class="status-badge" :class="requestDetails.status">
                  {{ getStatusLabel(requestDetails.status) }}
                </div>
                <div class="request-date">
                  Solicitado em: {{ requestDetails.date || "Não disponível" }}
                </div>
              </div>

              <div class="shift-details">
                <div class="current-shift">
                  <h4>Sala Atual</h4>
                  <div class="shift-info">
                    <div class="shift-name">
                      {{
                        requestDetails.currentRoom.name || "Não especificada"
                      }}
                    </div>
                    <div class="shift-location">
                      {{
                        requestDetails.currentRoom.building ||
                        "Edifício não especificado"
                      }}
                    </div>
                    <div class="shift-time">
                      Capacidade:
                      {{ requestDetails.currentRoom.capacity || "25" }} pessoas
                    </div>
                  </div>
                </div>

                <div class="target-shift">
                  <h4>Sala Solicitada</h4>
                  <div class="shift-info">
                    <div class="shift-name">
                      {{ requestDetails.targetRoom.name || "Não especificada" }}
                    </div>
                    <div class="shift-location">
                      {{
                        requestDetails.targetRoom.building ||
                        "Edifício não especificado"
                      }}
                    </div>
                    <div class="shift-time">
                      Capacidade:
                      {{ requestDetails.targetRoom.capacity || "25" }} pessoas
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="request-reason" v-if="requestDetails.reason">
              <h3>Motivo do Pedido:</h3>
              <p>{{ requestDetails.reason }}</p>
            </div>
          </div>
        </div>
        <div class="request-modal-footer">
          <button
            v-if="requestDetails.status === 'pending'"
            class="approve-btn"
            @click="approveRequest"
          >
            Aprovar
          </button>
          <button
            v-if="requestDetails.status === 'pending'"
            class="reject-btn"
            @click="rejectRequest"
          >
            Rejeitar
          </button>
          <button class="close-btn" @click="showRequestModal = false">
            Fechar
          </button>
        </div>
      </div>
    </div>

    <header class="shift-details-header">
      <h1>{{ shift.ucName }}</h1>
    </header>

    <main class="shift-details-content">
      <!-- Shift Summary -->
      <div class="details-summary">
        <div class="shift-info">
          <p class="info-label">
            Tipo: <span class="info-value">{{ shift.type }}</span>
          </p>
          <p class="info-label">
            Turno: <span class="info-value">{{ shift.shiftNumber }}</span>
          </p>
        </div>
        <div class="room-info">
          <h2 class="room-number">Sala: {{ shift.room }}</h2>
          <div class="room-actions">
            <button
              class="btn-primary"
              @click="router.push(`/shifts/${route.params.id}/room`)"
            >
              Mudar Sala
            </button>

            <div
              v-if="hasRoomChangeRequest"
              class="room-request-badge"
              @click="showRoomChangeRequest"
            >
              Pedido de Troca
            </div>
          </div>
        </div>
        <p class="capacity-info">
          Capacidade: {{ shift.current }}/{{ shift.capacity }}
        </p>
      </div>

      <div class="section-header">
        <h2 class="section-title">Alunos Inscritos</h2>
      </div>

      <!-- Action Bar -->
      <div class="actions-bar">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Pesquisar alunos..."
            @input="handleSearch"
          />
        </div>
        <div class="action-buttons">
          <button class="back-button" @click="goBack">Voltar</button>
        </div>
      </div>

      <!-- Students Table -->
      <div class="students-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item name-column">Nome</div>
          <div class="header-item status-column">Estatuto</div>
          <div class="header-item actions-column">Status</div>
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
              <div
                class="allocation-status"
                :class="student.allocationStatus.class"
              >
                {{ student.allocationStatus.label }}
              </div>
              <button
                v-if="student.canAllocate"
                class="allocate-button"
                :class="{
                  'remove-button': student.isAllocated,
                  'add-button': !student.isAllocated,
                  disabled: student.allocationStatus.disabled,
                }"
                @click="allocateStudent(student)"
              >
                {{ student.allocationStatus.actionLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
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

    <!-- Modals -->
    <ConfirmationModal
      :show="showConfirmModal"
      :title="confirmationDetails.title"
      :message="confirmationDetails.message"
      :details="confirmationDetails.details"
      :confirm-text="confirmationDetails.confirmText"
      :cancel-text="confirmationDetails.cancelText"
      :confirm-button-type="confirmationDetails.confirmButtonType"
      @confirm="confirmAllocation"
      @cancel="cancelAllocation"
    />
    <ErrorModal
      :show="showErrorModal"
      :title="errorDetails.title"
      :message="errorDetails.message"
      :error-details="errorDetails.errorDetails"
      :button-text="errorDetails.buttonText"
      @close="closeErrorModal"
      @retry="retryLastAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiServices";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import LoadingState from "@/components/LoadingState.vue";
import ErrorModal from "@/components/ErrorModal.vue";

const router = useRouter();
const route = useRoute();
const searchQuery = ref("");

// Default shift data
const shift = ref({
  id: "00002",
  ucName: "Interface-Pessoa-Máquina",
  type: "Teórico-Prático",
  shiftNumber: "T2",
  current: 25,
  capacity: 25,
  room: "0.08 CP1",
});

// Student management state
const students = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const sortKey = ref("id");
const sortOrder = ref("asc");

// Confirmation modal state
const showConfirmModal = ref(false);
const pendingStudent = ref(null);
const confirmationDetails = ref({
  title: "",
  message: "",
  details: "",
  confirmText: "",
  cancelText: "Cancelar",
  confirmButtonType: "primary",
});

// Error modal state
const showErrorModal = ref(false);
const errorDetails = ref({
  title: "Erro",
  message: "Ocorreu um erro ao processar a sua solicitação.",
  errorDetails: "",
  buttonText: "Fechar",
  retry: "Tentar Novamente",
});

// Room change request state
const showRequestModal = ref(false);
const hasRoomChangeRequest = ref(false);
const roomChangeRequests = ref([]);
const requestDetails = ref({
  id: null,
  shiftId: null,
  status: "pending",
  date: "",
  reason: "",
  currentRoom: {},
  targetRoom: {},
});

// Fetch shift and student data
const fetchStudents = async () => {
  isLoading.value = true;
  try {
    const shiftId = route.params.id;

    // Get shift details
    const shiftData = await apiService.getShiftById(shiftId);
    shift.value = {
      id: shiftData.id,
      ucName: shiftData.ucName,
      type: shiftData.type || "Teórico-Prático",
      shiftNumber: shiftData.shiftNumber,
      current: shiftData.current,
      capacity: shiftData.capacity,
      room: shiftData.classroomId
        ? `${shiftData.classroomId} CP1`
        : "Não definida",
      courseId: shiftData.courseId,
      classroomId: shiftData.classroomId,
    };

    // Check for room change requests
    try {
      const requests = await apiService.getRequests("director");
      const classroomChangeRequests = requests.filter(
        (req) =>
          req.type &&
          req.type.includes("Mudança de Sala") &&
          req.requestData &&
          req.requestData.shiftId == shiftId
      );

      roomChangeRequests.value = classroomChangeRequests;
      hasRoomChangeRequest.value = classroomChangeRequests.length > 0;
    } catch (error) {
      console.error("Error fetching room change requests:", error);
    }

    // Get students data
    const allocatedStudents = await apiService.getShiftStudents(shiftId);
    const availableStudents = await apiService.getAvailableStudentsForShift(
      shiftId
    );

    // Process student data with allocation status
    students.value = [
      ...allocatedStudents.map((student) => ({
        ...student,
        allocationStatus: {
          label: "Alocado",
          class: "status-allocated",
          actionLabel: "Remover",
          disabled: false,
        },
        canAllocate: true,
        isAllocated: true,
      })),
      ...availableStudents.map((student) => ({
        ...student,
        allocationStatus: {
          label: "Não Alocado",
          class: "status-not-allocated",
          actionLabel: "Alocar",
          disabled: false,
        },
        canAllocate: true,
        isAllocated: false,
      })),
    ];
  } catch (error) {
    console.error("Error fetching shift data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Show room change request details
const showRoomChangeRequest = async () => {
  if (!hasRoomChangeRequest.value) return;

  try {
    const shiftId = route.params.id;
    const request = roomChangeRequests.value[0];

    // Get current room details
    let currentRoom = {};
    if (shift.value.classroomId) {
      try {
        const classroomData = await apiService.getClassroomById(
          shift.value.classroomId
        );
        currentRoom = {
          name: `Sala ${classroomData.id}`,
          building: classroomData.building || "Edifício não especificado",
          capacity: classroomData.capacity || 25,
        };
      } catch (error) {
        console.error("Error fetching current classroom details:", error);
      }
    }

    // Get target room details
    let targetRoom = {};
    if (request.requestData && request.requestData.classroomId) {
      try {
        const classroomData = await apiService.getClassroomById(
          request.requestData.classroomId
        );
        targetRoom = {
          name: `Sala ${classroomData.id}`,
          building: classroomData.building || "Edifício não especificado",
          capacity: classroomData.capacity || 25,
        };
      } catch (error) {
        console.error("Error fetching target classroom details:", error);
      }
    }

    // Set request details
    requestDetails.value = {
      id: request.id,
      shiftId: shiftId,
      status: request.status || "pending",
      date: formatDate(request.date) || "Não disponível",
      reason: request.reason || "",
      requestedBy: request.requestedBy || "Professor",
      currentRoom,
      targetRoom,
    };

    showRequestModal.value = true;
  } catch (error) {
    console.error("Error showing room change request:", error);
  }
};

// Approve room change request
const approveRequest = async () => {
  try {
    await apiService.updateRequestStatus(
      requestDetails.value.id,
      "approved",
      "classroom"
    );

    if (requestDetails.value.targetRoom) {
      const classroomId = requestDetails.value.targetRoom.name.replace(
        "Sala ",
        ""
      );
      await apiService.changeShiftClassroom(
        requestDetails.value.shiftId,
        classroomId
      );
    }

    requestDetails.value.status = "approved";
    await fetchStudents();

    alert("Pedido de troca de sala aprovado com sucesso!");
  } catch (error) {
    console.error("Error approving room change request:", error);
    alert("Ocorreu um erro ao aprovar o pedido de troca de sala.");
  }
};

// Reject room change request
const rejectRequest = async () => {
  try {
    await apiService.updateRequestStatus(
      requestDetails.value.id,
      "rejected",
      "classroom"
    );
    requestDetails.value.status = "rejected";
    await fetchStudents();

    alert("Pedido de troca de sala rejeitado.");
  } catch (error) {
    console.error("Error rejecting room change request:", error);
    alert("Ocorreu um erro ao rejeitar o pedido de troca de sala.");
  }
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Get status label in Portuguese
const getStatusLabel = (status) => {
  const statusMap = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
    waiting: "Em análise",
    ok: "Aprovado",
  };
  return statusMap[status] || status;
};

// Filter students based on search query and sort
const filteredStudents = computed(() => {
  let result = [...students.value];

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    result = result.filter(
      (student) =>
        student.id.toString().toLowerCase().includes(search) ||
        student.name.toLowerCase().includes(search) ||
        student.status.toLowerCase().includes(search)
    );
  }

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

// Calculate displayed page buttons
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

// Pagination controls
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

// Search handler with debounce
let searchTimeout = null;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
  }, 300);
};

// Navigation
const goBack = () => {
  router.push({ name: "director-shifts" });
};

// Student allocation management
const allocateStudent = (student) => {
  if (student.allocationStatus.disabled) return;

  pendingStudent.value = student;

  if (student.isAllocated) {
    // Prepare confirmation for removal
    confirmationDetails.value = {
      title: "Confirmar Remoção",
      message: `Tem certeza que deseja remover ${student.name} do turno ${shift.value.shiftNumber}?`,
      details: "Esta ação irá desalocar o aluno deste turno.",
      confirmText: "Remover",
      confirmButtonType: "danger",
    };
  } else {
    // Check shift capacity and student status
    const isShiftFull = shift.value.current >= shift.value.capacity;
    const isSpecialStatus = student.status === "Trabalhador-Estudante";

    let details = `Capacidade atual: ${shift.value.current}/${shift.value.capacity}`;

    if (isShiftFull && isSpecialStatus) {
      details +=
        "\nO turno está cheio, mas o aluno tem estatuto especial e pode ser alocado.";
    } else if (isShiftFull) {
      details +=
        "\nAtenção: O turno está cheio! Alunos sem estatuto especial não devem ser alocados.";
    }

    // Prepare confirmation for allocation
    confirmationDetails.value = {
      title: "Confirmar Alocação",
      message: `Deseja alocar ${student.name} ao turno ${shift.value.shiftNumber}?`,
      details: details,
      confirmText: "Alocar",
      confirmButtonType:
        isShiftFull && !isSpecialStatus ? "warning" : "approve",
    };
  }

  showConfirmModal.value = true;
};

// Process allocation after confirmation
const confirmAllocation = async () => {
  if (!pendingStudent.value) return;

  try {
    if (pendingStudent.value.isAllocated) {
      await apiService.removeStudentFromShift(
        route.params.id,
        pendingStudent.value.id
      );
    } else {
      await apiService.allocateStudentToShift(
        route.params.id,
        pendingStudent.value.id
      );
    }
    await fetchStudents();

    // Reset state on success
    pendingStudent.value = null;
    showConfirmModal.value = false;
  } catch (error) {
    console.error("Error managing student allocation:", error);

    // Show error modal
    if (error.message && error.message.includes("full capacity")) {
      errorDetails.value = {
        title: "Turno Cheio",
        message: "O turno está cheio e o aluno não tem estatuto especial.",
        errorDetails:
          "Apenas alunos com estatuto especial podem ser alocados a turnos que já atingiram a capacidade máxima.",
      };
    } else {
      errorDetails.value = {
        title: "Erro",
        message: "Ocorreu um erro ao gerenciar a alocação do aluno.",
        errorDetails: error.message || "",
      };
    }

    showErrorModal.value = true;
  }
};

// Error modal handlers
const closeErrorModal = () => {
  showErrorModal.value = false;
  pendingStudent.value = null;
  showConfirmModal.value = false;
};

const retryLastAction = async () => {
  if (pendingStudent.value) {
    await confirmAllocation();
  } else {
    showErrorModal.value = false;
  }
};

const cancelAllocation = () => {
  pendingStudent.value = null;
  showConfirmModal.value = false;
};

// Reset to first page when search changes
watch([searchQuery], () => {
  currentPage.value = 1;
});

// Initialize data on component mount
onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.shift-details-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.shift-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.shift-details-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--text-light);
}

.shift-details-content {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.details-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: rgba(50, 61, 78, 0.5);
  border-radius: 10px;
}

.shift-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.info-value {
  font-weight: 400;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.room-number {
  font-size: 1.5rem;
  margin: 0;
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.room-request-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 167, 38, 0.2);
  color: #ffa726;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.room-request-badge:hover {
  background-color: rgba(255, 167, 38, 0.3);
  transform: translateY(-2px);
}

.capacity-info {
  font-size: 1.5rem;
  margin: 0;
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.5rem;
  margin: 0;
  color: #fff;
  font-weight: 600;
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

.action-buttons {
  display: flex;
  gap: 1rem;
}

.back-button,
.btn-primary {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 6px 14px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover,
.btn-primary:hover {
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

.id-column {
  width: 15%;
  min-width: 100px;
}

.name-column {
  width: 40%;
  min-width: 200px;
}

.status-column {
  width: 20%;
  min-width: 120px;
}

.actions-column {
  width: 25%;
  min-width: 250px;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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

.allocate-button {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 8px 15px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.allocate-button:hover {
  background-color: rgba(100, 148, 255, 1);
}

.allocate-button.disabled {
  background-color: rgba(100, 100, 100, 0.5);
  cursor: not-allowed;
}

.allocation-status {
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  min-width: 100px;
}

.status-allocated {
  background-color: rgba(0, 182, 155, 0.1);
  color: rgb(0, 182, 155);
}

.status-not-allocated {
  background-color: rgba(239, 56, 38, 0.1);
  color: rgb(239, 56, 38);
}

.status-other-shift {
  background-color: rgba(255, 167, 86, 0.1);
  color: rgb(255, 167, 86);
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

.add-button {
  background-color: rgba(72, 128, 255, 1);
}

.remove-button {
  background-color: rgba(239, 56, 38, 0.8);
}

.remove-button:hover {
  background-color: rgba(239, 56, 38, 1);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.request-modal {
  background-color: #273142;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.request-modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-modal-header h2 {
  color: #fff;
  margin: 0;
  font-size: 20px;
}

.close-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.request-modal-body {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  color: #fff;
}

.request-info {
  flex: 1;
}

.request-details {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
}

.request-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #ffa726;
  font-size: 16px;
}

.request-status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-badge.pending,
.status-badge.waiting {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

.status-badge.approved,
.status-badge.ok {
  background-color: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.status-badge.rejected {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

.request-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.shift-details {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
}

.current-shift,
.target-shift {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
}

.current-shift h4,
.target-shift h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.shift-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.shift-time {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 3px;
}

.shift-location {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.request-reason {
  margin-top: 20px;
}

.request-reason h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #ffa726;
}

.request-reason p {
  background-color: rgba(50, 61, 78, 1);
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.request-modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.approve-btn {
  background-color: #48bb78;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn:hover {
  background-color: #38a169;
  transform: translateY(-2px);
}

.reject-btn {
  background-color: #f56565;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reject-btn:hover {
  background-color: #e53e3e;
  transform: translateY(-2px);
}

.close-btn {
  background-color: rgba(50, 61, 78, 1);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(60, 73, 93, 1);
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
  .shift-details-container {
    padding: 1.5rem;
  }

  .details-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .room-info {
    align-items: flex-start;
  }

  .actions-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .action-buttons {
    width: 100%;
  }

  .back-button {
    flex: 1;
  }

  .request-modal-body {
    flex-direction: column;
  }

  .shift-details {
    flex-direction: column;
    gap: 10px;
  }

  .request-modal-footer {
    flex-direction: column;
  }

  .approve-btn,
  .reject-btn,
  .close-btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .shift-details-container {
    padding: 1rem;
  }

  .shift-details-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header,
  .table-row {
    padding: 10px 15px;
  }

  .actions-column {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .allocate-button {
    width: 100%;
  }
}
</style>
