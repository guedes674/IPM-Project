<template>
  <div class="student-requests-container">
    <header class="requests-header">
      <h1>Meus Pedidos</h1>
      <button class="new-request-btn" @click="openNewRequestModal">
        Novo Pedido
      </button>
    </header>

    <main class="requests-content">
      <div v-if="isLoading" class="loading-wrapper">
        <LoadingState message="Carregando pedidos..." />
      </div>

      <div v-else-if="requests.length === 0" class="empty-state">
        <p>Você não tem nenhum pedido.</p>
        <button class="create-request-btn" @click="openNewRequestModal">
          Criar Pedido
        </button>
      </div>

      <div v-else class="requests-list">
        <div
          v-for="(request, index) in requests"
          :key="request.id"
          class="request-card"
          :class="{ expanded: expandedRequests[index] }"
        >
          <div class="request-card-header" @click="toggleDetails(index)">
            <div class="request-header-left">
              <span
                class="request-type-badge"
                :class="getStatusClass(request.status)"
              >
                {{ getStatusLabel(request.status) }}
              </span>
              <h3 class="request-title">{{ request.type }}</h3>
            </div>
            <div class="request-header-right">
              <span class="request-date">{{ formatDate(request.date) }}</span>
            </div>
          </div>

          <div class="request-card-content" v-if="expandedRequests[index]">
            <div class="request-details">
              <div class="detail-row">
                <div class="detail-label">Disciplina:</div>
                <div class="detail-value">{{ request.courseName || "Disciplina não disponível" }}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Turno:</div>
                <div class="detail-value">{{ request.shift }}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Motivo:</div>
                <div class="detail-value reason-text">
                  {{ request.reason || "Não especificado" }}
                </div>
              </div>
              <div class="detail-row" v-if="request.status !== 'pending'">
                <div class="detail-label">Resposta:</div>
                <div class="detail-value">
                  {{
                    request.status === "approved"
                      ? "Pedido aprovado"
                      : "Pedido rejeitado"
                  }}
                </div>
              </div>
            </div>

            <div class="request-actions" v-if="request.status === 'pending'">
              <button
                class="cancel-request-btn"
                @click="cancelRequest(request)"
              >
                Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal para confirmação de cancelamento -->
    <ConfirmationModal
      :show="showCancelModal"
      title="Cancelar Pedido"
      :message="cancelModalMessage"
      confirm-text="Sim, Cancelar"
      confirm-button-type="reject"
      @confirm="confirmCancelRequest"
      @cancel="cancelModalClose"
    />

    <!-- Modal para novo pedido -->
    <NewRequestModal
      :show="showNewRequestModal"
      @close="closeNewRequestModal"
      @submit="submitNewRequest"
    />

    <!-- Modal de sucesso -->
    <SuccessModal
      :show="showSuccessModal"
      :title="successModalTitle"
      :message="successModalMessage"
      button-text="OK"
      :auto-close="true"
      :auto-close-delay="3000"
      @close="closeSuccessModal"
    />

    <!-- Modal de erro -->
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
import { ref, reactive, onMounted } from "vue";
import apiService from "@/services/apiServices";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import NewRequestModal from "@/components/NewRequestModal.vue";
import LoadingState from "@/components/LoadingState.vue";

// Estado
const requests = ref([]);
const isLoading = ref(true);
const expandedRequests = reactive({});
const userId = ref(localStorage.getItem("userId"));

// Modais
const showCancelModal = ref(false);
const showNewRequestModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const selectedRequest = ref(null);
const cancelModalMessage = ref("");

const successModalTitle = ref("");
const successModalMessage = ref("");
const errorModalTitle = ref("Erro");
const errorModalMessage = ref("");
const errorDetails = ref("");
const retryAction = ref(null);

// Buscar pedidos do aluno
const fetchRequests = async () => {
  isLoading.value = true;
  try {
    const studentId = userId.value;
    if (!studentId) {
      throw new Error("ID do aluno não encontrado");
    }

    const studentRequests = await apiService.getRequests("student", studentId);
    requests.value = studentRequests;
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    errorModalTitle.value = "Erro ao Carregar Pedidos";
    errorModalMessage.value = "Não foi possível carregar seus pedidos.";
    errorDetails.value = error.message || JSON.stringify(error);
    retryAction.value = fetchRequests;
    showErrorModal.value = true;
  } finally {
    isLoading.value = false;
  }
};

// Funções de utilidade para exibição
const getStatusLabel = (status) => {
  const statusMap = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  return status;
};

function formatDate(isoDate) {
  if (!isoDate) return "Data indisponível";
  return isoDate.split("T")[0];
}

// Alternar detalhes
const toggleDetails = (index) => {
  expandedRequests[index] = !expandedRequests[index];
};

// Cancelar pedido
const cancelRequest = (request) => {
  selectedRequest.value = request;
  cancelModalMessage.value = `Tem certeza que deseja cancelar o seu pedido de ${request.type} para ${request.course}?`;
  showCancelModal.value = true;
};

const cancelModalClose = () => {
  showCancelModal.value = false;
  selectedRequest.value = null;
};

const confirmCancelRequest = async () => {
  if (!selectedRequest.value) {
    showCancelModal.value = false;
    return;
  }

  try {
    // Atualizar o status do pedido para cancelado (rejeitado)
    await apiService.updateShiftRequest(selectedRequest.value.id, "reject");

    // Mensagem de sucesso
    successModalTitle.value = "Pedido Cancelado";
    successModalMessage.value = "Seu pedido foi cancelado com sucesso.";
    showSuccessModal.value = true;

    // Atualizar a lista de pedidos
    await fetchRequests();
  } catch (error) {
    console.error("Erro ao cancelar pedido:", error);
    errorModalTitle.value = "Erro ao Cancelar Pedido";
    errorModalMessage.value = "Não foi possível cancelar o pedido.";
    errorDetails.value = error.message || JSON.stringify(error);
    retryAction.value = confirmCancelRequest;
    showErrorModal.value = true;
  } finally {
    showCancelModal.value = false;
  }
};

// Abrir modal de novo pedido
const openNewRequestModal = () => {
  showNewRequestModal.value = true;
};

const closeNewRequestModal = () => {
  showNewRequestModal.value = false;
};

// Submeter novo pedido
const submitNewRequest = async (requestData) => {
  try {
    await apiService.createStudentShiftRequest(
      userId.value,
      requestData.shiftId,
      requestData.reason,
      requestData.alternativeShiftId
    );

    // Mensagem de sucesso
    successModalTitle.value = "Pedido Enviado";
    successModalMessage.value =
      "Seu pedido foi enviado com sucesso e está aguardando aprovação.";
    showSuccessModal.value = true;

    // Atualizar a lista de pedidos
    await fetchRequests();
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    errorModalTitle.value = "Erro ao Criar Pedido";
    errorModalMessage.value = "Não foi possível criar o pedido.";
    errorDetails.value = error.message || JSON.stringify(error);
    showErrorModal.value = true;
  } finally {
    showNewRequestModal.value = false;
  }
};

// Funções para os modais
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

// Lifecycle hooks
onMounted(() => {
  fetchRequests();
});
</script>

<style scoped>
.student-requests-container {
  padding: 2rem;
  max-width: 900px;
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

.new-request-btn {
  background-color: var(--primary-color);
  border-radius: 8px;
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-request-btn:hover {
  background-color: rgba(100, 148, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 128, 255, 0.3);
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

.loading-wrapper {
  flex-grow: 1;
  display: flex;
  min-height: 300px;
}

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
  border-top-color: var(--primary-color);
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

.create-request-btn {
  margin-top: 1rem;
  background-color: var(--primary-color);
  border-radius: 8px;
  padding: 10px 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-request-btn:hover {
  background-color: rgba(100, 148, 255, 1);
  transform: translateY(-2px);
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  background-color: rgba(50, 61, 78, 0.5);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid rgba(72, 128, 255, 0.1);
}

.request-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.request-card-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: rgba(50, 61, 78, 0.8);
  transition: background-color 0.2s;
}

.request-card-header:hover {
  background-color: rgba(72, 128, 255, 0.1);
}

.request-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.request-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.request-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
}

.request-type-badge.pending {
  background-color: rgba(246, 173, 85, 0.2);
  color: #f6ad55;
}

.request-type-badge.approved {
  background-color: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.request-type-badge.rejected {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

.request-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.request-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.request-card-content {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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

.request-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: 600;
  width: 100px;
  min-width: 100px;
  color: rgba(255, 255, 255, 0.7);
}

.detail-value {
  flex: 1;
}

.reason-text {
  white-space: pre-line;
  line-height: 1.5;
}

.request-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.cancel-request-btn {
  background-color: rgba(245, 101, 101, 0.2);
  color: #f56565;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.cancel-request-btn:hover {
  background-color: #f56565;
  color: white;
  transform: translateY(-2px);
}

/* Responsividade */
@media (max-width: 768px) {
  .student-requests-container {
    padding: 1rem;
  }

  .requests-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .new-request-btn {
    width: 100%;
    justify-content: center;
  }

  .request-header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-label {
    width: 100%;
  }
}
</style>
