<template>
  <v-dialog v-model="display" persistent max-width="600">
    <v-card>
      <v-card-title>
        <span class="headline">Reconnecting to broker</span>
      </v-card-title>
      <v-card-text>
        MQTT Connection was lost: {{ error }}
        <br>Attempting to reconnect.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="abort">Abort reconnection</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    display() {
      return this.error  !== undefined && this.error !== '';
    },
    error() {
      return this.$store.getters.mqtt_error;
    }
  },
  methods: {
    async abort() {
      return this.$store.dispatch("MQTTStop");
    }
  }
});
</script>
