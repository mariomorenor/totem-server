<template>
  <div class="home">
    <div class="columns">
      <div class="column is-6">
        <div class="is-flex is-justify-content-center">
          <video id="webcam"></video>
        </div>
      </div>
      <div class="column is-6">
        <div class="is-flex is-justify-content-center">
          <video v-if="streaming" id="totem-cam"></video>
          <img v-if="!streaming" id="img_no_streaming" src="../assets/logogs.jpg" alt="">
        </div>
      </div>
    </div>
    <div class="totems-list px-2">
      <div class="is-flex is-justify-content-center">
        <div class="card mx-2" v-for="totem in totems" :key="totem.id">
          <div class="card-header">
            <p class="p-3 totem-name">{{ totem.nombre }}</p>
            <div class="p-3">
              <b-tag
                v-if="totem.estado == 'promocion'"
                type="is-info"
                icon="bullhorn"
                size="is-medium"
                >Promoción</b-tag
              >
              <b-tag
                v-if="totem.estado == 'directo'"
                type="is-danger"
                icon="satellite-dish"
                size="is-medium"
                >Directo</b-tag
              >
            </div>
          </div>
          <div class="card-content">
            <p>
              <strong>Video:</strong>
              <span>{{ videoName(totem.videos[0]) }}</span>
            </p>
            <b-button
              :disabled="totem.callInProgress || streaming"
              @click="connectTotem(totem)"
              type="is-success"
              size="is-small"
              v-if="totem.estado == 'promocion'"
              :loading="totem.callInProgress"
              >Conectar</b-button
            >
            <b-button
              @click="disconnectTotem(totem)"
              type="is-warning"
              size="is-small"
              v-if="totem.estado == 'directo'"
              >Desconectar</b-button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
const Store = require("electron-store");
const storage = new Store();
const path = require("path");
export default {
  name: "Home",
  components: {},
  data() {
    return {
      totems: [],
      webcam: "",
      microphone: "",
    };
  },
  beforeMount() {
    this.init();
  },
  mounted() {
    this.previewCam();
  },
  computed: {
    streaming() {
      return this.totems.some((t) => t.callInProgress);
    },
  },
  methods: {
    init() {
      this.webcam = storage.get("webcam_id");
      this.microphone = storage.get("microphone_id");

      ipcRenderer.on("nuevo-totem", (event, data) => {
        this.totems.push(data);
      });

      ipcRenderer.invoke("get-sockets").then((sockets) => {
        this.totems = sockets.filter((s) => {
          if (Object.keys(s).length > 0) {
            return s;
          }
        });
      });

      ipcRenderer.on("remove-totem", (event, data) => {
        this.totems = this.totems.filter((t) => data.socket_id != t.socket_id);
      });
    },
    videoName(video) {
      return path.basename(video);
    },
    previewCam() {
      let self = this;
      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: self.webcam,
          },
        })
        .then((stream) => {
          let video = document.getElementById("webcam");
          video.srcObject = stream;
          video.play();
        });
    },
    connectTotem(totem) {
      let self = this;
      totem.callInProgress = true;
      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: self.webcam,
          },
          audio: {
            deviceId: self.microphone,
          },
        })
        .then((stream) => {
          let call = self.$peer.call(totem.peer_id, stream);
          call.on("stream", (remoteStream) => {
            let remoteVideo = document.getElementById("totem-cam");
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();

            totem.estado = "directo";
          });
        });
    },
    disconnectTotem(totem) {
      ipcRenderer.send("disconnect-totem", { socket_id: totem.socket_id });
      totem.estado = "promocion";
      totem.callInProgress = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.totem-name {
  width: 130px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#webcam,
#totem-cam,#img_no_streaming {
  width: 450px;
  height: 225px;
  object-fit: fill;
}
</style>