<template>
  <v-dialog v-model="display" persistent max-width="1200">
    <v-card>
      <v-card-title>
        <span class="headline">Subscriptions</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="settings_form">
          <v-container grid-list-md>
            <v-data-table :headers="headers" :items="subscriptions" class="elevation-1">
              <template slot="items" slot-scope="props">
                <td>{{ props.item.Pattern }}</td>
                <td class="text-xs-center">{{ props.item.Qos || 0 }}</td>
                <td class="text-xs-right">
                  <publish
                    v-if="props.item.Pattern.indexOf('+') == -1"
                    :publishCmd="(data) => { return publish(props.item.Pattern, data)}"
                  ></publish>
                </td>
              </template>
            </v-data-table>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import publish from "@/components/publish.vue";
export default Vue.extend({
  components: {
    publish
  },
  data() {
    return {
      showPassword: false,
      headers: [
        { text: "Pattern", value: "pattern", align: "left" },
        { text: "QoS", value: "qos", align: "center" },
        { text: "Publish", value: "publish", align: "right" }
      ]
    };
  },
  computed: {
    subscriptions() {
      return this.$store.getters.subscriptionsBySession(
        this.$store.getters.selectedSession
      );
    },
    display() {
      return this.$store.getters.selectedSession !== undefined;
    }
  },
  methods: {
    publish(topic, payload) {
      return this.$store.dispatch('PublishCommand', {topic, payload});
    },
    close() {
      this.$store.dispatch("UnselectSession");
    }
  }
});
</script>
