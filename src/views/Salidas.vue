<template>
  <div class="salidas">
    <div class="is-flex is-justify-content-center">
      <b-button
        @click="agregarTotem()"
        icon-left="plus-circle"
        type="is-success"
        >Agregar Tótem</b-button
      >
    </div>
    <div class="my-5 mx-6 px-6">
      <b-collapse
        v-for="(totem, index) in totems"
        :key="totem.id"
        class="card"
        animation="slide"
        :open="isOpen == index"
        @open="isOpen = index"
      >
        <template #trigger="props">
          <div class="p-4">
            <b-tag type="is-primary" size="is-large">
              <span v-if="totem.nombre">{{ totem.nombre }}</span>
              <span v-else>{{ totem.ip }}</span>
            </b-tag>
            <b-icon :icon="props.open ? 'sort-up' : 'sort-down'"></b-icon>
          </div>
        </template>
        <div class="is-flex is-justify-content-space-between px-3 mx-2 mb-2">
          <div class="">
            <b-button
              type="is-success"
              size="is-small"
              class="ml-3"
              icon-right="plus"
              @click="agregarSalida(totem)"
              >Agregar Salida</b-button
            >
          </div>
          <div>
            <b-button
              @click="eliminarTotem(index, totem)"
              type="is-danger"
              size="is-small"
              icon-right="trash"
              class="mr-2"
              >Eliminar Tótem</b-button
            >
            <b-button
              @click="actualizarTotem(index, totem)"
              type="is-info"
              size="is-small"
              icon-right="edit"
              >Actualizar Tótem</b-button
            >
          </div>
        </div>
        <div class="mx-5 px-5 mb-3">
          <b-field label-position="on-border" label="IP del Tótem">
            <b-input v-model="totem.ip" size="is-small"></b-input>
          </b-field>
          <b-field label-position="on-border" label="Nombre del Tótem">
            <b-input v-model="totem.nombre" size="is-small"></b-input>
          </b-field>
        </div>
        <div class="is-flex is-flex-wrap-wrap is-justify-content-space-evenly">
          <div
            v-for="(salida, salida_index) in totem.salidas"
            :key="salida.id"
            class="card my-2 mb-5"
          >
            <div class="card-content">
              <b-field label="Dirección IP" label-position="on-border">
                <b-input v-model="salida.ip" size="is-small"></b-input>
              </b-field>
              <b-field label="Número" label-position="on-border">
                <b-input v-model="salida.numero" size="is-small"></b-input>
              </b-field>
              <b-field label="Nombre" label-position="on-border">
                <b-input v-model="salida.nombre" size="is-small"></b-input>
              </b-field>
              <b-field label="Tiempo">
                <b-switch v-model="salida.tiempo"></b-switch>
                <b-field label="Segundos" v-if="salida.tiempo" label-position="on-border">
                  <b-numberinput v-model="salida.segundos" :controls="false" size="is-small"></b-numberinput>
                </b-field>
              </b-field>
            </div>
            <footer class="card-footer">
              <div class="card-footer-item">
                <b-button
                  @click="eliminarSalida(salida_index, salida, totem)"
                  type="is-danger"
                  size="is-small"
                  icon-right="trash-alt"
                  >Eliminar</b-button
                >
              </div>
              <div class="card-footer-item">
                <b-button
                  :disabled="!salida.ip"
                  @click="probarSalida(salida, 1)"
                  type="is-info"
                  size="is-small"
                  icon-right="check"
                  >Activar</b-button
                >
                <b-button
                  :disabled="!salida.ip"
                  @click="probarSalida(salida, 0)"
                  type="is-warning"
                  size="is-small"
                  icon-right="check"
                  class="mx-1"
                  >Desactivar</b-button
                >
              </div>
            </footer>
          </div>
        </div>
      </b-collapse>
    </div>
  </div>
</template>

<script>
const Store = require("electron-store");

const storage = new Store();

import axios from "axios";
export default {
  data() {
    return {
      totems: [],
      isOpen: 0,
    };
  },
  beforeMount() {
    this.totems = storage.get("totems") ? storage.get("totems") : [];
  },
  methods: {
    agregarTotem() {
      this.$buefy.dialog.prompt({
        message: `Ingrese la IP del Tótem`,
        inputAttrs: {
          placeholder: "e.g. 192.168.1.1",
          maxlength: 15,
        },
        trapFocus: true,
        onConfirm: (value) => {
          this.totems.push({
            ip: value,
            nombre: "",
            salidas: [],
          });
          storage.set("totems", this.totems);
        },
      });
    },
    eliminarTotem(index, totem) {
      this.$buefy.dialog.confirm({
        title: "Eliminando Tótem",
        message: `¿Seguro de Eliminar el tótem '${
          totem.nombre ? totem.nombre : totem.ip
        }'?`,
        type: "is-danger",
        hasIcon: true,
        onConfirm: () => {
          this.totems.splice(index, 1);
          this.actualizarTotem();
        },
      });
    },
    actualizarTotem() {
      this.$buefy.toast.open({
        type: "is-info",
        message: "Configuración actualizada Correctamente!",
        duration: 2000,
        queue: true,
      });
      this.totems.map((t) => {
        t.salidas.map((s) => {
          s.direccion = `http://${s.ip}/k${s.numero}`;
        });
      });
      storage.set("totems", this.totems);
    },
    agregarSalida(totem) {
      totem.salidas.push({
        nombre: "",
        ip: "",
        numero: "",
        direccion: "",
        tiempo: false,
        segundos: 0,
      });
    },
    eliminarSalida(index, salida, totem) {
      this.$buefy.dialog.confirm({
        title: "Eliminando Salida...",
        message: `¿Seguro de Eliminar el la salida '${
          salida.nombre ? salida.nombre : salida.ip
        }' del tótem '${totem.nombre ? totem.nombre : totem.ip}'?`,
        type: "is-danger",
        hasIcon: true,
        onConfirm: () => {
          totem.salidas.splice(index, 1);
          //   this.actualizarTotem();
        },
      });
    },
    probarSalida(salida, accion) {
      axios.get(`${salida.ip}=${accion}`).then((res) => {
        this.$buefy.toast.open({
          position: "is-bottom",
          message: res.data,
          queue: true,
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.salidas {
  user-select: none;
}
</style>