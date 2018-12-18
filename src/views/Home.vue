<template>
  <v-container fluid grid-list-md>
    <v-layout row wrap>
      <v-flex>
      <sessions :sessions="sessions"/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import sessions from "@/components/sessions.vue";
import { mapGetters } from "vuex";

export default Vue.extend({
  components: {
    sessions
  },
  computed: {
    ...mapGetters(["sessions"])
  }
});
</script>
