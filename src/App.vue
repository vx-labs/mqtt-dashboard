<template>
  <v-app>
    <v-toolbar>
      <v-toolbar-title class="headline text-uppercase">
        <span>MQTT</span>
        <span class="font-weight-light">DASHBOARD</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <status></status>
      <settings></settings>
      <subscriptions></subscriptions>
      <disconnectedDialog/>
    </v-toolbar>
    <v-content>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-content>
    <v-footer app></v-footer>
  </v-app>
</template>

<script>
import settings from "@/components/settings.vue";
import subscriptions from "@/components/subscriptions.vue";
import status from "@/components/status.vue";
import disconnectedDialog from "@/components/disconnectedDialog.vue";
export default {
  name: "App",
  components: {
    settings,
    subscriptions,
    status,
    disconnectedDialog
  }
};
</script>
