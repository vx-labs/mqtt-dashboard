<template>
  <div>
    <v-layout>
      <v-flex>
        <v-btn icon @click="open">
          <v-icon>settings</v-icon>
        </v-btn>
        <v-dialog v-model="display" persistent max-width="600">
          <v-card>
            <v-card-title>
              <span class="headline">Settings</span>
            </v-card-title>
            <v-card-text>
              <v-form ref="settings_form">
                <v-container grid-list-md>
                  <v-layout column wrap>
                    <v-flex>
                      <v-text-field
                        prepend-icon="storage"
                        label="MQTT Broker"
                        v-model="broker"
                        required
                      ></v-text-field>
                    </v-flex>
                  </v-layout>
                  <v-layout>
                    <v-flex>
                      <v-text-field
                        prepend-icon="perm_identity"
                        label="MQTT Username"
                        v-model="username"
                        required
                      ></v-text-field>
                    </v-flex>
                    <v-flex>
                      <v-text-field
                        prepend-icon="vpn_key"
                        label="MQTT Password"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        :append-icon="showPassword ? 'visibility_off' : 'visibility'"
                        @click:append="showPassword = !showPassword"
                        required
                      ></v-text-field>
                    </v-flex>
                  </v-layout>
                </v-container>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn :disabled="working" :loading="working" flat @click="save">Save</v-btn>
              <v-btn :disabled="working" flat @click="close">Cancel</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-flex>
    </v-layout>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      display: false,
      working: false,
      showPassword: false,
      broker: "",
      username: "",
      password: ""
    };
  },
  methods: {
    async save() {
      if (this.$refs.settings_form.validate()) {
        this.working = true;
        let mustReconnect = false;
        if (
          this.username !== this.$store.getters.mqtt_username ||
          this.password !== this.$store.getters.mqtt_username
        ) {
          mustReconnect = true;
          await this.$store.dispatch("SetMQTTCredentials", {
            username: this.username,
            password: this.password
          });
        }
        if (this.broker !== this.$store.getters.mqtt_broker) {
          mustReconnect = true;
          await this.$store.dispatch("SetMQTTBroker", this.broker);
        }
        if (mustReconnect) {
          this.$store.dispatch('MQTTConnect');
        }
        this.working = false;
        this.close();
      }
    },
    close() {
      this.display = false;
    },
    open() {
      this.broker = this.$store.getters.mqtt_broker;
      this.username = this.$store.getters.mqtt_username;
      this.password = this.$store.getters.mqtt_password;
      this.display = true;
    }
  }
});
</script>
