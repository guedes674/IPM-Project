<template>
    <div class="courses-container">
      <header class="courses-header">
        <h1>Minhas Unidades Curriculares</h1>
      </header>
  
      <main class="courses-content">
        <div class="courses-actions">
          <div class="search-box">
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Pesquisar disciplinas..."
              @input="handleSearch"
            />
          </div>
          <div class="filter-dropdowns">
            <select v-model="semesterFilter" class="filter-select">
              <option value="all">Todos os semestres</option>
              <option value="1">1º Semestre</option>
              <option value="2">2º Semestre</option>
            </select>
            <select v-model="yearFilter" class="filter-select">
              <option value="all">Todos os anos</option>
              <option value="1">1º Ano</option>
              <option value="2">2º Ano</option>
              <option value="3">3º Ano</option>
            </select>
          </div>
        </div>
  
        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando unidades curriculares..." />
        </div>
  
        <div v-else-if="filteredCourses.length === 0" class="empty-state">
          <p>Nenhuma unidade curricular encontrada.</p>
        </div>
  
        <div v-else class="courses-grid">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="course-card"
            @click="viewCourseDetails(course)"
          >
            <div class="course-header">
              <div class="course-code">{{ course.abbreviation }}</div>
              <div class="course-year-semester">{{ course.year }}º Ano | {{ course.semester }}º Semestre</div>
            </div>
            <div class="course-name">{{ course.name }}</div>
            <div class="course-shifts">
              <div v-for="shift in course.shifts" :key="shift.id" class="shift-item">
                <span class="shift-type">{{ shift.type }}</span>
                <span class="shift-number">{{ shift.name }}</span>
                <span class="shift-day-time">{{ formatDay(shift.day) }}, {{ formatTime(shift.from, shift.to) }}</span>
              </div>
            </div>
            <div class="course-actions">
              <button class="request-button" @click.stop="requestShiftChange(course)">
                Solicitar Mudança de Turno
              </button>
            </div>
          </div>
        </div>
      </main>
  
      <!-- Modal para solicitar mudança de turno -->
      <div v-if="showRequestModal" class="modal-overlay" @click="cancelRequest">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>Solicitar Mudança de Turno</h2>
            <button class="close-button" @click="cancelRequest">×</button>
          </div>
  
          <div class="modal-content">
            <div class="course-info">
              <h3>{{ selectedCourse.name }}</h3>
              <p>{{ selectedCourse.abbreviation }} | {{ selectedCourse.year }}º Ano | {{ selectedCourse.semester }}º Semestre</p>
            </div>
  
            <div class="form-group">
              <label>Turno Atual:</label>
              <select v-model="selectedCurrentShift" class="form-select">
                <option v-for="shift in userCurrentShifts" :key="shift.id" :value="shift">
                  {{ shift.type }} {{ shift.name }} - {{ formatDay(shift.day) }}, {{ formatTime(shift.from, shift.to) }}
                </option>
              </select>
            </div>
  
            <div class="form-group">
              <label>Turno Desejado:</label>
              <select v-model="selectedTargetShift" class="form-select">
                <option v-for="shift in availableShifts" :key="shift.id" :value="shift">
                  {{ shift.type }} {{ shift.name }} - {{ formatDay(shift.day) }}, {{ formatTime(shift.from, shift.to) }}
                </option>
              </select>
            </div>
  
            <div class="form-group">
              <label>Motivo da Mudança:</label>
              <textarea 
                v-model="requestReason" 
                class="form-textarea" 
                rows="4" 
                placeholder="Explique o motivo pelo qual necessita desta mudança de turno..."
              ></textarea>
            </div>
  
            <div v-if="requestError" class="error-message">
              {{ requestError }}
            </div>
          </div>
  
          <div class="modal-footer">
            <button class="cancel-button" @click="cancelRequest">Cancelar</button>
            <button 
              class="confirm-button" 
              :disabled="isSubmitting || !isFormValid" 
              @click="submitShiftChangeRequest"
            >
              <span v-if="isSubmitting" class="spinner-small"></span>
              <span v-else>Enviar Solicitação</span>
            </button>
          </div>
        </div>
      </div>
  
      <ConfirmationModal
      :show="showConfirmModal"
      title="Confirmar Mudança de Turno"
      :message="`Deseja realmente solicitar mudança do turno ${selectedCurrentShift?.name || ''} para o turno ${selectedTargetShift?.name || ''}?`"
      details="Esta solicitação será enviada ao diretor de curso para aprovação."
      confirmText="Enviar Solicitação"
      @confirm="confirmShiftChangeRequest"
      @cancel="cancelConfirmation"
    />
    
    <!-- Usando o Modal de Sucesso -->
    <SuccessModal
      :show="showSuccessModal"
      title="Solicitação Enviada"
      message="Sua solicitação de mudança de turno foi enviada com sucesso e está aguardando aprovação do diretor de curso."
      @close="closeSuccessModal"
    />
    
    <!-- Usando o Modal de Erro -->
    <ErrorModal
      :show="showErrorModal"
      title="Erro ao Enviar Solicitação"
      :message="errorMessage"
      :errorDetails="errorDetails"
      retry
      @close="closeErrorModal"
      @retry="retrySubmission"
    />
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted, watch } from "vue";
import apiService from "@/services/apiServices";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import SuccessModal from "@/components/SuccessModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import LoadingState from "@/components/LoadingState.vue";
import { useRoute } from "vue-router";

const courses = ref([]);
const isLoading = ref(true);
const searchTerm = ref("");
const semesterFilter = ref("all");
const yearFilter = ref("all");

const showRequestModal = ref(false);
const selectedCourse = ref(null);
const selectedCurrentShift = ref(null);
const selectedTargetShift = ref(null);
const requestReason = ref("");
const requestError = ref("");

const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref("");
const errorDetails = ref("");
const isSubmitting = ref(false);

const route = useRoute();

  // Computed properties
  const filteredCourses = computed(() => {
    let result = [...courses.value];
  
    if (searchTerm.value) {
      const search = searchTerm.value.toLowerCase();
      result = result.filter(
        (course) =>
          course.name.toLowerCase().includes(search) ||
          course.abbreviation.toLowerCase().includes(search)
      );
    }
  
    if (semesterFilter.value !== "all") {
      result = result.filter(
        (course) => course.semester.toString() === semesterFilter.value
      );
    }
  
    if (yearFilter.value !== "all") {
      result = result.filter(
        (course) => course.year.toString() === yearFilter.value
      );
    }
  
    return result;
  });
  
  const userCurrentShifts = computed(() => {
    if (!selectedCourse.value) return [];
    return selectedCourse.value.shifts.filter(shift => shift.isUserEnrolled);
  });
  
  const availableShifts = computed(() => {
    if (!selectedCourse.value) return [];
    
    // All shifts of the selected course, excluding the current shift
    if (selectedCurrentShift.value) {
      return selectedCourse.value.shifts.filter(
        shift => 
          shift.type === selectedCurrentShift.value.type && 
          shift.id !== selectedCurrentShift.value.id
      );
    }
    
    return [];
  });
  
  const isFormValid = computed(() => {
    return (
      selectedCurrentShift.value && 
      selectedTargetShift.value && 
      requestReason.value.trim().length >= 10
    );
  });
  
  // Aux Functions
  const formatDay = (day) => {
    const dayMap = {
      "Monday": "Segunda-feira",
      "Tuesday": "Terça-feira",
      "Wednesday": "Quarta-feira",
      "Thursday": "Quinta-feira",
      "Friday": "Sexta-feira",
      "Saturday": "Sábado",
      "Sunday": "Domingo"
    };
    
    return dayMap[day] || day;
  };
  
  const formatTime = (from, to) => {
    const formatHour = (hour) => {
      return `${hour}:00`;
    };
    
    return `${formatHour(from)} - ${formatHour(to)}`;
  };
  
  let searchTimeout = null;
  const handleSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
    }, 300);
  };

// Fetching student courses
const fetchStudentCourses = async () => {
  isLoading.value = true;
  
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("ID do usuário não encontrado");
      return;
    }
    
    const student = await apiService.getStudentById(userId);
    
    const studentSchedule = await apiService.getStudentSchedule(userId);
    console.log("Horário do aluno:", studentSchedule);
    
    if (student.enrolled && student.enrolled.length > 0) {
      const coursesData = await Promise.all(
        student.enrolled.map(async (courseId) => {
          try {
            const course = await apiService.getCourseById(courseId);
            console.log("Disciplina:", course);
            
            const allShifts = await apiService.getShifts();
            const courseShifts = allShifts.filter(
              shift => shift.courseId == courseId
            );
            
            const enhancedShifts = courseShifts.map(shift => ({
              ...shift,
              isUserEnrolled: studentSchedule.some(
                allocation => allocation.shiftId == shift.id
              )
            }));
            
            return {
              ...course,
              shifts: enhancedShifts
            };
          } catch (error) {
            console.error(`Erro ao buscar disciplina ${courseId}:`, error);
            return null;
          }
        })
      );
      
      courses.value = coursesData.filter(course => course !== null);
    }
  } catch (error) {
    console.error("Erro ao carregar disciplinas do aluno:", error);
    courses.value = [];
  } finally {
    isLoading.value = false;
  }
};
  
  const viewCourseDetails = (course) => {
    console.log("Detalhes da disciplina:", course);
  };
  
  const requestShiftChange = (course) => {
  selectedCourse.value = course;

  console.log("Solicitar mudança de turno para a disciplina:", course.value);
  
  const userShifts = course.shifts.filter(shift => shift.isUserEnrolled);
  if (userShifts.length === 1) {
    selectedCurrentShift.value = userShifts[0];
  } else {
    selectedCurrentShift.value = null;
  }
  
  selectedTargetShift.value = null;
  requestReason.value = "";
  requestError.value = "";
  showRequestModal.value = true;
};
const cancelRequest = () => {
  showRequestModal.value = false;
  selectedCourse.value = null;
  selectedCurrentShift.value = null;
  selectedTargetShift.value = null;
  requestReason.value = "";
  requestError.value = "";
};

const submitShiftChangeRequest = () => {
  if (!isFormValid.value) {
    requestError.value = "Por favor, preencha todos os campos corretamente.";
    return;
  }
  
  showRequestModal.value = false;
  showConfirmModal.value = true;
};

const confirmShiftChangeRequest = async () => {
  isSubmitting.value = true;
  showConfirmModal.value = false;
  
  try {
    const userId = localStorage.getItem("userId");
    
    await apiService.createStudentShiftRequest(
      userId,
      selectedCurrentShift.value.id,
      requestReason.value,
      selectedTargetShift.value.id
    );
    
    showSuccessModal.value = true;
    
    await fetchStudentCourses();
  } catch (error) {
    console.error("Erro ao enviar solicitação:", error);
    errorMessage.value = "Ocorreu um erro ao enviar sua solicitação.";
    errorDetails.value = error.message || JSON.stringify(error);
    showErrorModal.value = true;
  } finally {
    isSubmitting.value = false;
  }
};

const cancelConfirmation = () => {
  showConfirmModal.value = false;
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  selectedCourse.value = null;
  selectedCurrentShift.value = null;
  selectedTargetShift.value = null;
  requestReason.value = "";
};

const closeErrorModal = () => {
  showErrorModal.value = false;
};

const retrySubmission = () => {
  showErrorModal.value = false;
  submitShiftChangeRequest();
};

onMounted(async () => {
    await fetchStudentCourses();
  
    // Handle query parameters if coming from schedule view
  if (route.query.courseId && route.query.action === 'requestChange') {
        const courseId = parseInt(route.query.courseId, 10);
    const shiftId = parseInt(route.query.shiftId, 10);
    
    console.log(`Looking for course ID ${courseId} and shift ID ${shiftId}`);
    
    // Find the course with this ID - make sure to convert IDs for comparison
    const targetCourse = courses.value.find(course => 
      parseInt(course.id, 10) === courseId
    );
    
    console.log("Found target course:", targetCourse);
    
    if (targetCourse) {
      // Automatically open the request modal for this course
      selectedCourse.value = targetCourse;
      
      // Find the shift with the matching ID
      if (shiftId && !isNaN(shiftId)) {
        // Make sure to convert IDs for comparison
        const userShift = targetCourse.shifts.find(shift => 
          parseInt(shift.id, 10) === shiftId
        );
        
        console.log("Found user shift:", userShift);
        
        if (userShift) {
          selectedCurrentShift.value = userShift;
        } else {
          // If specific shift wasn't found, try to use the first enrolled shift
          const enrolledShift = targetCourse.shifts.find(shift => shift.isUserEnrolled);
          console.log("Using enrolled shift instead:", enrolledShift);
          if (enrolledShift) {
            selectedCurrentShift.value = enrolledShift;
          }
        }
      } else {
        // If no specific shift, try to find the first allocated shift
        const userShift = targetCourse.shifts.find(shift => shift.isUserEnrolled);
                if (userShift) {
          selectedCurrentShift.value = userShift;
        }
      }
      
      // Make sure we have a valid target shift for the dropdown
      if (selectedCurrentShift.value && availableShifts.value.length > 0) {
        selectedTargetShift.value = availableShifts.value[0];
      }
      
      // Open the request modal with a small delay to ensure everything is rendered properly
      setTimeout(() => {
        showRequestModal.value = true;
        console.log("Modal should be visible now");
      }, 100);
    } else {
      console.warn(`Course with ID ${courseId} not found`);
    }
  }
});
  </script>
  
  <style scoped>
  .courses-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .courses-header h1 {
    font-size: 1.875rem;
    font-weight: 600;
    color: var(--text-light);
  }
  
  .courses-content {
    background-color: rgba(39, 49, 66, 1);
    border-radius: 14px;
    padding: 1.5rem;
    color: #fff;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .courses-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
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
  
  .filter-dropdowns {
    display: flex;
    gap: 12px;
  }
  
  .filter-select {
    background-color: rgba(50, 61, 78, 1);
    border: 1px solid rgba(207, 207, 207, 0.114);
    border-radius: 8px;
    color: #fff;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
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
  
  .spinner-small {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #ffffff;
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
  
  .loading-wrapper {
    flex-grow: 1;
    display: flex;
    min-height: 300px;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .course-card {
    background-color: rgba(50, 61, 78, 1);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }
  
  .course-header {
    background-color: rgba(72, 128, 255, 1);
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .course-code {
    font-weight: 700;
    font-size: 18px;
  }
  
  .course-year-semester {
    font-size: 12px;
    opacity: 0.9;
  }
  
  .course-name {
    padding: 16px;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .course-shifts {
    padding: 16px;
    flex-grow: 1;
  }
  
  .shift-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 14px;
    gap: 8px;
  }
  
  .shift-item:last-child {
    border-bottom: none;
  }
  
  .shift-type {
    font-weight: 600;
    min-width: 30px;
  }
  
  .shift-number {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .shift-day-time {
    color: rgba(255, 255, 255, 0.7);
    text-align: right;
    flex-grow: 1;
  }
  
  .course-actions {
    padding: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .request-button {
    width: 100%;
    padding: 10px;
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .request-button:hover {
    background-color: var(--hover-color);
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }
  
  .modal-container {
    background-color: #323d4e;
    border-radius: 12px;
    width: 600px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .modal-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .course-info {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .course-info h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  
  .course-info p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .form-select {
    width: 100%;
    padding: 10px 12px;
    background-color: rgba(50, 61, 78, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
  }
  
  .form-textarea {
    width: 100%;
    padding: 12px;
    background-color: rgba(50, 61, 78, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    resize: vertical;
    min-height: 100px;
  }
  
  .error-message {
    background-color: rgba(245, 101, 101, 0.2);
    color: #f56565;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .cancel-button {
    background-color: rgba(50, 61, 78, 1);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .confirm-button {
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 140px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .confirm-button:hover {
    background-color: var(--hover-color);
    transform: translateY(-2px);
  }
  
  .confirm-button:disabled {
    background-color: rgba(72, 128, 255, 0.5);
    cursor: not-allowed;
    transform: none;
  }
  
  /* Success Modal */
  .success-modal {
    background-color: #323d4e;
    border-radius: 12px;
    padding: 32px;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  
  .success-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: rgba(72, 187, 120, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: #48bb78;
  }
  
  .success-modal h3 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }
  
  .success-modal p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 24px 0;
  }
  
  .primary-button {
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .primary-button:hover {
    background-color: var(--hover-color);
    transform: translateY(-2px);
  }
  
  @media (max-width: 991px) {
    .courses-container {
      padding: 1.5rem;
    }
  
    .courses-actions {
      flex-direction: column;
      align-items: stretch;
    }
  
    .search-box {
      width: 100%;
    }
  
    .filter-dropdowns {
      width: 100%;
      justify-content: space-between;
    }
  
    .filter-select {
      flex: 1;
    }
  }
  
  @media (max-width: 768px) {
    .courses-container {
      padding: 1rem;
    }
  
    .courses-grid {
      grid-template-columns: 1fr;
    }
  
    .courses-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
  }
  </style>