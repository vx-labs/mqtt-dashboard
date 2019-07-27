<template>
  <v-app>
    <v-toolbar>
      <v-toolbar-title class="headline text-uppercase">
        <span>MQTT</span>
        <span class="font-weight-light">DASHBOARD</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <settings></settings>
      <subscriptions></subscriptions>
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
export default {
  name: "App",
  components: {
    settings,
    subscriptions,
  }
};
</script>
