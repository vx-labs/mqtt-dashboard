<template>
  <v-data-table :headers="headers" :items="peers" class="elevation-1">
    <template slot="items" slot-scope="props">
      <td>{{ formatID(props.item.ID) }}</td>
      <td>{{ props.item.MeshID }}</td>
      <td>{{ props.item.Hostname }}</td>
      <td>{{ getTimeFromNow(props.item.Started) }}</td>
      <td>{{ props.item.Services.join(', ') }}</td>
      <td>{{ sessions(props.item.MeshID).length }}</td>
      <td>{{ props.item.ComputeUsage.Goroutines }}</td>
      <td>{{ Math.round(props.item.MemoryUsage.Sys / 1024 / 1024) }} Mo</td>
      <td>{{ props.item.MemoryUsage.NumGC }}</td>
    </template>
  </v-data-table>
</template>
<script lang="ts">
import Vue from "vue";
import moment from "moment";
export default Vue.extend({
  computed: {
    peers() {
      return this.$store.getters.peers;
    }
  },
  data() {
    return {
      ticker: null,
      currentTime: null,
      headers: [
        {
          text: "ID",
          sortable: false,
          value: "id"
        },
        { text: "MeshID", value: "mesh_id" },
        { text: "Hostname", value: "hostname" },
        { text: "Uptime", value: "uptime" },
        { text: "Services", value: "services" },
        { text: "Sessions", value: "sessions" },
        { text: "Goroutines", value: "goroutines" },
        { text: "Memory Usage", value: "memusage" },
        { text: "GC count", value: "numGc" }
      ]
    };
  },
  mounted() {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.getTimeFromNow();
    this.ticker = setInterval(this.refreshTime, 1000);
  },
  destroyed() {
    if (this.ticker !== null) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  },
  methods: {
    getTimeFromNow(created) {
      return moment.unix(created).from(this.currentTime);
    },
    refreshTime() {
      this.currentTime = moment();
    },
    formatID(id) {
      return id.slice(0, 8);
    },
    sessions(id) {
      return this.$store.getters.sessionsByPeer(id);
    }
  }
});
</script>
