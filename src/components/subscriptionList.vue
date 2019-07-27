<template>
  <v-data-table :headers="headers" :items="peers" class="elevation-1">
    <template slot="items" slot-scope="props">
      <td>{{ formatID(props.item.ID) }}</td>
      <td>{{ props.item.Pattern }}</td>
      <td>{{ props.item.SessionID }}</td>
      <td>{{ props.item.Qos }}</td>
    </template>
  </v-data-table>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    peers() {
      return this.$store.getters.subscriptions;
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
        { text: "Pattern", value: "pattern" },
        { text: "SessionID", value: "session_id" },
        { text: "Qos", value: "qos" },
      ]
    };
  },

  methods: {
    formatID(id) {
      return id.slice(0, 8);
    },
  }
});
</script>
