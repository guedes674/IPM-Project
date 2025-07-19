import axios from "axios";

const API_URL = "http://localhost:3000";

// --- Helper Functions ---

/**
 * Fetches data from the API with basic error handling.
 * @param {string} endpoint - The API endpoint (e.g., '/students').
 * @returns {Promise<any>} - The response data.
 */
const fetchData = async (endpoint) => {
  try {
    const response = await axios.get(`${API_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Posts data to the API.
 * @param {string} endpoint - The API endpoint.
 * @param {object} data - The data to post.
 * @returns {Promise<any>} - The response data.
 */
const postData = async (endpoint, data) => {
  try {
    const response = await axios.post(`${API_URL}${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Updates data via PUT request.
 * @param {string} endpoint - The API endpoint.
 * @param {object} data - The data to update.
 * @returns {Promise<any>} - The response data.
 */
const putData = async (endpoint, data) => {
  try {
    const response = await axios.put(`${API_URL}${endpoint}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error putting data to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Deletes data via DELETE request.
 * @param {string} endpoint - The API endpoint.
 * @returns {Promise<any>} - The response data.
 */
const deleteData = async (endpoint) => {
  try {
    const response = await axios.delete(`${API_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    // Handle 404 as potentially non-critical (already deleted)
    if (error.response && error.response.status === 404) {
      console.warn(
        `Resource not found at ${endpoint}, may have been deleted already.`
      );
      return null; // Indicate resource was not found/deleted
    }
    console.error(`Error deleting data from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Generates the next available ID for a given resource type.
 * @param {string} resource - The resource name (e.g., 'allocations', 'shiftRequests').
 * @returns {Promise<string>} - The next available ID as a string.
 */
const getNextId = async (resource) => {
  const items = await fetchData(`/${resource}`);
  const maxId = Math.max(
    0,
    ...items
      .map((item) => parseInt(item.id || 0, 10))
      .filter((id) => !isNaN(id))
  );
  return (maxId + 1).toString();
};

/**
 * Enhances a shift object with course and calculated details.
 * @param {object} shift - The raw shift object.
 * @returns {Promise<object>} - The enhanced shift object.
 */
const enhanceShift = async (shift) => {
  try {
    const course = await apiService.getCourseById(shift.courseId);
    const currentStudents = shift.totalStudentsRegistered || 0;
    const capacity = shift.capacity || 25; // Default capacity
    return {
      ...shift,
      ucName: course.name || "Curso desconhecido",
      abbreviation: course.abbreviation || "N/A",
      current: currentStudents,
      capacity: capacity,
      shiftNumber: shift.name || "Turno ?", // Use name as shiftNumber if available
      status: currentStudents >= capacity ? "Cheio" : "Disponível",
      type: shift.type || "Teórico-Prático", // Default type
      isFull: currentStudents >= capacity,
    };
  } catch (error) {
    console.error(`Error enhancing shift ${shift.id}:`, error);
    // Return basic shift info on error
    return {
      ...shift,
      ucName: "Curso desconhecido",
      abbreviation: "N/A",
      current: shift.totalStudentsRegistered || 0,
      capacity: shift.capacity || 25,
      shiftNumber: shift.name || "Turno ?",
      status: "Desconhecido",
      type: shift.type || "Teórico-Prático",
      isFull: (shift.totalStudentsRegistered || 0) >= (shift.capacity || 25),
    };
  }
};

/**
 * Formats relative time difference.
 * @param {Date} date - The date to compare against now.
 * @returns {string} - Formatted time string (e.g., "5 minutos atrás").
 */
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
};

// --- API Service Definition ---

const apiService = {
  // --- Auth ---
  async login(email, password, role) {
    const endpoint = role === "director" ? "/directors" : "/students";
    if (role !== "director" && role !== "student") {
      throw new Error("Invalid role specified for login.");
    }
    const users = await fetchData(endpoint);
    const user = users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return { ...user, role };
  },

  // --- Students ---
  async getStudents() {
    return fetchData("/students");
  },

  async getStudentById(id) {
    return fetchData(`/students/${id}`);
  },

  async updateStudent(student) {
    return putData(`/students/${student.id}`, student);
  },

  async getStudentEnrollments(studentId) {
    try {
      const student = await this.getStudentById(studentId);
      const enrolledCourseIds = student.enrolled || [];
      if (!enrolledCourseIds.length) return [];

      const coursePromises = enrolledCourseIds.map(async (courseId) => {
        try {
          const course = await this.getCourseById(courseId);
          return {
            id: course.id,
            name: course.name,
            abbreviation: course.abbreviation || "???",
          };
        } catch (error) {
          console.error(
            `Error fetching course ${courseId} for student ${studentId}:`,
            error
          );
          return null;
        }
      });

      const courses = await Promise.all(coursePromises);
      return courses.filter((course) => course !== null);
    } catch (error) {
      console.error(
        `Error fetching enrollments for student ${studentId}:`,
        error
      );
      return [];
    }
  },

  async getStudentSchedule(studentId) {
    try {
      const allocations = await fetchData(
        `/allocations?studentId=${studentId}`
      );
      if (!allocations || allocations.length === 0) return [];

      const scheduleItems = await Promise.all(
        allocations.map(async (allocation) => {
          try {
            const shift = await this.getShiftById(allocation.shiftId);
            const timeStart = shift.from
              ? `${String(shift.from).padStart(2, "0")}:00`
              : "??:??";
            const timeEnd = shift.to
              ? `${String(shift.to).padStart(2, "0")}:00`
              : "??:??";
            const timeRange = `${timeStart} - ${timeEnd}`;

            let room = "Não definida";
            if (shift.classroomId) {
              try {
                const classroom = await this.getClassroomById(
                  shift.classroomId
                );
                room = classroom.name || `Sala ${shift.classroomId}`;
              } catch (error) {
                console.warn(
                  `Could not fetch classroom ${shift.classroomId} details:`,
                  error.message
                );
                room = `Sala ${shift.classroomId}`;
              }
            }

            return {
              id: shift.id, // Use shift ID as the primary ID for the schedule item
              shiftId: shift.id,
              name: shift.shiftNumber || "Turno Desconhecido",
              type: shift.type || "T-P",
              day: shift.day || "Dia Indefinido",
              from: shift.from,
              to: shift.to,
              time: timeRange,
              room: room,
              courseId: shift.courseId,
              courseName: shift.ucName || "Disciplina Desconhecida",
              courseAbbr: shift.abbreviation || "???",
              teacherId: shift.teacherId,
            };
          } catch (error) {
            console.error(
              `Error processing allocation ${allocation.id} for student ${studentId}:`,
              error
            );
            return null;
          }
        })
      );
      return scheduleItems.filter((item) => item !== null);
    } catch (error) {
      console.error(`Error fetching schedule for student ${studentId}:`, error);
      return [];
    }
  },

  // --- Courses ---
  async getCourses() {
    return fetchData("/courses");
  },

  async getCourseById(id) {
    return fetchData(`/courses/${id}`);
  },

  // --- Shifts ---
  async getShifts() {
    const shifts = await fetchData("/shifts");
    return Promise.all(shifts.map(enhanceShift));
  },

  async getShiftById(id) {
    const shift = await fetchData(`/shifts/${id}`);
    return enhanceShift(shift);
  },

  async getShiftStudents(shiftId) {
    const allocations = await fetchData(`/allocations?shiftId=${shiftId}`);
    const studentPromises = allocations.map(async (allocation) => {
      try {
        const student = await this.getStudentById(allocation.studentId);
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          status: student.specialStatus ? "Trabalhador-Estudante" : "Normal",
          allocationStatus: {
            // Assuming this is for display in ShiftDetailsView
            label: "Alocado",
            class: "status-allocated",
            actionLabel: "Já Alocado",
            disabled: true,
          },
          canAllocate: false, // Already allocated to this shift
          isAllocated: true,
        };
      } catch (error) {
        console.error(
          `Error getting student details for allocation ${allocation.id}:`,
          error
        );
        return null;
      }
    });
    return (await Promise.all(studentPromises)).filter(Boolean);
  },

  async getAvailableStudentsForShift(shiftId) {
    try {
      const targetShift = await this.getShiftById(shiftId);
      if (!targetShift || !targetShift.courseId) {
        throw new Error(`Shift ${shiftId} or its course ID not found.`);
      }

      const allStudents = await this.getStudents();
      const enrolledStudents = allStudents.filter((student) =>
        (student.enrolled || []).includes(parseInt(targetShift.courseId))
      );

      const allocatedStudentsInTargetShift = await this.getShiftStudents(
        shiftId
      );
      const allocatedIdsInTargetShift = new Set(
        allocatedStudentsInTargetShift.map((s) => s.id.toString())
      );

      const availableStudentsPromises = enrolledStudents
        .filter(
          (student) => !allocatedIdsInTargetShift.has(student.id.toString())
        )
        .map(async (student) => {
          const studentAllocations = await fetchData(
            `/allocations?studentId=${student.id}`
          );
          let isInOtherShiftOfSameType = false;
          let otherShiftName = "";

          for (const allocation of studentAllocations) {
            try {
              // Avoid fetching the target shift again
              if (allocation.shiftId.toString() === shiftId.toString())
                continue;

              const otherShift = await this.getShiftById(allocation.shiftId);
              if (
                otherShift.courseId?.toString() ===
                  targetShift.courseId?.toString() &&
                otherShift.type === targetShift.type
              ) {
                isInOtherShiftOfSameType = true;
                otherShiftName = otherShift.shiftNumber || "Outro Turno";
                break;
              }
            } catch (error) {
              console.warn(
                `Error checking other shift ${allocation.shiftId} for student ${student.id}:`,
                error.message
              );
            }
          }

          return {
            id: student.id,
            name: student.name,
            status: student.specialStatus ? "Trabalhador-Estudante" : "Normal",
            allocationStatus: isInOtherShiftOfSameType
              ? {
                  label: `Alocado em ${otherShiftName}`,
                  class: "status-other-shift",
                  actionLabel: "Trocar para este turno",
                  disabled: false,
                }
              : {
                  label: "Não Alocado",
                  class: "status-not-allocated",
                  actionLabel: "Alocar a este turno",
                  disabled: false,
                },
            canAllocate: true,
            isAllocated: false, // Not allocated to the target shift
          };
        });

      return Promise.all(availableStudentsPromises);
    } catch (error) {
      console.error(
        `Error getting available students for shift ${shiftId}:`,
        error
      );
      return [];
    }
  },

  async allocateStudentToShift(shiftId, studentId) {
    try {
      const shiftIdStr = shiftId.toString();
      const studentIdStr = studentId.toString();

      // 1. Get target shift and student details
      const [targetShift, student] = await Promise.all([
        this.getShiftById(shiftIdStr),
        this.getStudentById(studentIdStr),
      ]);

      // 2. Check capacity (allow special status override)
      if (targetShift.isFull && !student.specialStatus) {
        throw new Error(
          "Shift is full and student does not have special status."
        );
      }

      // 3. Check for existing allocation of the same type in the same course
      const studentAllocations = await fetchData(
        `/allocations?studentId=${studentIdStr}`
      );
      let removedOldAllocation = false;
      for (const allocation of studentAllocations) {
        try {
          // Avoid checking the target shift itself if already allocated (shouldn't happen based on UI flow)
          if (allocation.shiftId.toString() === shiftIdStr) continue;

          const otherShift = await this.getShiftById(allocation.shiftId);
          if (
            otherShift.courseId?.toString() ===
              targetShift.courseId?.toString() &&
            otherShift.type === targetShift.type
          ) {
            console.log(
              `Removing conflicting allocation ${allocation.id} (Shift ${allocation.shiftId}) for student ${studentIdStr}`
            );
            await this.removeStudentFromShift(
              allocation.shiftId,
              studentIdStr,
              allocation.id
            ); // Pass allocation ID for direct delete
            removedOldAllocation = true;
            break; // Assume only one shift per type per course
          }
        } catch (error) {
          console.warn(
            `Error checking/removing conflicting shift ${allocation.shiftId}:`,
            error.message
          );
        }
      }

      // 4. Check if already allocated to the target shift (should ideally be prevented by UI)
      const existingTargetAllocation = studentAllocations.find(
        (alloc) => alloc.shiftId.toString() === shiftIdStr
      );
      if (existingTargetAllocation) {
        console.warn(
          `Student ${studentIdStr} is already allocated to target shift ${shiftIdStr}. Skipping allocation.`
        );
        return existingTargetAllocation; // Return existing allocation
      }

      // 5. Create new allocation
      const newId = await getNextId("allocations");
      const newAllocation = {
        id: newId,
        shiftId: shiftIdStr,
        studentId: studentIdStr,
      };
      const createdAllocation = await postData("/allocations", newAllocation);

      // 6. Update target shift count (only if not already allocated)
      targetShift.totalStudentsRegistered =
        (targetShift.totalStudentsRegistered || 0) + 1;
      await putData(`/shifts/${shiftIdStr}`, targetShift);
      console.log(
        `Updated target shift ${shiftIdStr} count to ${targetShift.totalStudentsRegistered}`
      );

      return createdAllocation;
    } catch (error) {
      console.error(
        `Error allocating student ${studentId} to shift ${shiftId}:`,
        error
      );
      throw error;
    }
  },

  async removeStudentFromShift(shiftId, studentId, allocationId = null) {
    try {
      const shiftIdStr = shiftId.toString();
      const studentIdStr = studentId.toString();
      let deleted = false;

      if (allocationId) {
        // If allocationId is provided, delete directly
        console.log(
          `Attempting direct delete of allocation ID ${allocationId}`
        );
        const result = await deleteData(`/allocations/${allocationId}`);
        deleted = result !== undefined; // Check if deletion occurred (null if 404)
      } else {
        // Find the allocation first if ID is not provided
        const allocations = await fetchData(
          `/allocations?shiftId=${shiftIdStr}&studentId=${studentIdStr}`
        );
        if (!allocations || allocations.length === 0) {
          console.warn(
            `No allocation found for student ${studentIdStr} in shift ${shiftIdStr} to remove.`
          );
          return true; // Nothing to remove
        }
        // Attempt to delete the first found allocation
        const allocToDelete = allocations[0];
        console.log(
          `Attempting to delete allocation ID ${allocToDelete.id} found by query`
        );
        const result = await deleteData(`/allocations/${allocToDelete.id}`);
        deleted = result !== undefined;
      }

      // Update shift count only if a deletion actually happened
      if (deleted) {
        try {
          const shift = await this.getShiftById(shiftIdStr);
          // Ensure count doesn't go below zero
          shift.totalStudentsRegistered = Math.max(
            0,
            (shift.totalStudentsRegistered || 0) - 1
          );
          await putData(`/shifts/${shiftIdStr}`, shift);
          console.log(
            `Updated shift ${shiftIdStr} count to ${shift.totalStudentsRegistered} after removal.`
          );
        } catch (countError) {
          console.error(
            `Error updating count for shift ${shiftIdStr} after removal:`,
            countError
          );
          // Don't throw, removal was successful, but log the count error
        }
      }
      return true; // Indicate success even if count update failed
    } catch (error) {
      // Log the main error but consider the operation potentially successful if the goal is removal
      console.error(
        `Error removing student ${studentId} from shift ${shiftId}:`,
        error
      );
      // Depending on requirements, you might want to re-throw or return false
      // Returning true assumes the goal is removal, and errors might mean it's already gone or partially succeeded.
      return true;
    }
  },

  // --- Classrooms & Buildings ---
  async getBuildings() {
    return fetchData("/buildings");
  },

  async getClassrooms() {
    return fetchData("/classrooms");
  },

  async getClassroomById(id) {
    return fetchData(`/classrooms/${id}`);
  },

  async getAvailableClassrooms() {
    // This function seems complex and potentially inefficient.
    // It fetches all classrooms and all shifts to determine availability.
    // A better approach might involve querying shifts based on time slots if needed,
    // or simplifying the definition of "available".
    // For now, keeping the original logic but noting potential improvements.
    try {
      const [classrooms, shifts, buildings] = await Promise.all([
        this.getClassrooms(),
        fetchData("/shifts"), // Use raw shifts for occupancy check
        this.getBuildings(),
      ]);

      const buildingMap = new Map(buildings.map((b) => [b.id.toString(), b]));
      const occupiedClassroomIds = new Set(
        shifts.map((s) => s.classroomId?.toString()).filter(Boolean)
      );

      return classrooms.map((classroom) => {
        const isOccupied = occupiedClassroomIds.has(classroom.id.toString());
        const building = buildingMap.get(classroom.buildingId?.toString());
        return {
          id: classroom.id,
          building: building?.abbreviation || building?.name || "Ed. ?",
          number: classroom.name || `Sala ${classroom.id}`,
          status: isOccupied ? "Ocupada" : "Livre",
          availability: isOccupied ? "Indisponível" : "Disponível", // Redundant? Status seems sufficient
        };
      });
    } catch (error) {
      console.error("Error fetching available classrooms:", error);
      return [];
    }
  },

  async changeShiftClassroom(shiftId, classroomId) {
    const shift = await this.getShiftById(shiftId); // Fetch enhanced shift to ensure all fields are present
    // Preserve existing data, only update classroomId
    const updatedShiftData = {
      ...shift, // Spread existing data
      classroomId: classroomId ? parseInt(classroomId, 10) : null, // Ensure integer or null
    };
    // Remove potentially calculated fields before PUT
    delete updatedShiftData.ucName;
    delete updatedShiftData.abbreviation;
    delete updatedShiftData.current;
    // capacity might be part of the original shift data, check your db structure
    // delete updatedShiftData.capacity;
    delete updatedShiftData.shiftNumber;
    delete updatedShiftData.status;
    delete updatedShiftData.isFull;

    return putData(`/shifts/${shiftId}`, updatedShiftData);
  },

  async checkRoomAvailability(roomId, startHour, endHour, day) {
    try {
      const roomIdStr = roomId.toString();
      const shifts = await fetchData(
        `/shifts?classroomId=${roomIdStr}&day=${day}`
      );

      for (const shift of shifts) {
        const shiftStart = shift.from;
        const shiftEnd = shift.to;

        // Basic overlap check (assumes hours are integers)
        if (
          shiftStart != null &&
          shiftEnd != null &&
          startHour < shiftEnd &&
          endHour > shiftStart
        ) {
          let courseName = "Disciplina Desconhecida";
          try {
            if (shift.courseId) {
              const course = await this.getCourseById(shift.courseId);
              courseName = course.name;
            }
          } catch (courseError) {
            console.warn(
              `Could not fetch course info for conflicting shift ${shift.id}:`,
              courseError.message
            );
          }
          return {
            available: false,
            conflict: {
              type: "shift",
              shiftId: shift.id,
              shiftName:
                shift.name || shift.shiftNumber || "Turno Desconhecido",
              courseId: shift.courseId,
              courseName: courseName,
              from: shiftStart,
              to: shiftEnd,
              day: shift.day,
            },
          };
        }
      }

      // Check pending classroom requests (less critical, maybe remove if not needed)
      const pendingRequests = await fetchData(
        `/classroomRequests?classroomId=${roomIdStr}&response=null`
      );
      if (pendingRequests && pendingRequests.length > 0) {
        // Simplified pending request conflict
        return {
          available: false,
          conflict: {
            type: "pending_request",
            message: "Sala com pedido pendente.",
          },
        };
      }

      return { available: true };
    } catch (error) {
      console.error(
        `Error checking room availability for room ${roomId}:`,
        error
      );
      return { available: false, error: true }; // Indicate unavailability on error
    }
  },

  // --- Degrees ---
  async getDegrees() {
    return fetchData("/degrees");
  },

  // --- Teachers ---
  async getTeachers() {
    return fetchData("/teachers");
  },

  // --- Notifications ---
  async getNotifications(userId, role) {
    try {
      let notifications = [];
      const userIdStr = userId.toString();

      if (role === "director") {
        const [shiftRequests, classroomRequests, conflicts] = await Promise.all(
          [
            fetchData("/shiftRequests?response=null"), // Only pending
            fetchData("/classroomRequests?response=null"), // Only pending
            this.getConflicts(), // All conflicts
          ]
        );

        shiftRequests.forEach((req) =>
          notifications.push({
            id: `shift_${req.id}`,
            title: `Pedido de Troca de Turno`,
            message: `Aluno ID ${req.studentId} pediu troca (Turno ID ${req.shiftId})`,
            date: req.date || new Date().toISOString(),
            time: formatTimeAgo(req.date || new Date()),
            type: "shift_request",
            read: false, // Directors don't "read" requests here, they process them
            requestId: req.id,
            requestType: "shift",
          })
        );

        classroomRequests.forEach((req) =>
          notifications.push({
            id: `classroom_${req.id}`,
            title: `Pedido de Mudança de Sala`,
            message: `Professor ID ${req.teacherId} pediu Sala ID ${req.classroomId}`,
            date: req.date || new Date().toISOString(),
            time: formatTimeAgo(req.date || new Date()),
            type: "classroom_request",
            read: false,
            requestId: req.id,
            requestType: "classroom",
          })
        );

        conflicts.forEach((conflict) =>
          notifications.push({
            id: `conflict_${conflict.id}`,
            title: `Conflito de Horário Detectado`,
            message: `Aluno ID ${conflict.studentId} - UCs: ${
              conflict.courseIDs?.join(", ") || "N/A"
            }`,
            date: conflict.timestamp || new Date().toISOString(),
            time: formatTimeAgo(conflict.timestamp || new Date()),
            type: "conflict",
            read: false, // Conflicts might need separate handling
            conflictId: conflict.id,
          })
        );
      } else if (role === "student") {
        const [answeredShiftRequests, scheduleUpdates] = await Promise.all([
          fetchData(
            `/shiftRequests?studentId=${userIdStr}&response_ne=null&responseSeenByStudent=false`
          ), // Answered, not seen
          fetchData(
            `/notifications?studentId=${userIdStr}&type=schedule_update&read=false`
          ), // Unread schedule updates
        ]);

        answeredShiftRequests.forEach((req) => {
          const status = req.response === "ok" ? "aprovado" : "rejeitado";
          notifications.push({
            id: `shift_response_${req.id}`,
            title: `Pedido de Troca ${status}`,
            message: `Seu pedido (Turno ID ${req.shiftId}) foi ${status}.`,
            date: req.date || new Date().toISOString(),
            time: formatTimeAgo(req.date || new Date()),
            type: "shift_response",
            read: false,
            requestId: req.id,
            status: status,
          });
        });

        scheduleUpdates.forEach((notif) =>
          notifications.push({
            id: `schedule_${notif.id}`,
            title: notif.title || "Horário Atualizado",
            message: notif.message || "Seu horário foi atualizado.",
            date: notif.date || new Date().toISOString(),
            time: formatTimeAgo(notif.date || new Date()),
            type: "schedule_update",
            read: false,
            notificationId: notif.id,
          })
        );
      } else if (role === "teacher") {
        const answeredClassroomRequests = await fetchData(
          `/classroomRequests?teacherId=${userIdStr}&response_ne=null&responseSeenByTeacher=false`
        ); // Answered, not seen

        answeredClassroomRequests.forEach((req) => {
          const status = req.response === "ok" ? "aprovado" : "rejeitado";
          notifications.push({
            id: `classroom_response_${req.id}`,
            title: `Pedido de Sala ${status}`,
            message: `Seu pedido (Sala ID ${req.classroomId}) foi ${status}.`,
            date: req.date || new Date().toISOString(),
            time: formatTimeAgo(req.date || new Date()),
            type: "classroom_response",
            read: false,
            requestId: req.id,
            status: status,
          });
        });
      }

      // Sort by date descending
      notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
      return notifications;
    } catch (error) {
      console.error(
        `Error fetching notifications for ${role} ${userId}:`,
        error
      );
      return []; // Return empty array on error
    }
  },

  async markNotificationAsRead(notificationId, role, userId) {
    try {
      let updateEndpoint = "";
      let updatePayload = { read: true }; // Default for generic notifications
      let idToUpdate = "";

      if (role === "student") {
        if (notificationId.startsWith("shift_response_")) {
          idToUpdate = notificationId.replace("shift_response_", "");
          updateEndpoint = `/shiftRequests/${idToUpdate}`;
          // Fetch current request to merge data correctly
          const currentRequest = await fetchData(updateEndpoint);
          updatePayload = { ...currentRequest, responseSeenByStudent: true };
        } else if (notificationId.startsWith("schedule_")) {
          idToUpdate = notificationId.replace("schedule_", "");
          updateEndpoint = `/notifications/${idToUpdate}`;
          // Fetch current notification to merge data correctly
          const currentNotif = await fetchData(updateEndpoint);
          updatePayload = { ...currentNotif, read: true };
        }
      } else if (role === "teacher") {
        if (notificationId.startsWith("classroom_response_")) {
          idToUpdate = notificationId.replace("classroom_response_", "");
          updateEndpoint = `/classroomRequests/${idToUpdate}`;
          // Fetch current request to merge data correctly
          const currentRequest = await fetchData(updateEndpoint);
          updatePayload = { ...currentRequest, responseSeenByTeacher: true };
        }
      }

      if (updateEndpoint && idToUpdate) {
        await putData(updateEndpoint, updatePayload);
        return { success: true };
      } else {
        console.warn(
          `Could not determine how to mark notification ${notificationId} as read for role ${role}.`
        );
        return {
          success: false,
          message: "Unknown notification type or role.",
        };
      }
    } catch (error) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        error
      );
      throw error;
    }
  },

  async createScheduleUpdateNotification(studentId) {
    try {
      const newId = await getNextId("notifications");
      const notification = {
        id: newId,
        studentId: studentId.toString(),
        title: "Horário Atualizado",
        message:
          "O seu horário foi atualizado. Por favor, verifique as alterações.",
        date: new Date().toISOString(),
        read: false,
        type: "schedule_update",
      };
      return postData("/notifications", notification);
    } catch (error) {
      console.error(
        `Error creating schedule notification for student ${studentId}:`,
        error
      );
      throw error;
    }
  },

  async publishAllSchedules() {
    try {
      const students = await this.getStudents();
      let notifiedCount = 0;
      const notificationPromises = [];

      for (const student of students) {
        // Simple check: assume if a student exists, they might need notification.
        // A more robust check might involve verifying recent allocations or enrollments.
        notificationPromises.push(
          this.createScheduleUpdateNotification(student.id)
            .then(() => notifiedCount++)
            .catch((err) =>
              console.warn(
                `Failed to create notification for student ${student.id}: ${err.message}`
              )
            )
        );
      }

      await Promise.all(notificationPromises);
      return {
        success: true,
        message: `Horários publicados. ${notifiedCount} alunos notificados.`,
      };
    } catch (error) {
      console.error("Error publishing all schedules:", error);
      throw error;
    }
  },

  // --- Requests ---
  async createStudentShiftRequest(
    studentId,
    currentShiftId,
    reason,
    alternativeShiftId = null
  ) {
    try {
      const newId = await getNextId("shiftRequests");
      const requestData = {
        id: newId,
        studentId: parseInt(studentId, 10),
        shiftId: parseInt(currentShiftId, 10), // The shift the student is currently in or wants to leave
        reason: reason,
        alternativeShiftId: alternativeShiftId
          ? parseInt(alternativeShiftId, 10)
          : null, // The desired shift
        response: null, // Pending
        responseSeenByStudent: false,
        date: new Date().toISOString(),
      };
      return postData("/shiftRequests", requestData);
    } catch (error) {
      console.error("Error creating student shift request:", error);
      throw error;
    }
  },

  async getRequests(role, userId = null) {
    try {
      let shiftRequests = [];
      let classroomRequests = [];

      if (role === "director") {
        [shiftRequests, classroomRequests] = await Promise.all([
          fetchData("/shiftRequests"),
          fetchData("/classroomRequests"),
        ]);
      } else if (role === "student" && userId) {
        shiftRequests = await fetchData(`/shiftRequests?studentId=${userId}`);
      } else if (role === "teacher" && userId) {
        classroomRequests = await fetchData(
          `/classroomRequests?teacherId=${userId}`
        );
      } else {
        return []; // Invalid role/userId combination
      }

      const processRequest = async (request) => {
        try {
          let type = "Desconhecido";
          let personName = "Desconhecido";
          let courseName = "N/A";
          let shiftDetail = "N/A"; // Represents shift name or classroom name
          let personType = ""; // 'student' or 'teacher'
          let fetchedCourseId = null; // Variable to store courseId

          if (request.studentId) {
            // Shift Request
            type = "Troca de Turno";
            personType = "student";
            try {
              const student = await this.getStudentById(request.studentId);
              personName = student.name;
            } catch {
              personName = `Aluno ID ${request.studentId}`;
            }

            if (request.shiftId) {
              try {
                // Fetch shift to get course name AND courseId
                const shift = await this.getShiftById(request.shiftId);
                fetchedCourseId = shift.courseId; // Store the courseId
                courseName = shift.ucName || "Curso Desconhecido";
                shiftDetail = shift.shiftNumber || `Turno ${request.shiftId}`;
              } catch {
                courseName = "Curso (Erro ao buscar)";
                shiftDetail = `Turno ${request.shiftId}`;
              }
            }
          } else if (request.teacherId) {
            // Classroom Request
            type = "Mudança de Sala";
            personType = "teacher";
            try {
              const teacher = await fetchData(`/teachers/${request.teacherId}`); // Assuming direct fetch is okay
              personName = teacher.name;
            } catch {
              personName = `Professor ID ${request.teacherId}`;
            }
            if (request.classroomId) {
              try {
                const classroom = await this.getClassroomById(
                  request.classroomId
                );
                shiftDetail = classroom.name || `Sala ${request.classroomId}`; // Use classroom name as detail
              } catch {
                shiftDetail = `Sala ${request.classroomId}`;
              }
            }
            // Classroom requests don't inherently belong to a single course in this context
            courseName = "N/A";
          }

          return {
            id: request.id,
            type: type,
            personName: personName,
            personType: personType,
            courseName: courseName,
            courseId: fetchedCourseId, // Add courseId here
            detail: shiftDetail, // Generic detail (shift name or classroom name)
            date: request.date || new Date().toISOString(),
            reason: request.reason || "Não especificado",
            status: !request.response
              ? "pending"
              : request.response === "ok"
              ? "approved"
              : "rejected",
            requestData: request, // Keep original data if needed
          };
        } catch (processError) {
          console.error(
            `Error processing request ${request.id}:`,
            processError
          );
          return {
            id: request.id,
            type: "Erro",
            status: "error",
            requestData: request,
          };
        }
      };

      const allRequests = [...shiftRequests, ...classroomRequests];
      const processedRequests = await Promise.all(
        allRequests.map(processRequest)
      );
      // Sort by date descending
      processedRequests.sort((a, b) => new Date(b.date) - new Date(a.date));
      return processedRequests;
    } catch (error) {
      console.error(
        `Error fetching requests for ${role} ${userId || ""}:`,
        error
      );
      return [];
    }
  },

  async updateRequestStatus(requestId, status, requestType) {
    // status: 'approved' or 'rejected'
    const responseValue = status === "approved" ? "ok" : "rejected";
    const endpoint =
      requestType === "shift"
        ? `/shiftRequests/${requestId}`
        : `/classroomRequests/${requestId}`;

    try {
      const request = await fetchData(endpoint);
      const updatedRequest = { ...request, response: responseValue };

      const response = await putData(endpoint, updatedRequest);

      // Handle side effects of approval
      if (status === "approved") {
        if (
          requestType === "shift" &&
          request.alternativeShiftId &&
          request.studentId &&
          request.shiftId
        ) {
          console.log(
            `Processing approved shift change for request ${requestId}`
          );
          // Allocate to new shift (will handle removal from old one internally)
          await this.allocateStudentToShift(
            request.alternativeShiftId,
            request.studentId
          );
        } else if (
          requestType === "classroom" &&
          request.shiftId &&
          request.classroomId
        ) {
          console.log(
            `Processing approved classroom change for request ${requestId}`
          );
          await this.changeShiftClassroom(request.shiftId, request.classroomId);
        }
      }
      return response;
    } catch (error) {
      console.error(
        `Error updating ${requestType} request ${requestId} status to ${status}:`,
        error
      );
      throw error;
    }
  },

  // --- Conflicts ---
  async getConflicts() {
    return fetchData("/conflicts");
  },

  async getStudentConflicts(studentId) {
    return fetchData(`/conflicts?studentId=${studentId}`);
  },

  async getConflictById(id) {
    return fetchData(`/conflicts/${id}`);
  },

  async createConflict(conflictData) {
    // Ensure courseIDs is an array of numbers if needed by backend
    const payload = {
      ...conflictData,
      studentId: parseInt(conflictData.studentId, 10),
      courseIDs: (conflictData.courseIDs || []).map((id) => parseInt(id, 10)),
      timestamp: conflictData.timestamp || new Date().toISOString(),
    };
    // Generate ID if not provided
    if (!payload.id) {
      payload.id = await getNextId("conflicts");
    }
    return postData("/conflicts", payload);
  },

  async deleteConflict(id) {
    return deleteData(`/conflicts/${id}`);
  },

  async checkConflictChanges(studentId, oldConflicts) {
    // This function compares old and new conflicts. Consider if this logic
    // is better placed in the component that uses it, rather than the API service.
    try {
      const newConflicts = await this.getStudentConflicts(studentId);
      const oldConflictIds = new Set(oldConflicts.map((c) => c.id));
      const newConflictIds = new Set(newConflicts.map((c) => c.id));

      const resolved = oldConflicts.filter((c) => !newConflictIds.has(c.id));
      const created = newConflicts.filter((c) => !oldConflictIds.has(c.id));

      // Optionally enhance with course names (adds extra API calls)
      const enhanceConflictList = async (conflicts) => {
        return Promise.all(
          conflicts.map(async (conflict) => {
            const courseNames = await Promise.all(
              (conflict.courseIDs || []).map(async (id) => {
                try {
                  return (await this.getCourseById(id)).name;
                } catch {
                  return `Curso ${id}`;
                }
              })
            );
            return { ...conflict, courseNames };
          })
        );
      };

      const [resolvedWithDetails, createdWithDetails] = await Promise.all([
        enhanceConflictList(resolved),
        enhanceConflictList(created),
      ]);

      return {
        resolved: resolvedWithDetails,
        created: createdWithDetails,
        hasChanges: resolved.length > 0 || created.length > 0,
      };
    } catch (error) {
      console.error(
        `Error checking conflict changes for student ${studentId}:`,
        error
      );
      return { resolved: [], created: [], hasChanges: false };
    }
  },

  async markCoursesWithConflicts(courses, studentId) {
    // Similar to checkConflictChanges, consider if this belongs in the component.
    try {
      const conflicts = await this.getStudentConflicts(studentId);
      const conflictingCourseIds = new Set();
      conflicts.forEach((conflict) => {
        (conflict.courseIDs || []).forEach((id) =>
          conflictingCourseIds.add(id.toString())
        );
      });

      // Return a new array with marked courses
      return courses.map((course) => ({
        ...course,
        hasConflict: conflictingCourseIds.has(course.id.toString()),
      }));
    } catch (error) {
      console.error(
        `Error marking courses with conflicts for student ${studentId}:`,
        error
      );
      // Return original courses on error
      return courses.map((course) => ({ ...course, hasConflict: false }));
    }
  },
};

export default apiService;
