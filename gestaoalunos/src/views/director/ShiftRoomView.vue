<template>
  <div class="shift-room-container">
    <header class="shift-room-header">
      <h1>{{ shift.ucName }}</h1>
    </header>

    <main class="shift-room-content">
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
          <h2 class="room-number">Sala: {{ shift.currentRoom }}</h2>
          <div
            v-if="hasRoomChangeRequest"
            class="room-request-badge"
            @click="showRoomChangeRequest"
          >
            Pedido de Troca
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title">Salas de LEI</h2>
      </div>

      <div class="actions-bar">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Pesquisar salas..."
            @input="handleSearch"
          />
        </div>
        <div class="action-buttons">
          <button class="back-button" @click="goBack">Voltar</button>
        </div>
      </div>

      <div class="rooms-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item building-column">CP</div>
          <div class="header-item room-column">Número</div>
          <div class="header-item status-column">Status</div>
        </div>

        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando salas..." />
        </div>

        <div v-else-if="filteredRooms.length === 0" class="empty-state">
          <p>Nenhuma sala encontrada.</p>
        </div>

        <div v-else class="table-content">
          <div v-for="room in paginatedRooms" :key="room.id" class="table-row">
            <div class="cell id-column">{{ room.id }}</div>
            <div class="cell building-column">{{ room.building }}</div>
            <div class="cell room-column">{{ room.number }}</div>
            <div class="cell status-column">
              <div class="status-badges">
                <span class="status-badge" :class="room.status.toLowerCase()">
                  {{ room.status }}
                </span>
                <button
                  v-if="room.status === 'Livre'"
                  class="btn-change-room"
                  @click="selectRoom(room)"
                  :disabled="room.checking"
                >
                  <span v-if="room.checking">Verificando...</span>
                  <span v-else>Trocar Sala</span>
                </button>
                <span
                  v-else
                  class="availability-badge"
                  :class="room.availability.toLowerCase()"
                >
                  {{ room.availability }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Improved pagination -->
      <div class="pagination-controls" v-if="filteredRooms.length > 0">
        <div class="pagination-info">
          Mostrando {{ startItem }}-{{ endItem }} de
          {{ filteredRooms.length }} resultados
        </div>

        <div class="pagination-buttons">
          <button
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="pagination-button first-page"
            :class="{ disabled: currentPage === 1 }"
            title="Primeira página"
          >
            &laquo;
          </button>

          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="pagination-button"
            :class="{ disabled: currentPage === 1 }"
          >
            &lsaquo;
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
            class="pagination-button"
            :class="{ disabled: currentPage === totalPages }"
          >
            &rsaquo;
          </button>

          <button
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="pagination-button last-page"
            :class="{ disabled: currentPage === totalPages }"
            title="Última página"
          >
            &raquo;
          </button>
        </div>
      </div>
    </main>

    <!-- Room change confirmation modal -->
    <div
      v-if="showConfirmModal"
      class="modal-overlay"
      @click.self="cancelRoomChange"
    >
      <div class="confirm-modal">
        <div class="confirm-modal-header">
          <h2>Confirmar Troca de Sala</h2>
          <button class="close-button" @click="cancelRoomChange">×</button>
        </div>
        <div class="confirm-modal-body">
          <p>
            Tem certeza que deseja trocar a sala do turno
            <strong>{{ shift.shiftNumber }}</strong> para:
          </p>
          <div class="room-details">
            <div class="room-detail-item">
              <span class="detail-label">Sala:</span>
              <span class="detail-value">{{ selectedRoom?.number }}</span>
            </div>
            <div class="room-detail-item">
              <span class="detail-label">Edifício:</span>
              <span class="detail-value">{{ selectedRoom?.building }}</span>
            </div>
          </div>
        </div>
        <div class="confirm-modal-footer">
          <button class="confirm-btn" @click="confirmRoomChange">
            Confirmar
          </button>
          <button class="cancel-btn" @click="cancelRoomChange">Cancelar</button>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiService from "@/services/apiServices";
import LoadingState from "@/components/LoadingState.vue";

const router = useRouter();
const route = useRoute();

// State
const isLoading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRoom = ref(null);
const showConfirmModal = ref(false);

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

// Default shift data
const shift = ref({
  id: "00002",
  ucName: "Interface-Pessoa-Máquina",
  type: "Teórico",
  shiftNumber: "T2",
  currentRoom: "0.08 CP1",
});

// Default rooms data
const rooms = ref([
  {
    id: "23456",
    building: "CP1",
    number: "0.08",
    status: "Ocupada",
    availability: "Indisponível",
    checking: false,
  },
  {
    id: "32432",
    building: "CP1",
    number: "0.11",
    status: "Ocupada",
    availability: "Indisponível",
    checking: false,
  },
  {
    id: "56465",
    building: "CP1",
    number: "1.11",
    status: "Ocupada",
    availability: "Indisponível",
    checking: false,
  },
  {
    id: "43534",
    building: "CP2",
    number: "2.05",
    status: "Ocupada",
    availability: "Indisponível",
    checking: false,
  },
  {
    id: "76562",
    building: "CP2",
    number: "1.07",
    status: "Ocupada",
    availability: "Indisponível",
    checking: false,
  },
  {
    id: "34543",
    building: "CP1",
    number: "0.09",
    status: "Livre",
    availability: "Disponível",
    checking: false,
  },
  {
    id: "45435",
    building: "CP1",
    number: "0.22",
    status: "Livre",
    availability: "Disponível",
    checking: false,
  },
  {
    id: "43535",
    building: "CP2",
    number: "1.10",
    status: "Livre",
    availability: "Disponível",
    checking: false,
  },
  {
    id: "23423",
    building: "CP2",
    number: "2.12",
    status: "Livre",
    availability: "Disponível",
    checking: false,
  },
  {
    id: "42342",
    building: "CP3",
    number: "0.04",
    status: "Livre",
    availability: "Disponível",
    checking: false,
  },
]);

// Computed properties
const filteredRooms = computed(() => {
  let result = rooms.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (room) =>
        room.id.toLowerCase().includes(query) ||
        room.building.toLowerCase().includes(query) ||
        room.number.toLowerCase().includes(query)
    );
  }

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRooms.value.length / itemsPerPage.value);
});

const startItem = computed(() => {
  return filteredRooms.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredRooms.value.length
  );
});

const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredRooms.value.slice(start, end);
});

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

// Methods
const handleSearch = () => {
  currentPage.value = 1;
};

const goToPage = (page) => {
  currentPage.value = page;
};

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

// Select a room to change to
const selectRoom = async (room) => {
  try {
    // Mark room as checking
    const index = rooms.value.findIndex((r) => r.id === room.id);
    if (index >= 0) {
      rooms.value[index].checking = true;
    }

    // Get shift details for time information
    const shiftData = await apiService.getShiftById(route.params.id);

    // Check if room is actually available at this time
    const availability = await apiService.checkRoomAvailability(
      room.id,
      shiftData.from || 8,
      shiftData.to || 10,
      shiftData.day || "Segunda-feira"
    );

    // Reset checking status
    if (index >= 0) {
      rooms.value[index].checking = false;
    }

    if (availability.available) {
      // Room is actually available, proceed with selection
      selectedRoom.value = room;
      showConfirmModal.value = true;
    } else {
      // Room is not available due to some conflict
      alert(
        `Esta sala não está disponível no horário solicitado.\nConflito com: ${availability.conflict.courseName} (${availability.conflict.shiftName})`
      );
    }
  } catch (error) {
    console.error("Error checking room availability:", error);
    alert(
      "Erro ao verificar disponibilidade da sala. Por favor, tente novamente."
    );

    // Reset checking status on error
    const index = rooms.value.findIndex((r) => r.id === room.id);
    if (index >= 0) {
      rooms.value[index].checking = false;
    }
  }
};

// Confirm room change
const confirmRoomChange = async () => {
  if (!selectedRoom.value) return;

  try {
    await apiService.changeShiftClassroom(
      route.params.id,
      selectedRoom.value.id
    );
    shift.value.currentRoom = `${selectedRoom.value.number} ${selectedRoom.value.building}`;
    showConfirmModal.value = false;
    alert("Sala alterada com sucesso!");
  } catch (error) {
    console.error("Error changing classroom:", error);
    alert("Erro ao trocar a sala. Por favor, tente novamente.");
  }
};

// Cancel room change
const cancelRoomChange = () => {
  showConfirmModal.value = false;
  selectedRoom.value = null;
};

// Show room change request details
const showRoomChangeRequest = async () => {
  if (!hasRoomChangeRequest.value) return;

  try {
    const shiftId = route.params.id;
    const request = roomChangeRequests.value[0]; // Get the first request (could display a list for multiple requests)

    // Get room details
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

    // Fill request details
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
    // Update request status
    await apiService.updateRequestStatus(
      requestDetails.value.id,
      "approved",
      "classroom"
    );

    // Update shift classroom
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

    // Update interface
    requestDetails.value.status = "approved";
    await fetchData(); // Reload shift data

    // User feedback
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
    await fetchData(); // Reload shift data

    // User feedback
    alert("Pedido de troca de sala rejeitado.");
  } catch (error) {
    console.error("Error rejecting room change request:", error);
    alert("Ocorreu um erro ao rejeitar o pedido de troca de sala.");
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Get status label
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

// Navigation
const goBack = () => {
  router.push(`/shifts/${route.params.id}/details`);
};

// Fetch data function that can be reused
const fetchData = async () => {
  try {
    isLoading.value = true;
    // Fetch shift details
    const shiftData = await apiService.getShiftById(route.params.id);
    shift.value = {
      id: shiftData.id,
      ucName: shiftData.ucName,
      type: shiftData.type || "Teórico",
      shiftNumber: shiftData.shiftNumber,
      currentRoom: `${shiftData.classroomId || "0.08"} CP1`,
      classroomId: shiftData.classroomId,
      from: shiftData.from || 8,
      to: shiftData.to || 10,
      day: shiftData.day || "Segunda-feira",
    };

    // Fetch available classrooms
    const classroomsData = await apiService.getAvailableClassrooms();
    rooms.value = classroomsData.map((room) => ({
      ...room,
      checking: false,
    }));

    // Fetch room change requests
    try {
      const requests = await apiService.getRequests("director");
      const classroomChangeRequests = requests.filter(
        (req) =>
          req.type &&
          req.type.includes("Mudança de Sala") &&
          req.requestData &&
          req.requestData.shiftId == route.params.id
      );

      roomChangeRequests.value = classroomChangeRequests;
      hasRoomChangeRequest.value = classroomChangeRequests.length > 0;
    } catch (error) {
      console.error("Error fetching room change requests:", error);
    }
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Initialize component
onMounted(() => {
  fetchData();
});
</script>
<style scoped>
.shift-room-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.shift-room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.shift-room-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--text-light);
}

.shift-room-content {
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
.confirm-button,
.btn-primary,
.btn-change-room {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 6px 14px;
  color: #fff;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button,
.confirm-button {
  font-size: 16px;
}

.btn-primary {
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-change-room {
  font-size: 12px;
  padding: 8px 15px;
}

.back-button:hover,
.confirm-button:hover,
.btn-primary:hover,
.btn-change-room:hover {
  background-color: rgba(100, 148, 255, 1);
}

.btn-change-room:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rooms-table {
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

.building-column {
  width: 15%;
  min-width: 80px;
}

.room-column {
  width: 15%;
  min-width: 100px;
}

.status-column {
  width: 55%;
  min-width: 300px;
  display: flex;
  justify-content: flex-end;
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

.status-badges {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.status-badge {
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
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

.status-badge.livre {
  background-color: rgba(0, 182, 155, 0.1);
  color: rgb(0, 182, 155);
  min-width: 80px;
}

.status-badge.ocupada {
  background-color: rgba(239, 56, 38, 0.1);
  color: rgb(239, 56, 38);
  min-width: 80px;
}

.availability-badge {
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  background-color: rgba(128, 131, 138, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.pagination-controls {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.first-page,
.last-page {
  font-size: 1rem;
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
  pointer-events: none;
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

.loading-wrapper {
  flex-grow: 1;
  display: flex;
  min-height: 300px;
}

/* Modal styles */
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

.confirm-modal,
.request-modal {
  background-color: #273142;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.confirm-modal-header,
.request-modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-modal-header h2,
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

.confirm-modal-body,
.request-modal-body {
  padding: 20px;
  color: #fff;
}

.room-details {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.room-detail-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.detail-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.detail-value {
  font-weight: 600;
}

.confirm-modal-footer,
.request-modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-btn,
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

.confirm-btn:hover,
.approve-btn:hover {
  background-color: #38a169;
  transform: translateY(-2px);
}

.cancel-btn,
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

.cancel-btn:hover,
.close-btn:hover {
  background-color: rgba(60, 73, 93, 1);
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

@media (max-width: 991px) {
  .shift-room-container {
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

  .back-button,
  .confirm-button {
    flex: 1;
  }

  .status-badges {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .pagination-controls {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .shift-details {
    flex-direction: column;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .shift-room-container {
    padding: 1rem;
  }

  .shift-room-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .table-header,
  .table-row {
    padding: 10px 15px;
  }

  .id-column,
  .building-column,
  .room-column,
  .status-column {
    min-width: unset;
  }

  .status-column {
    justify-content: flex-start;
  }

  .status-badges {
    justify-content: flex-start;
  }

  .btn-change-room {
    width: 100%;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
