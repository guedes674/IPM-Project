<template>
  <div class="schedule-container">
    <header class="schedule-header">
      <h1>Meu Horário</h1>
    </header>

    <main class="schedule-content">
      <div v-if="isLoading" class="loading-wrapper">
        <LoadingState message="Carregando horário..." />
      </div>

      <div
        v-else-if="
          !formattedSchedule || Object.keys(formattedSchedule).length === 0
        "
        class="empty-state"
      >
        <p>Nenhuma aula encontrada no seu horário.</p>
        <button class="primary-button" @click="router.push('/create-request')">
          Pedir alteração de turno
        </button>
      </div>

      <div v-else class="schedule-grid">
        <div class="schedule-header-row">
          <div class="time-header">Horário</div>
          <div v-for="day in weekDays" :key="day.code" class="day-header">
            {{ day.name }}
          </div>
        </div>

        <div class="schedule-body">
          <template v-for="time in timeSlots" :key="time.value">
            <div class="time-row">
              <div class="time-slot">
                <div class="time-value">{{ time.hour }}</div>
                <div class="time-period">{{ time.period }}</div>
              </div>

              <template
                v-for="day in weekDays"
                :key="`${day.code}-${time.value}`"
              >
                <div
                  class="class-slot"
                  :class="{ 'has-class': hasClassAt(day.code, time.value) }"
                >
                  <div
                    v-if="hasClassAt(day.code, time.value)"
                    class="class-card"
                    :class="
                      getClassColorClass(getClassAt(day.code, time.value))
                    "
                    @click="showClassDetails(getClassAt(day.code, time.value))"
                  >
                    <div class="class-title">
                      {{ getClassAt(day.code, time.value).courseAbbr }}
                    </div>
                    <div class="class-type">
                      {{ getClassAt(day.code, time.value).type }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </main>

    <!-- Modal of class details -->
    <div v-if="showModal" class="class-modal-overlay" @click="closeModal">
      <div class="class-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedClass.courseName }}</h3>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-content">
          <div class="modal-info-item">
            <strong>Turno:</strong> {{ selectedClass.name }}
          </div>
          <div class="modal-info-item">
            <strong>Tipo:</strong> {{ selectedClass.type }}
          </div>
          <div class="modal-info-item">
            <strong>Sala:</strong> {{ selectedClass.room }}
          </div>
          <div class="modal-info-item">
            <strong>Horário:</strong> {{ selectedClass.day }},
            {{ selectedClass.time }}
          </div>
        </div>
        <div class="modal-actions">
          <button
            class="secondary-button"
            @click="requestChangeShift(selectedClass)"
          >
            Solicitar mudança de turno
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import apiService from "@/services/apiServices";
import LoadingState from "@/components/LoadingState.vue";

const router = useRouter();
const isLoading = ref(true);
const schedule = ref([]);
const formattedSchedule = ref({});
const showModal = ref(false);
const selectedClass = ref({});

const dayMapping = {
  Monday: "mon",
  "Segunda-feira": "mon",
  Segunda: "mon",
  Tuesday: "tue",
  "Terça-feira": "tue",
  Terça: "tue",
  Wednesday: "wed",
  "Quarta-feira": "wed",
  Quarta: "wed",
  Thursday: "thu",
  "Quinta-feira": "thu",
  Quinta: "thu",
  Friday: "fri",
  "Sexta-feira": "fri",
  Sexta: "fri",
};

const timeSlots = computed(() => [
  { value: "08:00", hour: "08", period: "AM" },
  { value: "10:00", hour: "10", period: "AM" },
  { value: "12:00", hour: "12", period: "PM" },
  { value: "14:00", hour: "14", period: "PM" },
  { value: "16:00", hour: "16", period: "PM" },
  { value: "18:00", hour: "18", period: "PM" },
]);

const weekDays = [
  { name: "Segunda", code: "mon" },
  { name: "Terça", code: "tue" },
  { name: "Quarta", code: "wed" },
  { name: "Quinta", code: "thu" },
  { name: "Sexta", code: "fri" },
];

// Function to process the schedule data and format it for a easier access
const processSchedule = (scheduleData) => {
  const processed = {};

  scheduleData.forEach((classItem) => {
    const dayCode = dayMapping[classItem.day] || "mon";

    let timeStart = "08:00";

    if (classItem.from) {
      timeStart = `${classItem.from.toString().padStart(2, "0")}:00`;
    } else if (classItem.time) {
      const timeMatch = classItem.time.match(/(\d+):(\d+)/);
      if (timeMatch) {
        timeStart = timeMatch[0];
      }
    }

    if (!processed[dayCode]) {
      processed[dayCode] = {};
    }

    processed[dayCode][timeStart] = {
      ...classItem,
      dayCode,
    };
  });

  return processed;
};

const hasClassAt = (day, time) => {
  return formattedSchedule.value[day] && formattedSchedule.value[day][time];
};

const getClassAt = (day, time) => {
  return formattedSchedule.value[day] && formattedSchedule.value[day][time];
};

const getClassColorClass = (classData) => {
  const courseId = classData.courseId;
  const colorIndex = courseId % 8; // 8 colors available

  const colors = [
    "class-blue", // 0
    "class-orange", // 1
    "class-teal", // 2
    "class-purple", // 3
    "class-green", // 4
    "class-red", // 5
    "class-yellow", // 6
    "class-pink", // 7
  ];

  return colors[colorIndex];
};

const showClassDetails = (classData) => {
  selectedClass.value = classData;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const requestChangeShift = (classData) => {
  // First close the modal
  closeModal();

  // Check if we have courseId to navigate to the specific UC
  if (classData.courseId) {
    // Navigate to the UCsView with the specific course selected
    router.push({
      path: "/student-UCs",
      query: {
        courseId: classData.courseId,
        shiftId: classData.shiftId || classData.id,
        action: "requestChange",
      },
    });
  } else {
    // Fallback to the create request page if we don't have courseId
    router.push({
      path: "/create-request",
      query: {
        shiftId: classData.shiftId || classData.id,
      },
    });
  }
};

const fetchSchedule = async () => {
  isLoading.value = true;
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("ID do usuário não encontrado");
      return;
    }

    // Obter dados da API
    const scheduleData = await apiService.getStudentSchedule(userId);

    // Processar os horários para facilitar o acesso
    schedule.value = scheduleData;

    // Processar os dados para o formato necessário para o componente de grade
    formattedSchedule.value = processSchedule(scheduleData);
  } catch (error) {
    console.error("Erro ao carregar horário:", error);
    // Manter a estrutura de dados para fins de teste
    schedule.value = [];
    formattedSchedule.value = {};
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchSchedule();
});
</script>

<style scoped>
.schedule-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.schedule-header h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--text-light);
}

.schedule-content {
  background-color: rgba(27, 36, 49, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
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

.schedule-grid {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 8px;
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.schedule-header-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  background-color: rgba(72, 128, 255, 1);
  padding: 1rem 0;
}

.time-header,
.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 20px;
  padding: 0.5rem;
}

.schedule-body {
  flex-grow: 1;
  overflow-y: auto;
}

.time-row {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  border-bottom: 1px solid rgba(235, 235, 245, 0.6);
}

.time-slot {
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.time-value {
  font-weight: 700;
  font-size: 12px;
}

.time-period {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.class-slot {
  padding: 0.5rem;
  min-height: 68px;
  border-left: 1px solid rgba(235, 235, 245, 0.6);
}

.class-card {
  height: 100%;
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  font-size: 12px;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.class-card:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.class-type {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.9;
}

.class-orange {
  background-color: rgba(255, 195, 116, 1);
  color: #000;
}

.class-blue {
  background-color: rgba(83, 110, 255, 1);
  color: #010618;
}

.class-teal {
  background-color: rgba(74, 210, 201, 1);
  color: #010618;
}

.class-purple {
  background-color: rgba(196, 78, 251, 1);
  color: #010618;
}

.class-green {
  background-color: rgba(72, 255, 85, 1);
  color: #010618;
}

.class-red {
  background-color: rgba(255, 85, 85, 1);
  color: #010618;
}

.class-yellow {
  background-color: rgba(255, 255, 85, 1);
  color: #010618;
}

.primary-button {
  background-color: var(--primary-color);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-button:hover {
  background-color: var(--hover-color);
  transform: translateY(-2px);
}

.class-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.class-modal {
  background-color: var(--surface-dark);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  background-color: var(--primary-color);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.modal-content {
  padding: 24px;
}

.modal-info-item {
  margin-bottom: 12px;
  color: var(--text-light);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-dark);
}

.secondary-button {
  background-color: var(--surface-lighter);
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  background-color: var(--primary-color);
  color: white;
}

@media (max-width: 991px) {
  .schedule-container {
    padding: 1rem;
  }

  .schedule-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .schedule-content {
    padding: 1rem;
  }

  .schedule-grid {
    min-width: 700px;
  }

  .schedule-body {
    overflow-x: auto;
  }
}
</style>
