import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import Buefy from "buefy";
import "buefy/dist/buefy.min.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";


library.add(fas);

Vue.config.productionTip = false;
Vue.component("fa", FontAwesomeIcon);
Vue.use(Buefy, {
  defaultIconPack: "fas",
  defaultIconComponent: "fa",
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
