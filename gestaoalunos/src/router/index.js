import { createRouter, createWebHistory } from "vue-router";

// Common views
import LoginView from "../views/LoginView.vue";

// Route groups
const directorRoutes = [
  {
    path: "/requests",
    name: "director-requests",
    component: () => import("../views/director/RequestsView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/shifts",
    name: "director-shifts",
    component: () => import("../views/director/ShiftsView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/shifts/:id/details",
    name: "shift-details",
    component: () => import("../views/director/ShiftDetailsView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/shifts/:id/room",
    name: "shift-room",
    component: () => import("../views/director/ShiftRoomView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/students",
    name: "students",
    component: () => import("../views/director/StudentsView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/students/:id",
    name: "student-details",
    component: () => import("../views/director/StudentDetailsView.vue"),
    props: (route) => ({ key: route.fullPath }),
    meta: { requiresAuth: true, role: "director" },
  },
  {
    path: "/profile",
    name: "director-profile",
    component: () => import("../views/director/ProfileView.vue"),
    meta: { requiresAuth: true, role: "director" },
  },
];

const studentRoutes = [
  {
    path: "/student-schedule",
    name: "student-schedule",
    component: () => import("../views/student/ScheduleView.vue"),
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student-requests",
    name: "student-requests",
    component: () => import("../views/student/RequestsView.vue"),
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student-profile",
    name: "student-profile",
    component: () => import("../views/student/ProfileView.vue"),
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student-UCs",
    name: "student-UCs",
    component: () => import("../views/student/UCsView.vue"),
    meta: { requiresAuth: true, role: "student" },
  },
];

// Auth-related routes
const authRoutes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    redirect: () => {
      const userRole = localStorage.getItem("userRole");
      const isAuthenticated =
        localStorage.getItem("isAuthenticated") === "true";

      if (!isAuthenticated) return "/login";
      return userRole === "director" ? "/profile" : "/student-profile";
    },
  },
];

// Combine all routes
const routes = [...authRoutes, ...directorRoutes, ...studentRoutes];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Helper functions for navigation guard
const isAuthenticated = () =>
  localStorage.getItem("isAuthenticated") === "true";
const getUserRole = () => localStorage.getItem("userRole");
const getHomeRoute = (role) =>
  role === "director" ? "/requests" : "/student-schedule";

// Navigation guard for auth and role-based access
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  // Handle authentication requirement
  if (to.meta.requiresAuth && !authenticated) {
    return next("/login");
  }

  // Handle role-based access
  if (to.meta.role && to.meta.role !== userRole) {
    return authenticated ? next(getHomeRoute(userRole)) : next("/login");
  }

  // Redirect from login if already authenticated
  if (to.path === "/login" && authenticated) {
    return next(getHomeRoute(userRole));
  }

  next();
});

export default router;
