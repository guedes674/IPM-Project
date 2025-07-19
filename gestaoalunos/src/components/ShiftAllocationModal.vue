<script setup>
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import apiService from "@/services/apiServices";
import ConfirmationModal from "./ConfirmationModal.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  courseId: {
    type: [String, Number],
    default: null,
  },
  studentId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "allocation-changed"]);

// Core state variables
const isLoading = ref(true);
const shifts = ref([]);
const course = ref(null);
const studentAllocations = ref([]);
const teachers = ref([]);
const buildings = ref([]);
const classrooms = ref([]);
const existingConflicts = ref([]);
const showConflictModal = ref(false);
const conflictDetails = ref(null);
const student = ref(null);
const hasSpecialStatus = ref(false);
const showConfirmModal = ref(false);
const pendingShift = ref(null);
const confirmationDetails = ref({
  title: "",
  message: "",
  confirmText: "",
  cancelText: "Cancelar",
  confirmButtonType: "primary",
});

// Translate day names to Portuguese
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

// Get teacher name based on ID
const getTeacherName = (teacherId) => {
  if (!teacherId) return "Não atribuído";

  const teacher = teachers.value.find((t) => t.id == teacherId);
  return teacher ? teacher.name : `Professor ${teacherId}`;
};

// Load student information including special status
const loadStudentInfo = async () => {
  try {
    if (props.studentId) {
      student.value = await apiService.getStudentById(props.studentId);
      hasSpecialStatus.value =
        student.value.specialStatus === true ||
        student.value.status === "Estatuto Especial";
    }
  } catch (error) {
    console.error("Erro ao carregar informações do estudante:", error);
  }
};

// Get the classroom location information
const getLocation = (shift) => {
  if (!shift.classroomId) return "Sala não atribuída";

  const classroom = classrooms.value.find((c) => c.id == shift.classroomId);
  if (!classroom) return `Sala ${shift.classroomId}`;

  const building = buildings.value.find((b) => b.id == classroom.buildingId);
  const buildingName = building ? building.abbreviation || building.name : "";

  return `${classroom.name}, ${buildingName}`;
};

// Computed properties for shift categories
const theoreticalShifts = computed(() =>
  shifts.value.filter(
    (shift) =>
      shift.type === "Teórico" ||
      shift.type === "T" ||
      shift.type?.toLowerCase().includes("teor")
  )
);

const practicalShifts = computed(() =>
  shifts.value.filter(
    (shift) =>
      shift.type === "Teórico-Prático" ||
      shift.type === "TP" ||
      shift.type?.toLowerCase().includes("teórico-prático")
  )
);

const labShifts = computed(() =>
  shifts.value.filter(
    (shift) =>
      shift.type === "Prático" ||
      shift.type === "PL" ||
      shift.type === "P" ||
      shift.type?.toLowerCase().includes("prát")
  )
);

// Watch for modal visibility changes to load data
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && props.courseId && props.studentId) {
      await loadShifts();
    }
  }
);

// Load auxiliary data (teachers, buildings, classrooms, conflicts)
const loadAuxiliaryData = async () => {
  try {
    const [
      teachersResponse,
      buildingsResponse,
      classroomsResponse,
      conflictsResponse,
    ] = await Promise.all([
      apiService.getTeachers(),
      apiService.getBuildings(),
      apiService.getClassrooms(),
      apiService.getStudentConflicts(props.studentId),
    ]);

    teachers.value = teachersResponse || [];
    buildings.value = buildingsResponse || [];
    classrooms.value = classroomsResponse || [];
    existingConflicts.value = conflictsResponse || [];

    console.log("Conflitos carregados:", existingConflicts.value);
  } catch (error) {
    console.error("Erro ao carregar dados auxiliares:", error);
  }
};

// Load shifts for the selected course and student
const loadShifts = async () => {
  isLoading.value = true;
  try {
    console.log("Carregando turnos...", props.courseId, props.studentId);
    await loadStudentInfo();

    // Get course details
    course.value = await apiService.getCourseById(props.courseId);

    // Load auxiliary data
    await loadAuxiliaryData();

    // Get all shifts and filter for course
    const allShifts = await apiService.getShifts();
    const courseShifts = allShifts.filter(
      (shift) => shift.courseId?.toString() === props.courseId?.toString()
    );

    // Get student allocations
    const allocationsResponse = await apiService.getStudentSchedule(
      props.studentId
    );
    studentAllocations.value = allocationsResponse;

    // Process shifts data
    shifts.value = courseShifts.map((shift) => {
      const isAllocated = studentAllocations.value.some(
        (allocation) => allocation.shiftId?.toString() === shift.id?.toString()
      );

      const isFull = shift.current >= shift.capacity;

      // Normalize shift type for consistent filtering
      let normalizedType = shift.type || "Desconhecido";

      if (
        ![
          "Teórico",
          "Teórico-Prático",
          "Prático",
          "T",
          "TP",
          "P",
          "PL",
        ].includes(normalizedType)
      ) {
        if (
          normalizedType.toLowerCase().includes("teor") &&
          normalizedType.toLowerCase().includes("prát")
        ) {
          normalizedType = "Teórico-Prático";
        } else if (normalizedType.toLowerCase().includes("teor")) {
          normalizedType = "Teórico";
        } else if (
          normalizedType.toLowerCase().includes("prát") ||
          normalizedType.toLowerCase().includes("lab")
        ) {
          normalizedType = "Prático";
        } else {
          normalizedType = "Teórico";
        }
      }

      return {
        ...shift,
        type: normalizedType,
        isAllocated,
        isFull,
      };
    });
  } catch (error) {
    console.error("Erro ao carregar turnos:", error);
  } finally {
    isLoading.value = false;
  }
};

// Handle shift allocation/deallocation
const handleShiftAllocation = async (shift) => {
  pendingShift.value = shift;

  if (shift.isAllocated) {
    // Setup removal confirmation
    confirmationDetails.value = {
      title: "Confirmar Remoção",
      message: `Tem a certeza que deseja remover o aluno do turno ${
        shift.shiftNumber || shift.name
      }?`,
      details: "Esta ação irá desalocar o aluno deste turno.",
      confirmText: "Remover",
      confirmButtonType: "danger",
    };
  } else {
    // Setup allocation confirmation
    confirmationDetails.value = {
      title: "Confirmar Alocação",
      message: `Deseja alocar o aluno ao turno ${
        shift.shiftNumber || shift.name
      }?`,
      details: `Capacidade atual: ${shift.current}/${shift.capacity}`,
      confirmText: "Alocar",
      confirmButtonType: "approve",
    };
  }

  showConfirmModal.value = true;
};

// Called when user confirms allocation/deallocation
const confirmShiftAction = async () => {
  if (!pendingShift.value) return;

  const shift = pendingShift.value;
  try {
    // Refresh conflict data for most current state
    await refreshConflictsData();

    if (shift.isAllocated) {
      // === REMOVE ALLOCATION ===
      // Check if removing this shift resolves existing conflicts
      const potentialConflictsResolved = await checkIfRemovalResolvesConflicts(
        shift
      );

      // Remove student from shift
      await apiService.removeStudentFromShift(shift.id, props.studentId);

      // If removal resolved conflicts, update them in API
      if (potentialConflictsResolved.length > 0) {
        await updateConflictsAfterResolution(potentialConflictsResolved);
        alert(
          `A remoção do turno resolveu ${potentialConflictsResolved.length} conflito(s) de horário!`
        );
      }
    } else {
      // === ADD ALLOCATION ===
      // Check if student already has a shift of same type for this course
      const existingShiftOfSameType = studentAllocations.value.find(
        (allocation) =>
          allocation.courseId?.toString() === props.courseId?.toString() &&
          allocation.type === shift.type
      );

      // Store current shift for possible restoration
      let currentShift = null;
      let conflictsResolvedByTypeSwitch = [];

      // If student already has a shift of the same type, handle it first
      if (existingShiftOfSameType) {
        // Get full info for current shift
        currentShift = await apiService.getShiftById(
          existingShiftOfSameType.shiftId
        );

        if (currentShift) {
          // Check if removing current shift resolves conflicts BEFORE removing it
          conflictsResolvedByTypeSwitch = await checkIfRemovalResolvesConflicts(
            currentShift
          );
        }

        // Remove the current shift
        await apiService.removeStudentFromShift(
          existingShiftOfSameType.shiftId,
          props.studentId
        );

        // Update resolved conflicts immediately
        if (conflictsResolvedByTypeSwitch.length > 0) {
          await updateConflictsAfterResolution(conflictsResolvedByTypeSwitch);
        }

        // Refresh data after removal
        await refreshConflictsData();
      }

      // Check if new shift will cause conflicts
      const potentialNewConflicts = await checkForPotentialConflicts(shift);

      if (potentialNewConflicts.hasConflict) {
        // If switching shifts resolved conflicts but causes a new one
        if (conflictsResolvedByTypeSwitch.length > 0) {
          const confirmMessage = `A troca de turnos resolveu ${conflictsResolvedByTypeSwitch.length} conflito(s), mas causará um novo conflito.\n\nDeseja prosseguir com a troca?`;

          if (confirm(confirmMessage)) {
            // Allocate even with new conflict
            await apiService.allocateStudentToShift(shift.id, props.studentId);

            // Register the new conflict
            await registerNewConflict(
              props.courseId,
              potentialNewConflicts.conflictingCourseId
            );

            // Show combined feedback
            alert(
              `Turno alocado: ${conflictsResolvedByTypeSwitch.length} conflito(s) resolvido(s) e 1 novo conflito criado.`
            );
          } else {
            // If cancelled, restore previous shift if it existed
            if (currentShift) {
              await apiService.allocateStudentToShift(
                currentShift.id,
                props.studentId
              );
              await refreshConflictsData();
              alert("Operação cancelada. O turno anterior foi restaurado.");
            }
          }
        } else {
          // Normal behavior for new conflicts when none were resolved
          conflictDetails.value = potentialNewConflicts;
          showConflictModal.value = true;
        }
      } else {
        // No new conflicts, allocate student to shift
        await apiService.allocateStudentToShift(shift.id, props.studentId);

        // Notify about conflicts resolved by the switch
        if (conflictsResolvedByTypeSwitch.length > 0) {
          alert(
            `A mudança de turno resolveu ${conflictsResolvedByTypeSwitch.length} conflito(s) de horário!`
          );
        }
      }
    }

    // Reload data
    await loadShifts();

    // Notify parent component
    emit("allocation-changed", true);
  } catch (error) {
    console.error("Erro ao gerir alocação:", error);
  } finally {
    // Reset state
    pendingShift.value = null;
    showConfirmModal.value = false;
  }
};

// Called when user cancels the action
const cancelShiftAction = () => {
  pendingShift.value = null;
  showConfirmModal.value = false;
};

// Check for potential time conflicts
const checkForPotentialConflicts = async (shiftToAdd) => {
  try {
    // Get shift details
    const shiftInfo = await apiService.getShiftById(shiftToAdd.id);

    // If shift has no time information, we can't check for conflicts
    if (!shiftInfo.day || !shiftInfo.from || !shiftInfo.to) {
      return { hasConflict: false };
    }

    // Get student's current schedule
    const currentSchedule = await apiService.getStudentSchedule(
      props.studentId
    );

    // Check for conflicts with each existing shift
    for (const existingShift of currentSchedule) {
      // Ignore shifts of same course and type (they will be replaced)
      if (
        existingShift.courseId === parseInt(props.courseId) &&
        existingShift.type === shiftInfo.type
      ) {
        continue;
      }

      // Check if we have all necessary information
      if (!existingShift.day || !existingShift.from || !existingShift.to) {
        continue;
      }

      // Check day first
      if (existingShift.day !== shiftInfo.day) {
        continue;
      }

      // Check for time overlap
      const newFrom = parseInt(shiftInfo.from);
      const newTo = parseInt(shiftInfo.to);
      const existingFrom = parseInt(existingShift.from);
      const existingTo = parseInt(existingShift.to);

      // Three cases of overlap:
      // 1. New shift starts during existing shift
      // 2. New shift ends during existing shift
      // 3. New shift completely contains existing shift
      if (
        (newFrom >= existingFrom && newFrom < existingTo) ||
        (newTo > existingFrom && newTo <= existingTo) ||
        (newFrom <= existingFrom && newTo >= existingTo)
      ) {
        // Get details of conflicting course
        const conflictingCourse = await apiService.getCourseById(
          existingShift.courseId
        );

        return {
          hasConflict: true,
          conflictingShiftId: existingShift.shiftId || existingShift.id,
          conflictingCourseId: existingShift.courseId,
          conflictingCourseName:
            conflictingCourse.name || existingShift.courseName,
          conflictingCourseAbbr:
            conflictingCourse.abbreviation || existingShift.courseAbbr,
          conflictDay: existingShift.day,
          conflictTime: `${existingShift.from}:00 - ${existingShift.to}:00`,
          newShiftInfo: shiftInfo,
        };
      }
    }

    // No conflicts found
    return { hasConflict: false };
  } catch (error) {
    console.error("Erro ao verificar potenciais conflitos:", error);
    return { hasConflict: false };
  }
};

// Refresh conflict data from API
const refreshConflictsData = async () => {
  try {
    const [conflicts, allocations] = await Promise.all([
      apiService.getStudentConflicts(props.studentId),
      apiService.getStudentSchedule(props.studentId),
    ]);

    existingConflicts.value = conflicts;
    studentAllocations.value = allocations;

    return { conflicts, allocations };
  } catch (error) {
    console.error("Erro ao atualizar dados de conflitos:", error);
    return { conflicts: [], allocations: [] };
  }
};

// Check if removing a shift resolves existing conflicts
const checkIfRemovalResolvesConflicts = async (shiftToRemove) => {
  try {
    // Get fresh conflict data
    const { conflicts } = await refreshConflictsData();

    // No conflicts to resolve
    if (!conflicts || conflicts.length === 0) {
      return [];
    }

    const currentCourseId = parseInt(props.courseId);

    // Find conflicts involving current course
    const relevantConflicts = conflicts.filter(
      (conflict) =>
        conflict.courseIDs && conflict.courseIDs.includes(currentCourseId)
    );

    if (relevantConflicts.length === 0) {
      return [];
    }

    // Store conflicts that may be resolved
    const potentiallyResolvedConflicts = [];

    // For each relevant conflict, check if removing this shift resolves it
    for (const conflict of relevantConflicts) {
      // Get all courses involved in the conflict except current one
      const conflictingCourseIds = conflict.courseIDs.filter(
        (id) => id !== currentCourseId
      );

      let conflictResolved = true;

      // For each conflicting course, check if overlaps still exist after shift removal
      for (const otherCourseId of conflictingCourseIds) {
        // Get all allocated shifts for the other course
        const otherCourseShifts = studentAllocations.value.filter(
          (allocation) => allocation.courseId === otherCourseId
        );

        // No shifts for other course, no conflict
        if (otherCourseShifts.length === 0) {
          continue;
        }

        // Get all shifts for current course except the one being removed
        const currentCourseShifts = studentAllocations.value.filter(
          (allocation) =>
            allocation.courseId === currentCourseId &&
            allocation.shiftId?.toString() !== shiftToRemove.id?.toString()
        );

        // No other shifts from current course, conflict will be resolved
        if (currentCourseShifts.length === 0) {
          continue;
        }

        // Check if time overlaps still exist
        let stillHasConflict = false;

        for (const otherShift of otherCourseShifts) {
          const otherShiftDetails = await apiService.getShiftById(
            otherShift.shiftId
          );
          if (!otherShiftDetails) continue;

          for (const currentShift of currentCourseShifts) {
            const currentShiftDetails = await apiService.getShiftById(
              currentShift.shiftId
            );
            if (!currentShiftDetails) continue;

            // Check for time overlap
            if (
              currentShiftDetails.day === otherShiftDetails.day &&
              ((parseInt(currentShiftDetails.from) >=
                parseInt(otherShiftDetails.from) &&
                parseInt(currentShiftDetails.from) <
                  parseInt(otherShiftDetails.to)) ||
                (parseInt(currentShiftDetails.to) >
                  parseInt(otherShiftDetails.from) &&
                  parseInt(currentShiftDetails.to) <=
                    parseInt(otherShiftDetails.to)) ||
                (parseInt(currentShiftDetails.from) <=
                  parseInt(otherShiftDetails.from) &&
                  parseInt(currentShiftDetails.to) >=
                    parseInt(otherShiftDetails.to)))
            ) {
              stillHasConflict = true;
              break;
            }
          }

          if (stillHasConflict) break;
        }

        if (stillHasConflict) {
          conflictResolved = false;
          break;
        }
      }

      // If conflict resolved, add to list
      if (conflictResolved) {
        potentiallyResolvedConflicts.push(conflict);
      }
    }

    return potentiallyResolvedConflicts;
  } catch (error) {
    console.error("Erro ao verificar se remoção resolve conflitos:", error);
    return [];
  }
};

// Update conflicts in API after resolution
const updateConflictsAfterResolution = async (resolvedConflicts) => {
  try {
    // Delete each resolved conflict
    for (const conflict of resolvedConflicts) {
      await apiService.deleteConflict(conflict.id);
    }

    // Refresh local conflict data
    await refreshConflictsData();

    return true;
  } catch (error) {
    console.error("Erro ao atualizar conflitos:", error);
    return false;
  }
};

// Confirm allocation despite conflict
const confirmarAlocacaoComConflito = async () => {
  if (!conflictDetails.value) {
    showConflictModal.value = false;
    return;
  }

  try {
    // Allocate student to new shift
    const shiftId = conflictDetails.value.newShiftInfo.id;
    await apiService.allocateStudentToShift(shiftId, props.studentId);

    // Register the new conflict
    await registerNewConflict(
      props.courseId,
      conflictDetails.value.conflictingCourseId
    );

    // Reload data
    await loadShifts();

    showConflictModal.value = false;

    // Notify parent component
    emit("allocation-changed", true);
  } catch (error) {
    showConflictModal.value = false;
  }
};

// Register a new conflict
const registerNewConflict = async (courseId, conflictingCourseId) => {
  try {
    // Refresh data first
    await refreshConflictsData();

    // Parse IDs to integers
    courseId = parseInt(courseId);
    conflictingCourseId = parseInt(conflictingCourseId);

    // Check if conflict already exists
    const existingConflict = existingConflicts.value.find(
      (conflict) =>
        conflict.studentId == props.studentId &&
        conflict.courseIDs.includes(courseId) &&
        conflict.courseIDs.includes(conflictingCourseId)
    );

    // If no existing conflict, create a new one
    if (!existingConflict) {
      // Get next available ID
      const allConflicts = await apiService.getConflicts();
      const maxId = Math.max(
        0,
        ...allConflicts.map((c) => parseInt(c.id || 0))
      );
      const newId = (maxId + 1).toString();

      // Create new conflict
      const newConflict = {
        id: newId,
        studentId: parseInt(props.studentId),
        courseIDs: [courseId, conflictingCourseId],
        timestamp: new Date().toISOString(),
      };

      // Save new conflict to API
      await apiService.createConflict(newConflict);

      // Update local conflict data
      await refreshConflictsData();
    }
  } catch (error) {
    console.error("Erro ao registar novo conflito:", error);
  }
};

// Cancel allocation with conflict
const cancelarAlocacaoComConflito = () => {
  showConflictModal.value = false;
  conflictDetails.value = null;
};

// Close modal
const closeModal = () => {
  emit("update:modelValue", false);
};

// Load initial data if modal opens with course and student IDs defined
if (props.modelValue && props.courseId && props.studentId) {
  loadShifts();
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <span v-if="course">
              Turnos de {{ course.name }}
              <span class="course-code">{{ course.abbreviation }}</span>
            </span>
            <span v-else>Turnos</span>
          </div>
          <button class="close-button" @click="closeModal">
            <svg
              width="14"
              height="14"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.3536 3.76355L16.7071 3.41L16.3536 3.05645L14.9436 1.64645L14.59 1.29289L14.2364 1.64645L9 6.88289L3.76355 1.64645L3.41 1.29289L3.05645 1.64645L1.64645 3.05645L1.29289 3.41L1.64645 3.76355L6.88289 9L1.64645 14.2364L1.29289 14.59L1.64645 14.9436L3.05645 16.3536L3.41 16.7071L3.76355 16.3536L9 11.1171L14.2364 16.3536L14.59 16.7071L14.9436 16.3536L16.3536 14.9436L16.7071 14.59L16.3536 14.2364L11.1171 9L16.3536 3.76355Z"
                fill="#4379EE"
                stroke="black"
              />
            </svg>
          </button>
        </div>

        <div class="course-summary" v-if="course">
          <div class="summary-row">
            <div class="summary-label">Semestre:</div>
            <div class="summary-value">{{ course.semester }}º semestre</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">Ano:</div>
            <div class="summary-value">{{ course.year }}º ano</div>
          </div>
          <div class="summary-row" v-if="existingConflicts.length > 0">
            <div class="summary-label">Conflitos:</div>
            <div class="summary-value conflict-badge">
              {{ existingConflicts.length }} conflito(s) detetado(s)
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>A carregar turnos...</p>
        </div>

        <div v-else>
          <!-- Status legend -->
          <div class="shift-legend">
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: rgba(0, 182, 155, 0.1)"
              ></span>
              <span class="legend-text">Vagas disponíveis</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: rgba(239, 56, 38, 0.1)"
              ></span>
              <span class="legend-text">Turno cheio</span>
            </div>
            <div class="legend-item">
              <span class="legend-color allocated"></span>
              <span class="legend-text">Aluno alocado</span>
            </div>
          </div>

          <!-- Theoretical shifts (T) -->
          <div v-if="theoreticalShifts.length > 0" class="shift-section">
            <h3 class="section-title">Turnos Teóricos</h3>
            <div
              v-for="shift in theoreticalShifts"
              :key="shift.id"
              class="shift-row"
              :class="{ 'allocated-row': shift.isAllocated }"
            >
              <div class="shift-header">
                <span class="shift-code">{{
                  shift.shiftNumber || shift.name
                }}</span>
                <span class="shift-capacity" :class="{ full: shift.isFull }">
                  {{ shift.current }}/{{ shift.capacity }}
                </span>
              </div>

              <div class="shift-details">
                <div class="shift-time">
                  <i class="shift-icon">🕒</i>
                  <span
                    >{{ translateDay(shift.day) || "Dia não definido" }},
                    {{ shift.from }}:00 - {{ shift.to }}:00</span
                  >
                </div>
                <div class="shift-location">
                  <i class="shift-icon">📍</i>
                  <span>{{ getLocation(shift) }}</span>
                </div>
                <div class="shift-teacher">
                  <i class="shift-icon">👨‍🏫</i>
                  <span>{{ getTeacherName(shift.teacherId) }}</span>
                </div>
              </div>

              <div class="shift-actions">
                <button
                  class="action-button"
                  :class="{
                    allocated: shift.isAllocated,
                    disabled:
                      shift.isFull && !shift.isAllocated && !hasSpecialStatus,
                    'special-status':
                      shift.isFull && !shift.isAllocated && hasSpecialStatus,
                  }"
                  @click="handleShiftAllocation(shift)"
                  :disabled="
                    shift.isFull && !shift.isAllocated && !hasSpecialStatus
                  "
                >
                  <span v-if="shift.isAllocated">Remover</span>
                  <span v-else-if="shift.isFull && hasSpecialStatus">
                    <i class="shift-icon">⭐</i> Alocar (Estatuto Especial)
                  </span>
                  <span v-else-if="shift.isFull">Turno Cheio</span>
                  <span v-else>Alocar</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Practical-theoretical shifts (TP) -->
          <div v-if="practicalShifts.length > 0" class="shift-section">
            <h3 class="section-title">Turnos Teórico-Práticos</h3>
            <div
              v-for="shift in practicalShifts"
              :key="shift.id"
              class="shift-row"
              :class="{ 'allocated-row': shift.isAllocated }"
            >
              <div class="shift-header">
                <span class="shift-code">{{
                  shift.shiftNumber || shift.name
                }}</span>
                <span class="shift-capacity" :class="{ full: shift.isFull }">
                  {{ shift.current }}/{{ shift.capacity }}
                </span>
              </div>

              <div class="shift-details">
                <div class="shift-time">
                  <i class="shift-icon">🕒</i>
                  <span
                    >{{ translateDay(shift.day) || "Dia não definido" }},
                    {{ shift.from }}:00 - {{ shift.to }}:00</span
                  >
                </div>
                <div class="shift-location">
                  <i class="shift-icon">📍</i>
                  <span>{{ getLocation(shift) }}</span>
                </div>
                <div class="shift-teacher">
                  <i class="shift-icon">👨‍🏫</i>
                  <span>{{ getTeacherName(shift.teacherId) }}</span>
                </div>
              </div>

              <div class="shift-actions">
                <button
                  class="action-button"
                  :class="{
                    allocated: shift.isAllocated,
                    disabled:
                      shift.isFull && !shift.isAllocated && !hasSpecialStatus,
                    'special-status':
                      shift.isFull && !shift.isAllocated && hasSpecialStatus,
                  }"
                  @click="handleShiftAllocation(shift)"
                  :disabled="
                    shift.isFull && !shift.isAllocated && !hasSpecialStatus
                  "
                >
                  <span v-if="shift.isAllocated">Remover</span>
                  <span v-else-if="shift.isFull && hasSpecialStatus">
                    <i class="shift-icon">⭐</i> Alocar (Estatuto Especial)
                  </span>
                  <span v-else-if="shift.isFull">Turno Cheio</span>
                  <span v-else>Alocar</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Practical shifts (P) -->
          <div v-if="labShifts.length > 0" class="shift-section">
            <h3 class="section-title">Turnos Práticos</h3>
            <div
              v-for="shift in labShifts"
              :key="shift.id"
              class="shift-row"
              :class="{ 'allocated-row': shift.isAllocated }"
            >
              <div class="shift-header">
                <span class="shift-code">{{
                  shift.shiftNumber || shift.name
                }}</span>
                <span class="shift-capacity" :class="{ full: shift.isFull }">
                  {{ shift.current }}/{{ shift.capacity }}
                </span>
              </div>

              <div class="shift-details">
                <div class="shift-time">
                  <i class="shift-icon">🕒</i>
                  <span
                    >{{ translateDay(shift.day) || "Dia não definido" }},
                    {{ shift.from }}:00 - {{ shift.to }}:00</span
                  >
                </div>
                <div class="shift-location">
                  <i class="shift-icon">📍</i>
                  <span>{{ getLocation(shift) }}</span>
                </div>
                <div class="shift-teacher">
                  <i class="shift-icon">👨‍🏫</i>
                  <span>{{ getTeacherName(shift.teacherId) }}</span>
                </div>
              </div>

              <div class="shift-actions">
                <button
                  class="action-button"
                  :class="{
                    allocated: shift.isAllocated,
                    disabled: shift.isFull && !shift.isAllocated,
                  }"
                  @click="handleShiftAllocation(shift)"
                  :disabled="shift.isFull && !shift.isAllocated"
                >
                  {{
                    shift.isAllocated
                      ? "Remover"
                      : shift.isFull
                      ? "Turno Cheio"
                      : "Alocar"
                  }}
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="
              !theoreticalShifts.length &&
              !practicalShifts.length &&
              !labShifts.length
            "
            class="empty-state"
          >
            <p>Nenhum turno disponível para esta UC.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="save-button" @click="closeModal">Fechar</button>
        </div>
      </div>
    </div>

    <!-- Conflict confirmation modal -->
    <div
      v-if="showConflictModal"
      class="modal-overlay"
      @click.self="cancelarAlocacaoComConflito"
    >
      <div class="conflict-modal">
        <div class="conflict-modal-header">
          <h2>Atenção: Conflito de Horário Detetado</h2>
          <button class="close-button" @click="cancelarAlocacaoComConflito">
            ×
          </button>
        </div>

        <div class="conflict-modal-body">
          <div class="conflict-icon">⚠️</div>
          <div class="conflict-details">
            <p>
              Alocar este turno causará um
              <strong>conflito de horário</strong> com:
            </p>

            <div class="conflict-course-info">
              <div class="conflict-course-header">
                <span class="conflict-course-name">{{
                  conflictDetails?.conflictingCourseName
                }}</span>
                <span class="conflict-course-abbr">{{
                  conflictDetails?.conflictingCourseAbbr
                }}</span>
              </div>

              <div class="conflict-time-info">
                <div class="conflict-day">
                  <i class="conflict-icon">🗓️</i>
                  <span>{{ translateDay(conflictDetails?.conflictDay) }}</span>
                </div>
                <div class="conflict-hours">
                  <i class="conflict-icon">🕒</i>
                  <span>{{ conflictDetails?.conflictTime }}</span>
                </div>
              </div>
            </div>

            <div class="conflict-warning">
              <p>
                Se continuar, o aluno terá aulas diferentes no mesmo horário, o
                que pode afetar o seu desempenho académico e presença em ambas
                as disciplinas.
              </p>
              <p>
                Este conflito será registado no sistema para resolução futura.
              </p>
            </div>
          </div>
        </div>

        <div class="conflict-modal-footer">
          <button
            class="confirm-conflict-button"
            @click="confirmarAlocacaoComConflito"
          >
            Confirmar mesmo com conflito
          </button>
          <button
            class="cancel-conflict-button"
            @click="cancelarAlocacaoComConflito"
          >
            Cancelar alocação
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation modal -->
    <ConfirmationModal
      :show="showConfirmModal"
      :title="confirmationDetails.title"
      :message="confirmationDetails.message"
      :details="confirmationDetails.details"
      :confirm-text="confirmationDetails.confirmText"
      :cancel-text="confirmationDetails.cancelText"
      :confirm-button-type="confirmationDetails.confirmButtonType"
      @confirm="confirmShiftAction"
      @cancel="cancelShiftAction"
    />
  </Teleport>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap");

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
}

.modal-container {
  width: 700px;
  border: 1px solid #313d4f;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  padding: 28px;
  background-color: #323d4e;
  max-height: 90vh;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.modal-title {
  color: #fff;
  font-family: "Nunito Sans", sans-serif;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.course-code {
  background-color: #4880ff;
  color: white;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 14px;
  margin-left: 10px;
}

.course-summary {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  width: 100px;
}

.summary-value {
  color: white;
  font-weight: 600;
}

.conflict-badge {
  background-color: #ff5722;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.shift-legend {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: rgba(72, 128, 255, 0.1);
  border-radius: 10px;
  padding: 12px 16px;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  margin-right: 8px;
}

.legend-color.allocated {
  background-color: rgba(239, 56, 38, 0.8);
}

.legend-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.close-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  border-radius: 50%;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.shift-section {
  margin-bottom: 30px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
}

.section-title {
  color: #fff;
  font-family: "Nunito Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
  color: rgba(72, 128, 255, 1);
}

.shift-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  padding: 15px;
  border-radius: 8px;
  transition: background-color 0.2s;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.shift-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.shift-row.allocated-row {
  border-left: 3px solid rgba(239, 56, 38, 0.8);
}

.shift-row:last-child {
  margin-bottom: 0;
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.shift-code {
  color: #fff;
  font-family: "Nunito Sans", sans-serif;
  font-size: 18px;
  font-weight: 700;
  background-color: rgba(72, 128, 255, 0.2);
  padding: 4px 10px;
  border-radius: 6px;
}

.shift-capacity {
  padding: 6px 12px;
  border-radius: 6px;
  font-family: "Nunito Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  background-color: rgba(0, 182, 155, 0.1);
  color: rgb(0, 182, 155);
}

.shift-capacity.full {
  background-color: rgba(239, 56, 38, 0.1);
  color: rgb(239, 56, 38);
}

.shift-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.shift-time,
.shift-location,
.shift-teacher {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.shift-icon {
  margin-right: 8px;
  font-style: normal;
}

.shift-actions {
  display: flex;
  justify-content: flex-end;
}

.action-button {
  min-width: 120px;
  height: 36px;
  border-radius: 8px;
  color: #fff;
  font-family: "Nunito Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background-color: rgba(72, 128, 255, 1);
  border: none;
  transition: all 0.2s;
}

.action-button:hover:not(.allocated):not(.disabled) {
  background-color: rgba(100, 148, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.action-button.allocated {
  background-color: rgba(239, 56, 38, 0.8);
}

.action-button.allocated:hover {
  background-color: rgba(239, 56, 38, 1);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.action-button.disabled {
  background-color: rgba(100, 100, 100, 0.5);
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.save-button {
  background-color: rgba(72, 128, 255, 1);
  border-radius: 8px;
  padding: 10px 24px;
  color: #fff;
  font-family: "Nunito Sans", sans-serif;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover {
  background-color: rgba(100, 148, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: rgba(72, 128, 255, 1);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* Conflict modal styles */
.conflict-modal {
  width: 550px;
  background-color: #323d4e;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.conflict-modal-header {
  background-color: #ff5722;
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conflict-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.conflict-modal-header .close-button {
  color: white;
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

.conflict-modal-body {
  padding: 20px;
  display: flex;
  gap: 16px;
}

.conflict-icon {
  font-size: 36px;
  margin-right: 8px;
}

.conflict-details {
  flex: 1;
}

.conflict-course-info {
  background-color: rgba(255, 87, 34, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border-left: 3px solid #ff5722;
}

.conflict-course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.conflict-course-name {
  font-weight: 700;
  font-size: 16px;
}

.conflict-course-abbr {
  background-color: #ff5722;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.conflict-time-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conflict-day,
.conflict-hours {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.conflict-warning {
  background-color: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.conflict-warning p {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.conflict-modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-conflict-button {
  background-color: #ff5722;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-conflict-button:hover {
  background-color: #e64a19;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.cancel-conflict-button {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-conflict-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Responsiveness */
@media (max-width: 768px) {
  .modal-container,
  .conflict-modal {
    width: 90%;
    max-width: 700px;
    padding: 20px;
  }

  .shift-details {
    grid-template-columns: 1fr;
  }

  .shift-legend {
    flex-direction: column;
    gap: 8px;
  }

  .action-button {
    width: 100%;
    height: 44px;
  }

  .conflict-modal-footer {
    flex-direction: column;
  }

  .confirm-conflict-button,
  .cancel-conflict-button {
    width: 100%;
  }
}

.action-button.special-status {
  background-color: #8b5cf6;
  cursor: pointer;
}

.action-button.special-status:hover {
  background-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 480px) {
  .shift-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .shift-capacity {
    align-self: flex-start;
  }

  .conflict-course-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
