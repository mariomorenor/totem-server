<template>
  <div class="home">
    <div class="columns">
      <div class="column is-6">
        <div class="is-flex is-justify-content-center">
          <div class="cam_preview">
            <video
              id="webcam"
              :class="{
                top: cam_orientation == 0 || cam_orientation == 360,
                right: cam_orientation == 90,
                bottom: cam_orientation == 180,
                left: cam_orientation == 270,
              }"
              muted
              autoplay
            ></video>
          </div>
          <!-- <video id="webcam"></video> -->
        </div>
      </div>
      <div class="column is-6">
        <div class="is-flex is-justify-content-center">
          <video v-if="streaming" id="totem-cam"></video>
          <img
            v-if="!streaming"
            id="img_no_streaming"
            src="../assets/espera.gif"
            alt=""
          />
        </div>
      </div>
    </div>
    <div class="totems-list px-2">
      <div class="is-flex is-flex-wrap-wrap is-justify-content-center">
        <div class="card mx-2 my-1" v-for="totem in totems" :key="totem.id">
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
            <b-button
              icon-left="sync"
              class="ml-2"
              @click="reloadTotem(totem)"
              size="is-small"
              type="is-info is-light"
            ></b-button>
            <b-field label="Volumen">
              <b-slider
                @change="setVolume(totem)"
                v-model="totem.volume"
                tooltip-type="is-info"
              ></b-slider>
            </b-field>
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
    <video id="screen" muted></video>
  </div>
</template>

<script>
import { desktopCapturer, ipcRenderer } from "electron";
const Store = require("electron-store");
const storage = new Store();
const path = require("path");
const fs = require("fs");
/* eslint-disable no-undef */
var peerJS = new Peer();
const { app } = require("@electron/remote");
var sound = new Audio(app.getPath("music") + "/notification.mp3");

var sound_silent = new Audio(app.getPath("music") + "/call_in_wait.mp3");
const moment = require("moment");
export default {
  name: "Home",
  components: {},
  data() {
    return {
      totems: [],
      webcam: "",
      microphone: "",
      eventCall: [],
      cam_orientation: 0,
      sound: new Audio("./notification.mp3"),
      sound_silent: new Audio("./call_in_wait.mp3"),
      recorder: null,
      streamVideo: null,
      streamcom: null,
    };
  },
  beforeMount() {
    moment.locale("es-MX")
    this.init();
  },
  mounted() {
    this.previewCam();
    this.screenCapture();
  },
  computed: {
    streaming() {
      return this.totems.some((t) => t.callInProgress);
    },
  },
  methods: {
    init() {
      let self = this;
      this.cam_orientation = storage.get("cam_orientation")
        ? storage.get("cam_orientation")
        : 0;
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
        if (!self.streaming) {
          if (sound.paused) {
            sound.play();
          }
        } else {
          if (sound_silent.paused) {
            sound_silent.play();
          }
        }

        self.$buefy.toast.open({
          duration: 5000,
          message: `El Tótem ${data.nombre} está llamando`,
          type: "is-danger",
          queue: true,
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
          audio: true,
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
      for (let index = 0; index < this.eventCall.length; index++) {
        clearTimeout(this.eventCall[index]);
      }
      this.eventCall = [];
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
          let call = peerJS.call(totem.peer_id, stream);
          call.on("stream", (remoteStream) => {
            let remoteVideo = document.getElementById("totem-cam");
            totem.estado = "directo";
            self.handleStream(self.streamVideo, totem);
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();
          });
        });
    },
    disconnectTotem(totem) {
      ipcRenderer.send("disconnect-totem", { socket_id: totem.socket_id });
      totem.estado = "promocion";
      totem.callInProgress = false;
      // let beep = document.getElementById("notification_silent");
      // beep.pause();
      // beep.currentTime = 0;
      this.stopRecord();
    },
    screenCapture() {
      let self = this;
      desktopCapturer
        .getSources({ types: ["window"] })
        .then(async (sources) => {
          for (const source of sources) {
            if (source.name === "Tótem Server") {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    mandatory: {
                      chromeMediaSource: "desktop"
                    },
                  },
                  video: {
                    mandatory: {
                      chromeMediaSource: "desktop",
                      chromeMediaSourceId: source.id,
                    },
                  },
                });
                const audio = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    deviceId:self.microphone
                  },
                  video: false
                });
                self.streamcom = audio
                self.streamVideo = new MediaStream([...stream.getVideoTracks(), ...audio.getAudioTracks()]);
                console.log(source);
              } catch (e) {
                console.log(e);
              }
              return;
            }
          }
        });
    },
    handleStream(stream, totem) {
      this.recorder = new MediaRecorder(stream);
      this.recorder.start();
      let self = this;
      // If start does not set timeslice, ondataavailable will be triggered at stop
      this.recorder.ondataavailable = (event) => {
        let blob = new Blob([event.data], {
          type: "video/mp4",
        });
        self.saveVideo(blob, totem);
      };
      this.recorder.onerror = (err) => {
        console.error(err);
      };
    },
    saveVideo(blob, totem) {
      let reader = new FileReader(blob);
      reader.onload = () => {
        let buffer = new Buffer(reader.result);
        if (
          !fs.existsSync(
            path.join(
              app.getPath("videos"),
              "Tótem Videos",
              totem.nombre,
              moment().format("MMMM")
            )
          )
        ) {
          fs.mkdirSync(
            path.join(
              app.getPath("videos"),
              "Tótem Videos",
              totem.nombre,
              moment().format("MMMM")
            ),
            { recursive: true }
          );
        }
        fs.writeFile(
          path.join(
            app.getPath("videos"),
            "Tótem Videos",
            totem.nombre,
            moment().format("MMMM"),
            `${moment().format("Y-MM-DD HH[-]mm[-]ss")}.mp4`
          ),
          buffer,
          {},
          // eslint-disable-next-line no-unused-vars
          (err, res) => {
            if (err) return console.error(err);
          }
        );
      };
      reader.onerror = (err) => console.error(err);
      reader.readAsArrayBuffer(blob);
    },
    stopRecord() {
      try {
        this.recorder.stop();
        this.recorder = null;
      } catch (error) {
        if (error.message.includes("'stop'")) {
          console.log(
            "No se puede Grabar un video si no se ha iniciado la llamada"
          );
        }
      }
    },
    reloadTotem(totem) {
      this.stopRecord();
      ipcRenderer.send("reload-totem", totem);
    },
    setVolume(totem) {
      ipcRenderer.send("set-volume", totem);
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

#totem-cam,
#img_no_streaming {
  width: 450px;
  height: 225px;
  object-fit: fill;
}

$width_cam: 450px;
$height_cam: 225px;

.cam_preview {
  width: $width_cam;
  height: $height_cam;
  & #webcam.top {
    transform: rotate(360deg);
    width: $width_cam;
    height: $height_cam;

    object-fit: fill;
  }
  & #webcam.right {
    width: $height_cam;
    height: $width_cam;

    transform: rotate(90deg);

    transform-origin: bottom left;

    margin-top: -100vw;
    object-fit: fill;
  }
  & #webcam.bottom {
    transform: rotate(180deg);
    width: $width_cam;
    height: $height_cam;
  }

  & #webcam.left {
    transform: rotate(270deg);
    width: $height_cam;
    height: $width_cam;

    transform-origin: bottom right;

    margin-top: -100vw;
    margin-left: 25%;

    object-fit: fill;
  }
}

#screen {
  display: none;
}
</style>
