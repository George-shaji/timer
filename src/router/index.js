import { createRouter, createWebHistory } from "vue-router"
import Login from "../views/Login.vue"
import Dashboard from "../views/Dashboard.vue"

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
    props: route => ({ email: route.query.email })
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})