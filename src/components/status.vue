<template>
  <div>
    <v-dialog max-width="600">
      <v-btn slot="activator" flat :disabled="pending">{{ status }}</v-btn>
      <v-card>
        <v-card-title>
          <span class="headline">Broker informations</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout column wrap>
              <v-flex>
                <v-text-field readonly prepend-icon="storage" label="MQTT Broker" v-model="broker" required></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    status() {
      if (this.pending) {
        return "Connecting to broker...";
      }
      return this.connected
        ? "Connected to broker"
        : "Disconnected from broker";
    },
    broker() {
      return this.$store.getters.mqtt_broker;
    },
    connected() {
      return this.$store.getters.mqtt_connected;
    },
    pending() {
      return this.$store.getters.mqtt_pending;
    }
  }
});
</script>
