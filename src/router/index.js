import Vue from 'vue'
import VueRouter from 'vue-router'
import SiteList from '../views/SiteList.vue'
import SiteAdd from '../views/SiteAdd.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'site-list',
    component: SiteList
  },
  {
    path: '/add',
    name: 'site-add',
    component: SiteAdd
  }
]

const router = new VueRouter({
  routes
})

export default router
