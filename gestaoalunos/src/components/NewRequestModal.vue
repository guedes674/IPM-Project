<template>
  <div class="modal-wrapper" v-if="show">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Novo Pedido</h2>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="request-type">Tipo de Pedido</label>
          <select id="request-type" v-model="requestType" class="form-input">
            <option value="shift">Troca de Turno</option>
          </select>
        </div>

        <div class="form-group">
          <label for="current-shift">Turno Atual</label>
          <select
            id="current-shift"
            v-model="currentShiftId"
            class="form-input"
            @change="loadAlternativeShifts"
          >
            <option value="" disabled>Selecione um turno</option>
            <option
              v-for="shift in currentShifts"
              :key="shift.id"
              :value="shift.id"
            >
              {{ shift.courseName }} - {{ shift.name }} ({{ shift.type }})
            </option>
          </select>
        </div>

        <div class="form-group" v-if="currentShiftId">
          <label for="alternative-shift">Turno Desejado</label>
          <select
            id="alternative-shift"
            v-model="alternativeShiftId"
            class="form-input"
          >
            <option value="" disabled>Selecione um turno</option>
            <option
              v-for="shift in alternativeShifts"
              :key="shift.id"
              :value="shift.id"
            >
              {{ shift.name }} ({{ shift.type }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="reason">Motivo do Pedido</label>
          <textarea
            id="reason"
            v-model="reason"
            class="form-input"
            rows="4"
            placeholder="Explique o motivo do seu pedido..."
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">Cancelar</button>
        <button
          class="submit-button"
          @click="submitRequest"
          :disabled="isSubmitDisabled || isLoading"
        >
          <div v-if="isLoading" class="button-spinner"></div>
          <span v-else>Enviar Pedido</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import apiService from "@/services/apiServices";

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["close", "submit"]);

// Estado do formulário
const requestType = ref("shift");
const currentShiftId = ref("");
const alternativeShiftId = ref("");
const reason = ref("");
const isLoading = ref(false);

// Dados carregados da API
const currentShifts = ref([]);
const alternativeShifts = ref([]);
const studentId = ref(localStorage.getItem("userId"));

// Carregar turnos do aluno
const fetchStudentShifts = async () => {
  try {
    isLoading.value = true;
    const schedule = await apiService.getStudentSchedule(studentId.value);
    currentShifts.value = schedule;
  } catch (error) {
    console.error("Erro ao carregar turnos do aluno:", error);
  } finally {
    isLoading.value = false;
  }
};

// Carregar turnos alternativos disponíveis
const loadAlternativeShifts = async () => {
  if (!currentShiftId.value) return;

  try {
    isLoading.value = true;
    alternativeShiftId.value = "";

    // Encontrar o turno atual para obter o courseId
    const currentShift = currentShifts.value.find(
      (shift) => shift.id.toString() === currentShiftId.value.toString()
    );
    if (!currentShift) return;

    // Buscar todos os turnos
    const allShifts = await apiService.getShifts();

    // Filtrar apenas turnos do mesmo curso e tipo, mas diferentes do atual
    alternativeShifts.value = allShifts.filter(
      (shift) =>
        shift.courseId.toString() === currentShift.courseId.toString() &&
        shift.type === currentShift.type &&
        shift.id.toString() !== currentShiftId.value.toString()
    );
  } catch (error) {
    console.error("Erro ao carregar turnos alternativos:", error);
  } finally {
    isLoading.value = false;
  }
};

// Verificar se o botão de envio deve estar desabilitado
const isSubmitDisabled = computed(() => {
  if (requestType.value === "shift") {
    return !currentShiftId.value || !reason.value;
  }
  return !reason.value;
});

// Reiniciar formulário quando o modal for aberto ou fechado
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      requestType.value = "shift";
      currentShiftId.value = "";
      alternativeShiftId.value = "";
      reason.value = "";
      fetchStudentShifts();
    }
  }
);

// Submeter pedido
const submitRequest = async () => {
  if (isSubmitDisabled.value || isLoading.value) return;

  try {
    isLoading.value = true;

    const requestData = {
      type: requestType.value,
      shiftId: currentShiftId.value,
      alternativeShiftId: alternativeShiftId.value || null,
      reason: reason.value,
    };

    emit("submit", requestData);
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
  } finally {
    isLoading.value = false;
  }
};

// Inicialização
onMounted(() => {
  if (props.show) {
    fetchStudentShifts();
  }
});
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-container {
  position: relative;
  background-color: var(--surface-dark);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-dark);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-button:hover {
  color: var(--text-light);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.form-input {
  background-color: var(--surface-darker);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-light);
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(72, 128, 255, 0.2);
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--border-dark);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button,
.submit-button {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-dark);
}

.cancel-button:hover {
  background-color: var(--surface-darker);
  color: var(--text-light);
}

.submit-button {
  background-color: var(--primary-color);
  color: white;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.submit-button:hover:not(:disabled) {
  background-color: rgba(100, 148, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 128, 255, 0.3);
}

.submit-button:disabled {
  background-color: rgba(72, 128, 255, 0.5);
  cursor: not-allowed;
}

.button-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
