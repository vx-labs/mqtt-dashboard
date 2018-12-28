<template>
  <v-data-table :headers="headers" :items="peers" class="elevation-1">
    <template slot="items" slot-scope="props">
      <td>{{ formatID(props.item.ID) }}</td>
      <td>{{ props.item.MeshID }}</td>
      <td>{{ props.item.Hostname }}</td>
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
        { text: "Hostname", value: "hostname" }
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
