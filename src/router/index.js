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
];

const router = new VueRouter({
  mode: "history",
  linkActiveClass:"is-active",
  base: process.env.BASE_URL,
  routes,
});

export default router;
