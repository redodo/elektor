import Vue from 'vue'
import VueRouter from 'vue-router'
import SiteList from '@/views/SiteList.vue'

import Add from '@/views/Add.vue'
import SignIn from '@/views/SignIn.vue'
import Manage from '@/views/Manage.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'site-list',
    component: SiteList
  },
  {
    path: '/add',
    name: 'add',
    component: Add
  },
  {
    path: '/sign-in/:id',
    name: 'sign-in',
    component: SignIn
  },
  {
    path: '/manage/:id',
    name: 'manage',
    component: Manage
  }
]

const router = new VueRouter({
  routes
})

export default router
