<template>
  <div class="student-details-container">
    <ShiftAllocationModal
      v-model="showShiftModal"
      :courseId="selectedCourseId"
      :studentId="route.params.id"
      @allocation-changed="handleAllocationChanged"
    />

    <RequestModal
      :show="showRequestModal"
      :requestDetails="requestDetails"
      @close="showRequestModal = false"
    />

    <ConflictModal
      :show="showConflictModal"
      :conflictDetails="conflictDetails"
      :conflictCourses="conflictCourses"
      @close="showConflictModal = false"
    />

    <header class="student-details-header">
      <div class="student-info">
        <div class="avatar-container">
          <img
            :src="student.avatar"
            class="student-avatar"
            alt="Student Avatar"
          />
          <div
            class="status-badge"
            :class="{
              'special-status': student.status === 'Estatuto Especial',
            }"
          >
            {{ student.status }}
          </div>
        </div>
        <div class="student-details">
          <div class="name-container">
            <h1>{{ student.name }}</h1>
            <div class="id-chip">
              <span class="id-label">ID</span>
              <span class="id-value">{{ student.id }}</span>
            </div>
          </div>
          <div class="contact-info">
            <div class="info-item">
              <i class="fas fa-envelope"></i>
              <span>{{ student.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="student-details-content">
      <h2 class="section-title">Unidades Curriculares</h2>

      <div class="actions-bar">
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Pesquisar unidades curriculares..."
            @input="handleSearch"
          />
        </div>
        <div class="action-buttons">
          <button class="back-button" @click="goBack">Voltar</button>
        </div>
      </div>

      <div class="courses-table">
        <div class="table-header">
          <div class="header-item id-column">ID</div>
          <div class="header-item name-column">Nome</div>
          <div class="header-item actions-column">Ações</div>
        </div>

        <div v-if="isLoading" class="loading-wrapper">
          <LoadingState message="Carregando unidades curriculares..." />
        </div>

        <div v-else-if="filteredCourses.length === 0" class="empty-state">
          <p>Nenhuma unidade curricular encontrada.</p>
        </div>

        <div v-else class="table-content">
          <div
            v-for="course in paginatedCourses"
            :key="course.id"
            class="table-row"
            :class="{
              'has-conflict': course.hasConflict,
              'has-request': course.hasRequest,
            }"
          >
            <div class="cell id-column">{{ course.id }}</div>
            <div class="cell name-column">
              {{ course.name }}
              <span
                v-if="course.hasConflict"
                class="conflict-badge"
                @click="showConflictDetails(course)"
              >
                Conflito
              </span>
              <span
                v-if="course.hasRequest"
                class="request-badge"
                @click="showRequestDetails(course)"
              >
                Pedido
              </span>
            </div>
            <div class="cell actions-column">
              <button class="view-shifts-button" @click="viewShifts(course.id)">
                Ver Turnos
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination-controls">
        <div class="pagination-info">
          Mostrando {{ startItem }}-{{ endItem }} de
          {{ filteredCourses.length }} resultados
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ShiftAllocationModal from "@/components/ShiftAllocationModal.vue";
import LoadingState from "@/components/LoadingState.vue";
import RequestModal from "@/components/RequestModal.vue";
import ConflictModal from "@/components/ConflictModal.vue";
import apiService from "@/services/apiServices";

const router = useRouter();
const route = useRoute();

// State management
const student = ref({
  id: "",
  name: "",
  email: "",
  status: "",
  avatar: "",
});
const courses = ref([]);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isLoading = ref(true);
const selectedCourseId = ref(null);
const showShiftModal = ref(false);
const showConflictModal = ref(false);
const conflicts = ref([]);
const conflictCourses = ref([]);
const conflictDetails = ref({
  day: null,
  timeSlot: null,
  courses: [],
});

// Request state
const showRequestModal = ref(false);
const requests = ref([]);
const requestDetails = ref({
  id: null,
  courseId: null,
  courseName: "",
  status: "pending",
  date: "",
  reason: "",
  currentShift: {},
  targetShift: {},
});

// Fetch student data including courses, conflicts, and shift change requests
const fetchStudentData = async () => {
  isLoading.value = true;
  try {
    const studentId = route.params.id;
    const studentData = await apiService.getStudentById(studentId);

    if (studentData) {
      student.value = {
        id: studentData.id,
        name: studentData.name,
        email: studentData.email,
        status: studentData.specialStatus ? "Estatuto Especial" : "Normal",
        avatar:
          studentData.avatar ||
          "https://placeholder.pics/svg/300/DEDEDE/321FFF-222FFF/Aluno",
      };

      // Get student enrollments and create unique course list
      const studentCourses = await apiService.getStudentEnrollments(studentId);
      const uniqueCourses = new Map();
      studentCourses.forEach((item) => {
        if (!uniqueCourses.has(item.id)) {
          uniqueCourses.set(item.id, {
            id: item.id,
            name: item.name || "Disciplina sem nome",
            courseAbbr: item.abbreviation || "Disciplina sem abreviação",
            abbreviation: item.abbreviation || "Disciplina sem abreviação",
            hasConflict: false,
            hasRequest: false,
          });
        }
      });
      courses.value = Array.from(uniqueCourses.values());

      // Mark courses with conflicts
      try {
        const studentConflicts = await apiService.getStudentConflicts(
          studentId
        );
        conflicts.value = studentConflicts || [];
        if (courses.value.length > 0 && conflicts.value.length > 0) {
          const markedCoursesWithConflicts =
            await apiService.markCoursesWithConflicts(courses.value, studentId);
          courses.value = markedCoursesWithConflicts || courses.value;
        }
      } catch (error) {
        console.error(
          `Error fetching/marking conflicts for student ${studentId}:`,
          error
        );
        courses.value = courses.value.map((c) => ({
          ...c,
          hasConflict: false,
        }));
      }

      // Mark courses with pending shift change requests
      try {
        const studentRequests = await apiService.getRequests(
          "director",
          studentId
        );
        const shiftChangeRequests = studentRequests.filter(
          (req) =>
            req.type &&
            req.type.includes("Troca de Turno") &&
            req.status === "pending"
        );

        requests.value = shiftChangeRequests;

        // Update each course with request status
        courses.value = courses.value.map((course) => {
          // Check if any request is related to this course
          const hasRelatedRequest = shiftChangeRequests.some((req) => {
            if (req.courseId != null && req.courseId == course.id) {
              return true;
            }
            if (req.requestData && req.requestData.courseId) {
              return req.requestData.courseId == course.id;
            }
            return (
              req.courseName &&
              (req.courseName.includes(course.name) ||
                req.courseName.includes(course.abbreviation))
            );
          });

          return {
            ...course,
            hasRequest: hasRelatedRequest,
          };
        });
      } catch (error) {
        console.error("Error fetching/marking student requests:", error);
        courses.value = courses.value.map((c) => ({ ...c, hasRequest: false }));
      }
    }
  } catch (error) {
    console.error("Error fetching student data:", error);
    courses.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Show request details for a specific course
const showRequestDetails = async (course) => {
  if (!course.hasRequest) return;

  try {
    const courseId = parseInt(course.id);

    // Find the request related to this course
    const courseRequest = requests.value.find((req) => {
      // Check direct courseId match
      if (req.courseId != null && req.courseId == courseId) {
        return true;
      }

      // Check request data
      if (req.type && req.type.includes("Troca de Turno")) {
        if (req.requestData && req.requestData.courseId) {
          return req.requestData.courseId == courseId;
        }
        // Fallback to course name matching
        return (
          req.courseName &&
          (req.courseName.includes(course.name) ||
            req.courseName.includes(course.abbreviation))
        );
      }
      return false;
    });

    if (courseRequest) {
      // Get current shift details
      let currentShift = {};
      if (courseRequest.requestData && courseRequest.requestData.shiftId) {
        try {
          const shift = await apiService.getShiftById(
            courseRequest.requestData.shiftId
          );
          currentShift = {
            name: shift.name || `Turno ${shift.shiftNumber}`,
            day: translateDay(shift.day) || "Não especificado",
            time:
              shift.from && shift.to
                ? `${shift.from}:00 - ${shift.to}:00`
                : "Horário não especificado",
            location: shift.classroomId
              ? `Sala ${shift.classroomId}`
              : "Sala não especificada",
          };
        } catch (error) {
          console.error("Error fetching current shift details:", error);
        }
      }

      // Get target shift details
      let targetShift = {};
      if (
        courseRequest.requestData &&
        courseRequest.requestData.alternativeShiftId
      ) {
        try {
          const shift = await apiService.getShiftById(
            courseRequest.requestData.alternativeShiftId
          );
          targetShift = {
            name: shift.name || `Turno ${shift.shiftNumber}`,
            day: translateDay(shift.day) || "Não especificado",
            time:
              shift.from && shift.to
                ? `${shift.from}:00 - ${shift.to}:00`
                : "Horário não especificado",
            location: shift.classroomId
              ? `Sala ${shift.classroomId}`
              : "Sala não especificada",
          };
        } catch (error) {
          console.error("Error fetching target shift details:", error);
        }
      }

      // Populate request details
      requestDetails.value = {
        id: courseRequest.id,
        courseId: courseId,
        courseName: course.name,
        status: courseRequest.status || "pending",
        date: formatDate(courseRequest.date) || "Não disponível",
        reason: courseRequest.reason || "",
        currentShift,
        targetShift,
      };

      showRequestModal.value = true;
    }
  } catch (error) {
    console.error("Error showing request details:", error);
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

// Show conflict details
const showConflictDetails = async (course) => {
  if (!course.hasConflict) return;

  // Find relevant conflicts
  const courseId = parseInt(course.id);
  const relevantConflicts = conflicts.value.filter(
    (conflict) => conflict.courseIDs && conflict.courseIDs.includes(courseId)
  );

  if (relevantConflicts.length === 0) return;

  // Find all courses involved in the conflict
  const conflictCoursesIds = new Set();

  relevantConflicts.forEach((conflict) => {
    conflict.courseIDs.forEach((id) => conflictCoursesIds.add(id));
  });

  // Get details of conflicting courses including shift information
  const coursesWithDetails = [];

  for (const id of conflictCoursesIds) {
    try {
      const courseDetails = await apiService.getCourseById(id);
      const allShifts = await apiService.getShifts();
      const courseShifts = allShifts.filter((shift) => shift.courseId == id);

      // Filter conflicting shifts
      let conflictingShifts = courseShifts;

      if (relevantConflicts.length > 0 && coursesWithDetails.length > 0) {
        const firstCourseShifts = coursesWithDetails[0].shifts;

        if (firstCourseShifts && firstCourseShifts.length > 0) {
          const referenceShift = firstCourseShifts[0];

          // Filter shifts with time overlap
          conflictingShifts = courseShifts.filter(
            (shift) =>
              shift.day === referenceShift.day &&
              ((shift.from <= referenceShift.endTime &&
                shift.to >= referenceShift.startTime) ||
                (shift.from >= referenceShift.startTime &&
                  shift.from < referenceShift.endTime) ||
                (shift.to > referenceShift.startTime &&
                  shift.to <= referenceShift.endTime))
          );

          if (conflictingShifts.length === 0) {
            conflictingShifts = courseShifts;
          }
        }
      }

      // Format shifts for modal display
      const formattedShifts = conflictingShifts.map((shift) => ({
        id: shift.id,
        name: shift.shiftNumber || shift.name,
        day: translateDay(shift.day) || "Não definido",
        startTime: shift.from ? `${shift.from}:00` : "Não definido",
        endTime: shift.to ? `${shift.to}:00` : "Não definido",
        location: shift.classroomId
          ? `Sala ${shift.classroomId}`
          : "Não definido",
        type: shift.type,
      }));

      coursesWithDetails.push({
        id,
        name: courseDetails.name,
        abbreviation: courseDetails.abbreviation,
        shifts: formattedShifts,
      });

      // Use first course schedule as conflict reference
      if (coursesWithDetails.length === 1 && formattedShifts.length > 0) {
        const firstShift = formattedShifts[0];
        conflictDetails.value = {
          day: firstShift.day,
          timeSlot: `${firstShift.startTime} - ${firstShift.endTime}`,
        };
      }
    } catch (error) {
      console.error(`Error getting details for course ${id}:`, error);
      coursesWithDetails.push({
        id,
        name: `Curso ID ${id}`,
        abbreviation: "???",
        shifts: [],
      });
    }
  }

  conflictCourses.value = coursesWithDetails;
  showConflictModal.value = true;
};

// Translate weekday from English to Portuguese
const translateDay = (day) => {
  const translations = {
    Monday: "Segunda-feira",
    Tuesday: "Terça-feira",
    Wednesday: "Quarta-feira",
    Thursday: "Quinta-feira",
    Friday: "Sexta-feira",
    Saturday: "Sábado",
    Sunday: "Domingo",
  };

  return translations[day] || day;
};

// Computed properties
const filteredCourses = computed(() => {
  if (!searchQuery.value) return courses.value;

  const query = searchQuery.value.toLowerCase();
  return courses.value.filter(
    (course) =>
      course.id.toString().toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)
  );
});

const totalPages = computed(() => {
  return Math.ceil(filteredCourses.value.length / itemsPerPage.value);
});

const startItem = computed(() => {
  return filteredCourses.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage.value + 1;
});

const endItem = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredCourses.value.length
  );
});

const paginatedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredCourses.value.slice(start, end);
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

// Navigation and pagination
const handleSearch = () => {
  currentPage.value = 1;
};

const goBack = () => {
  router.push({ name: "students" });
};

const viewShifts = (courseId) => {
  selectedCourseId.value = courseId;
  showShiftModal.value = true;
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

const goToPage = (page) => {
  currentPage.value = page;
};

const handleAllocationChanged = async () => {
  await fetchStudentData();
};

// Watch for route changes and search updates
watch(
  () => route.fullPath,
  (newPath) => {
    if (newPath.includes("students")) {
      fetchStudentData();
    }
  },
  { immediate: true }
);

watch([searchQuery], () => {
  currentPage.value = 1;
});

// Initialization
onMounted(() => {
  fetchStudentData();
});
</script>

<style scoped>
.student-details-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Updated header styles */
.student-details-header {
  margin-bottom: 2.5rem;
  background: linear-gradient(
    to right,
    rgba(39, 49, 66, 0.8),
    rgba(39, 49, 66, 0.6)
  );
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.student-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.student-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(72, 128, 255, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(50, 61, 78, 0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  transform: translateY(30%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-badge.special-status {
  background-color: rgba(72, 128, 255, 0.9);
}

.student-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.name-container h1 {
  font-size: 2.2rem;
  font-weight: 700;
  background: "white";
  margin: 0;
}

.id-chip {
  display: flex;
  align-items: center;
  height: 32px;
}

.id-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 6px;
}

.id-value {
  font-size: 14px;
  font-weight: 700;
  color: white;
}

.contact-info {
  display: flex;
  gap: 1.5rem;
  margin-top: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
}

.info-item i {
  color: rgba(72, 128, 255, 0.9);
}

@media (max-width: 768px) {
  .student-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .name-container {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .contact-info {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
}

.student-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: var(--text-light);
}

.student-name-section h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.11px;
  margin-bottom: 0.5rem;
}

.student-id {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.student-status {
  font-size: 20px;
  font-weight: 700;
  margin-top: 13px;
}

.student-details-content {
  background-color: rgba(39, 49, 66, 1);
  border-radius: 14px;
  padding: 1.5rem;
  color: #fff;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.11px;
  margin-bottom: 1rem;
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
.confirm-button {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 6px;
  padding: 6px 14px;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-button:hover,
.confirm-button:hover {
  background-color: rgba(100, 148, 255, 1);
}

.courses-table {
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
  width: 65%;
  min-width: 200px;
}

.actions-column {
  width: 20%;
  min-width: 120px;
  text-align: right;
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

.table-row.has-conflict {
  background-color: rgba(255, 87, 34, 0.15);
}

.table-row.has-conflict:hover {
  background-color: rgba(255, 87, 34, 0.25);
}

.table-row.has-request {
  background-color: rgba(139, 92, 246, 0.15);
}

.table-row.has-request:hover {
  background-color: rgba(139, 92, 246, 0.25);
}

.table-row.has-conflict.has-request {
  background: linear-gradient(
    to right,
    rgba(255, 87, 34, 0.15),
    rgba(139, 92, 246, 0.15)
  );
}

.table-row.has-conflict.has-request:hover {
  background: linear-gradient(
    to right,
    rgba(255, 87, 34, 0.25),
    rgba(139, 92, 246, 0.25)
  );
}

.conflict-badge {
  display: inline-block;
  background-color: #ff5722;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
  cursor: pointer;
}

.request-badge {
  display: inline-block;
  background-color: #8b5cf6;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 10px;
  cursor: pointer;
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

.view-shifts-button {
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

.view-shifts-button:hover {
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
  .student-details-container {
    padding: 1.5rem;
  }

  .student-info {
    flex-direction: column;
    gap: 1.5rem;
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
    flex-direction: column;
  }

  .back-button,
  .confirm-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .student-details-container {
    padding: 1rem;
  }

  .table-header,
  .table-row {
    padding: 10px 15px;
  }

  .actions-column {
    min-width: unset;
  }

  .view-shifts-button {
    width: 100%;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
