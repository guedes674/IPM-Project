<template>
  <div class="profile-info">
    <div class="profile-avatar">
      <img :src="avatar" :alt="`${name}'s avatar`" />
    </div>
    <div class="profile-details">
      <h2>{{ name }}</h2>
      <p>{{ email }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.profile-info {
  display: flex;
  align-items: center;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  width: 100px;
  height: 100px;
  margin-right: 2rem;
  border-radius: 50%;
  overflow: hidden;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  flex: 1;
}

.profile-details h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.profile-details p {
  font-size: 1rem;
  color: #666;
}
</style>
