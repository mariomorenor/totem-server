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
    <b-notification
      title="info!"
      type="is-info"
      has-icon
      v-model="donwloadInProgress"
      aria-close-label="Close notification"
    >
      Se está descargando una nueva actualización, por favor no salgas de la
      aplicación :3
    </b-notification>
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
      donwloadInProgress: false,
      duration: 100,
    };
  },
  mounted() {
    ipcRenderer.on("win-message", (event, data) => {
      console.log(data);
      if (data.status == 1) {
        this.donwloadInProgress = true;
      }
      if (data.status == 2) {
        this.donwloadInProgress = false;
        this.duration = 100;
      }
    });

    ipcRenderer.on("download-progress", (event, data) => {
      console.log(data);
      this.duration = this.duration - data;
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
