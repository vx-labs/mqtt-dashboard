<template>
  <v-container fluid grid-list-md>
    <v-layout column wrap>
      <v-flex>
        <h3>Sessions</h3>
      </v-flex>
      <v-flex>
      <sessions :sessions="sessions"/>
      </v-flex>
      <v-flex>
        <h3>Peers</h3>
      </v-flex>
      <v-flex>
      <peers/>
      </v-flex>
      <v-flex>
        <h3>Subscriptions</h3>
      </v-flex>
      <v-flex>
      <subscriptions/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import sessions from "@/components/sessions.vue";
import peers from "@/components/peers.vue";
import subscriptions from "@/components/subscriptionList.vue";
import { mapGetters } from "vuex";

export default Vue.extend({
  components: {
    sessions,
    peers,
    subscriptions,
  },
  computed: {
    ...mapGetters(["sessions"])
  }
});
</script>
