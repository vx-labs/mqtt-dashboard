<template>
  <v-text-field
    autocomplete="off"
    :loading="working"
    :disabled="working"
    v-model="input"
    append-icon="send"
    @click:append="publish()"
  ></v-text-field>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      input: "",
      working: false
    };
  },
  props: ["publishCmd"],
  methods: {
    async publish() {
      this.working = true;
      await this.publishCmd(this.input);
      this.input = "";
      this.working = false;
    }
  }
});
</script>
