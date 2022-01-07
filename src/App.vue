<template>
  <div id="app">
    <b-sidebar v-model="sidebarOpen" :fullheight="true">
      <div class="p-1">
        <div class="image-container">
          <img src="./assets/logo-letras-blancas.png" alt="" />
        </div>
        <b-menu>
          <b-menu-list label="">
            <b-menu-item
              tag="router-link"
              :to="{ name: 'home' }"
              label="Vista Principal"
            ></b-menu-item>
            <b-menu-item
              tag="router-link"
              :to="{ name: 'config' }"
              label="Configuración"
            ></b-menu-item>
          </b-menu-list>
        </b-menu>
      </div>
    </b-sidebar>
    <b-button @click="sidebarOpen = !sidebarOpen" icon-left="bars"></b-button>
    <router-view />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
export default {
  data() {
    return {
      sidebarOpen: false,
    };
  },
  mounted() {
    ipcRenderer.on("win-message", (event, data) => {
      console.log(data);
    });
  },
};
</script>

<style lang="scss">
.image-container {
  background: #04326d;
  padding: 0.5rem;
  border-radius: 0.2rem;
}
</style>
