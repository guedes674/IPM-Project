<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="request-modal">
      <div class="request-modal-header">
        <h2>Pedido de Troca de Turno</h2>
      </div>
      <div class="request-modal-body">
        <div class="request-info">
          <p>
            Existe um pedido de troca de turno para a disciplina
            <strong>{{ requestDetails.courseName }}</strong
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
                <h4>Turno Atual</h4>
                <div class="shift-info">
                  <div class="shift-name">
                    {{ requestDetails.currentShift.name || "Não especificado" }}
                  </div>
                  <div class="shift-time">
                    {{ requestDetails.currentShift.day || "Segunda-feira" }},
                    {{ requestDetails.currentShift.time || "10:00 - 12:00" }}
                  </div>
                  <div class="shift-location">
                    {{
                      requestDetails.currentShift.location ||
                      "Sala não especificada"
                    }}
                  </div>
                </div>
              </div>

              <div class="target-shift">
                <h4>Turno Solicitado</h4>
                <div class="shift-info">
                  <div class="shift-name">
                    {{ requestDetails.targetShift.name || "Não especificado" }}
                  </div>
                  <div class="shift-time">
                    {{ requestDetails.targetShift.day || "Segunda-feira" }},
                    {{ requestDetails.targetShift.time || "14:00 - 16:00" }}
                  </div>
                  <div class="shift-location">
                    {{
                      requestDetails.targetShift.location ||
                      "Sala não especificada"
                    }}
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
        <button class="close-btn" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  requestDetails: {
    type: Object,
    required: true,
  },
});

defineEmits(["close", "approve", "reject"]);

// Get label for the status
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
</script>

<style scoped>
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
  color: #8b5cf6;
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

.shift-info {
  font-size: 14px;
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

.arrow {
  font-size: 24px;
  color: #8b5cf6;
}

.request-reason {
  margin-top: 20px;
}

.request-reason h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #8b5cf6;
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
</style>
