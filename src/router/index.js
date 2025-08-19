import { createRouter, createWebHashHistory } from "vue-router"
import Login from "../views/Login.vue"
import Dashboard from "../views/Dashboard.vue"
import SpreadsheetView from "../views/SpreadsheetView.vue"
import TestPage from "../views/Test.vue"
import CalendarView from "../views/CalendarView.vue"

const routes = [
  { 
    path: "/", 
    component: Login, 
    name: "Login" 
  },
  { 
    path: "/dashboard", 
    component: Dashboard, 
    name: "Dashboard",
    meta: { requiresAuth: true }
  },
  { 
    path: "/spreadsheet", 
    component: SpreadsheetView, 
    name: "Spreadsheet",
    meta: { requiresAuth: true }
  },
  { 
    path: "/calendar", 
    component: CalendarView, 
    name: "Calendar",
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      // Redirect to login if no user is stored
      next({ name: 'Login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router