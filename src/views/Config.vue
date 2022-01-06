<template>
  <div class="container">
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
                @change.native="preview_audio()"
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

            <video id="webcam_preview" muted autoplay></video>
            <audio id="audio_preview" autoplay></audio>
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
console.log(storage);
export default {
  data() {
    return {
      webcams: [],
      microphones: [],
      webcam_selected: "",
      microphone_selected: "",
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.webcam_selected = storage.get("webcam_id");
      this.microphone_selected = storage.get("microphone_id");
      this.webcams = [];
      this.microphones = [];
      this.getDevices();
      this.preview_webcam(this.webcam_selected);
      this.preview_audio(this.microphone_selected);
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
          }
        });
    },
  },
};
</script>