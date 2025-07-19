<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="conflict-modal">
      <div class="conflict-modal-header">
        <h2>Conflito de Horário</h2>
      </div>
      <div class="conflict-modal-body">
        <div class="conflict-info">
          <p>
            Foi detectado um conflito de horário para
            <strong>{{ conflictDetails.day }}</strong> no horário
            <strong>{{ conflictDetails.timeSlot }}</strong
            >.
          </p>

          <div class="conflict-details">
            <h3>Disciplinas em Conflito:</h3>
            <div class="conflicting-courses">
              <div
                v-for="(course, index) in conflictCourses"
                :key="course.id"
                class="course-item"
              >
                <div class="course-header">
                  <h4>{{ course.name }} ({{ course.abbreviation }})</h4>
                </div>
                <div class="course-shifts">
                  <div
                    v-for="shift in course.shifts"
                    :key="shift.id"
                    class="shift-info"
                  >
                    <div class="shift-name">{{ shift.name }}</div>
                    <div class="shift-time">
                      {{ shift.day }}, {{ shift.startTime }} -
                      {{ shift.endTime }}
                    </div>
                    <div class="shift-location">{{ shift.location }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="conflict-modal-footer">
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
  conflictDetails: {
    type: Object,
    required: true,
  },
  conflictCourses: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["close"]);
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

.conflict-modal {
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

.conflict-modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conflict-modal-header h2 {
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

.conflict-modal-body {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  color: #fff;
}

.conflict-icon {
  font-size: 40px;
  color: #f56565;
}

.conflict-info {
  flex: 1;
}

.conflict-details {
  background-color: rgba(50, 61, 78, 1);
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
}

.conflict-details h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #f56565;
  font-size: 16px;
}

.conflicting-courses {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.course-item {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  border-left: 3px solid #f56565;
}

.course-header h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.course-shifts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shift-info {
  font-size: 14px;
  border-left: 2px solid rgba(245, 101, 101, 0.3);
  padding-left: 10px;
  margin-left: 5px;
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

.conflict-modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

/* Responsive styles */
@media (max-width: 768px) {
  .conflict-modal-body {
    flex-direction: column;
    align-items: center;
  }

  .conflict-icon {
    margin-bottom: 15px;
  }
}
</style>
