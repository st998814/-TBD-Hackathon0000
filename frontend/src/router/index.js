import { createRouter, createWebHistory } from 'vue-router'

// Lazy-load views for better performance
import Home from '../views/HomePage.vue'
// import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
//   {
//     path: '/about',
//     name: 'About',
//     component: About
//   },
  // catch-all route for 404
//   {
//     path: '/:pathMatch(.*)*',
//     name: 'NotFound',
//     component: () => import('../views/NotFound.vue')
//   }
]

const router = createRouter({
  history: createWebHistory(), // uses HTML5 history mode
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router