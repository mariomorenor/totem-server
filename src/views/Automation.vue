<template>
  <div class="salidas">
    <div class="my-5 mx-6 px-6">
      <b-collapse
        v-for="(cliente, index) in clientes"
        :key="cliente.id"
        class="card"
        animation="slide"
        :open="isOpen == index"
        @open="isOpen = index"
      >
        <template #trigger="props">
          <div class="p-4">
            <b-tag type="is-primary" size="is-large">
              <span>{{ cliente.nombre }}</span>
            </b-tag>
            <b-icon :icon="props.open ? 'sort-up' : 'sort-down'"></b-icon>
          </div>
        </template>
        <div>
          <template v-for="salida in cliente.salidas">
            <template v-if="salida.tiempo">
              <b-button
                class="mr-1"
                type="is-info"
                size="is-small"
                @click="activar(salida)"
                :key="salida.id"
                >{{ salida.nombre }}</b-button
              >
            </template>
            <template v-else>
              <b-dropdown :triggers="['hover']" :key="salida.id">
                <template #trigger>
                  <b-button size="is-small" class="mr-1" type="is-info">{{
                    salida.nombre
                  }}</b-button>
                </template>
                <b-dropdown-item @click="activar(salida)"
                  >Activar</b-dropdown-item
                >
                <b-dropdown-item @click="desactivar(salida)"
                  >Desactivar</b-dropdown-item
                >
              </b-dropdown>
            </template>
          </template>
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
      clientes: [],
      isOpen: 0,
    };
  },
  beforeMount() {
    this.clientes = storage.get("clientes") ? storage.get("clientes") : [];
  },
  methods: {
    activar(salida) {
      if (salida.tiempo) {
        axios.get(`${salida.direccion}=1`).then(() => {
          this.$buefy.toast.open({
            position: "is-bottom",
            message: `Se ha abierto el Accesso a ${salida.nombre}`,
            queue: true,
          });
          setTimeout(() => {
            axios.get(`${salida.direccion}=0`).then(() => {
              this.$buefy.toast.open({
                position: "is-bottom",
                message: `Se ha cerrado el Accesso a ${salida.nombre}`,
                queue: true,
              });
            });
          }, salida.segundos * 1000);
        });
      } else {
        axios.get(`${salida.direccion}=1`).then(() => {
          this.$buefy.toast.open({
            position: "is-bottom",
            message: `Se ha abierto el Accesso a ${salida.nombre}`,
            queue: true,
          });
        });
      }
    },
    desactivar(salida) {
      axios.get(`${salida.direccion}=0`).then(() => {
        this.$buefy.toast.open({
          position: "is-bottom",
          message: `Se ha cerrado el Acceso a ${salida.nombre}`,
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