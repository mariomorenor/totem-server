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
          <img
            v-if="!streaming"
            id="img_no_streaming"
            src="../assets/logogs.jpg"
            alt=""
          />
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
            <b-button icon-left="sync" class="ml-2" @click="reloadTotem(totem)" size="is-small" type="is-info is-light"></b-button>
          </div>
          <div
            v-if="totem.lost_call"
            class="is-flex is-justify-content-space-between"
          >
            <div></div>
            <div>
              <b-tag type="is-danger" icon="phone-slash"></b-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    <audio id="notification">
      <source type="audio/mp3" src="../assets/notification.mp3" />
    </audio>
    <audio id="notification_silent" loop>
      <source type="audio/mp3" src="../assets/call_in_wait.mp3" />
    </audio>
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
      eventCall: [],
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
      let self = this;
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

      ipcRenderer.on("calling", (event, data) => {
        let notification_audio = document.getElementById("notification");
        console.log(notification_audio);
        if (this.streaming) {
          notification_audio = document.getElementById("notification_silent");
        }

        notification_audio.play();

        self.$buefy.toast.open({
          duration: 5000,
          message: `El Tótem ${data.nombre} está llamando`,
          type: "is-danger",
        });
        self.eventCall.push(
          setTimeout(() => {
            self.totems.forEach((t) => {
              if (t.socket_id == data.socket_id) {
                t.lost_call = true;
              }
            });
          }, 5000)
        );
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
      totem.lost_call = false;
      this.stopSounds();
      for (let index = 0; index < this.eventCall.length; index++) {
        clearTimeout(this.eventCall[index]);
      }
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
      let beep = document.getElementById("notification_silent");
      beep.pause();
      beep.currentTime = 0;
    },
    stopSounds(){
      let notification_audio = document.getElementById("notification");
      let notification_audio_silent = document.getElementById("notification_silent");
      notification_audio.pause();
      notification_audio_silent.pause();
      notification_audio.currentTime = 0;
      notification_audio_silent.currentTime = 0;
    },
    reloadTotem(totem){
      this.stopSounds();
      ipcRenderer.send("reload-totem",totem)
    }
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
#totem-cam,
#img_no_streaming {
  width: 450px;
  height: 225px;
  object-fit: fill;
}
</style>