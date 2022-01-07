<template>
  <div class="container config">
    <div class="columns">
      <div class="column is-half is-offset-one-quarter">
        <div class="card">
          <div class="card-content">
            <b-field label="Webcam" label-position="on-border">
              <b-select
                @change.native="preview_webcam()"
                required
                v-model="webcam_selected"
                placeholder="Seleccione la webcam"
                rounded
              >
                <template v-if="webcams.length > 0">
                  <option
                    v-for="(webcam, index) in webcams"
                    :value="webcam.deviceId"
                    :key="index"
                  >
                    {{ webcam.label }}
                  </option>
                </template>
                <template v-else>
                  <option value="" disabled>
                    No hay ninguna cámara conectada :'c
                  </option>
                </template>
              </b-select>
            </b-field>
            <b-field label="Micrófono" label-position="on-border">
              <b-select
                required
                v-model="microphone_selected"
                placeholder="Seleccione el micrófono"
                rounded
              >
                <template v-if="microphones.length > 0">
                  <option
                    v-for="microphone in microphones"
                    :value="microphone.deviceId"
                    :key="microphone.id"
                  >
                    {{ microphone.label }}
                  </option>
                </template>

                <template v-else>
                  <option value="" disabled>
                    No hay ningún micrófono conectado :'c
                  </option>
                </template>
              </b-select>
            </b-field>
            <b-tooltip
              v-if="!mic_status"
              position="is-top"
              label="Iniciar prueba de audio"
              type="is-dark"
            >
              <b-button
                type="is-primary"
                @click="preview_audio(), (mic_status = true)"
                size="is-small"
                icon-left="volume-up"
              ></b-button>
            </b-tooltip>
            <b-tooltip
              type="is-dark"
              v-else
              position="is-top"
              label="Detener Prueba de audio"
            >
              <b-button
                type="is-warning"
                @click="stop_preview_audio()"
                size="is-small"
                icon-left="volume-mute"
              ></b-button>
            </b-tooltip>
            <b-tooltip type="is-dark" label="Girar la cámara" position="is-top">
              <b-button
                @click="rotateCam()"
                class="ml-3"
                icon-left="redo"
                type="is-info is-light"
                size="is-small"
              ></b-button>
            </b-tooltip>
            <div class="cam_preview">
              <video
                id="webcam_preview"
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
            <audio id="audio_preview"></audio>
            <b-button @click="saveConfig()" type="is-success">Guardar</b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { BrowserWindow, dialog } = require("@electron/remote");
const Store = require("electron-store");

const storage = new Store();
export default {
  data() {
    return {
      webcams: [],
      microphones: [],
      webcam_selected: "",
      microphone_selected: "",
      mic_status: false,
      cam_orientation: 0,
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.cam_orientation = storage.get("cam_orientation")
        ? storage.get("cam_orientation")
        : 0;
      this.webcam_selected = storage.get("webcam_id");
      this.microphone_selected = storage.get("microphone_id");
      this.webcams = [];
      this.microphones = [];
      this.getDevices();
      this.preview_webcam();
    },
    getDevices() {
      let self = this;
      navigator.mediaDevices.enumerateDevices().then(function (devices) {
        for (var i = 0; i < devices.length; i++) {
          var device = devices[i];
          if (device.kind === "videoinput") {
            self.webcams.push(device);
          }
          if (device.kind === "audioinput") {
            self.microphones.push(device);
          }
        }
      });
    },
    preview_webcam() {
      let self = this;
      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: self.webcam_selected,
          },
        })
        .then((stream) => {
          let video = document.getElementById("webcam_preview");
          video.srcObject = stream;
          video.play();
        });
    },
    preview_audio() {
      let self = this;
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            deviceId: self.microphone_selected,
          },
        })
        .then((stream) => {
          let audio = document.getElementById("audio_preview");
          audio.srcObject = stream;
          audio.play();
        });
    },
    stop_preview_audio() {
      this.mic_status = false;
      let audio = document.getElementById("audio_preview");
      audio.pause();
    },
    saveConfig() {
      dialog
        .showMessageBox(BrowserWindow.getFocusedWindow(), {
          title: "Cambiando Configuración",
          message: "¿Está seguro de cambiar la configuración actual?",
          type: "warning",
          noLink: true,
          buttons: ["Aceptar", "Cancelar"],
        })
        .then((val) => {
          if (val.response == 0) {
            storage.set("webcam_id", this.webcam_selected);
            storage.set("microphone_id", this.microphone_selected);

            storage.set("cam_orientation", this.cam_orientation);
          }
        });
    },
    rotateCam() {
      if (this.cam_orientation > 270) {
        this.cam_orientation = 0;
      }
      this.cam_orientation += 90;
    },
  },
};
</script>

<style lang="scss" scoped>
.config {
  user-select: none;
}

$width_cam: 600px;
$height_cam: 450px;
.cam_preview {
  width: $width_cam;
  height: $height_cam;
  & #webcam_preview.top {
    transform: rotate(360deg);
  }
  & #webcam_preview.right {
    width: $height_cam;
    height: $width_cam;

    transform: rotate(90deg);

    transform-origin: bottom left;

    margin-top: -100vw;
    object-fit: cover;
  }
  & #webcam_preview.bottom {
    transform: rotate(180deg);
  }

  & #webcam_preview.left {
    transform: rotate(270deg);
    width: $height_cam;
    height: $width_cam;

    transform-origin: bottom right;

    margin-top: -100vw;
    margin-left: 25%;

    object-fit: cover;
  }
}
</style>