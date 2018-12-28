<template>
  <v-data-table :headers="headers" :items="sessions" class="elevation-1">
    <template slot="items" slot-scope="props">
      <td>{{ formatID(props.item.ID) }}</td>
      <td>{{ props.item.Tenant }}</td>
      <td>{{ props.item.ClientID }}</td>
      <td>{{ getTimeFromNow(props.item.Created) }}</td>
      <td>{{ props.item.RemoteAddress }}</td>
      <td>{{ props.item.Transport }}</td>
      <td>{{ sessionsSubscriptionsCount(props.item.ID) }}</td>
      <td v-if="hasWill(props.item)">{{ props.item.WillTopic }} ← {{ props.item.WillPayload }}</td>
      <td v-else>
        <i>N/A</i>
      </td>
      <td>
        <v-tooltip bottom>
          <v-btn slot="activator" icon @click="showSubscriptions(props.item.ID)">
            <v-icon>share</v-icon>
          </v-btn>
          <span>Show subscriptions</span>
        </v-tooltip>
      </td>
    </template>
  </v-data-table>
</template>
<script lang="ts">
import Vue from "vue";
import moment from "moment";
export default Vue.extend({
  props: ["sessions"],
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
        { text: "Tenant", value: "tenant" },
        { text: "Client ID", value: "clientId" },
        { text: "Uptime", value: "uptime" },
        { text: "Remote Address", value: "remote_addr" },
        { text: "Transport", value: "transport" },
        { text: "Subscriptions", value: "subscriptions" },
        { text: "LWT", value: "lwt" },
        { text: "Actions", value: "actions" }
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
    formatID(id) {
      return id.slice(0, 8);
    },
    hasWill(session) {
      return session.WillTopic && session.WillTopic.length > 0;
    },
    sessionsSubscriptionsCount(id) {
      return this.$store.getters.subscriptionsBySession(id).length;
    },
    getTimeFromNow(created) {
      return moment.unix(created).from(this.currentTime);
    },
    refreshTime() {
      this.currentTime = moment();
    },
    showSubscriptions(id) {
      this.$store.dispatch("SelectSession", id);
    }
  }
});
</script>
