<template>
  <v-data-table :headers="headers" :items="peers" class="elevation-1">
    <template slot="items" slot-scope="props">
      <td>{{ formatID(props.item.ID) }}</td>
      <td>{{ props.item.MeshID }}</td>
      <td>{{ props.item.Hostname }}</td>
      <td>{{ props.item.Services.join(', ') }}</td>
      <td>{{ props.item.ComputeUsage.Goroutines }}</td>
      <td>{{ Math.round(props.item.MemoryUsage.Sys / 1024 / 1024) }} Mo</td>
      <td>{{ props.item.MemoryUsage.NumGC }}</td>
      </template>
  </v-data-table>
</template>
<script lang="ts">
import Vue from "vue";
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
        { text: "Services", value: "services" },
        { text: "Goroutines", value: "goroutines" },
        { text: "Memory Usage", value: "memusage" },
        { text: "GC count", value: "numGc" },
      ]
    };
  },
  methods: {
    formatID(id) {
      return id.slice(0, 8);
    }
  }
});
</script>
