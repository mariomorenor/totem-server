import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "home",
  },
  {
    path: "/home",
    name: "home",
    component: Home,
  },
  {
    path: "/config",
    name: "config",
    component: () => import("../views/Config.vue"),
  },
  {
    path: "/salidas",
    name: "salidas",
    component: () => import("../views/Salidas.vue"),
  },
  {
    path: "/automation",
    name: "automation",
    component: () => import("../views/Automation.vue"),
  },
];

const router = new VueRouter({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  linkActiveClass:"is-active",
  base: process.env.BASE_URL,
  routes,
});

export default router;
