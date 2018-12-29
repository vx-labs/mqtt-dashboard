import Vue from 'vue';
import Vuex from 'vuex';
import { connect } from 'mqtt';

Vue.use(Vuex);

function persistCredentials(credentials) {
  localStorage.setItem('state_mqtt_credentials', JSON.stringify(credentials));
}
function loadCredentials(store) {
  try {
    const credentials = JSON.parse(
      localStorage.getItem('state_mqtt_credentials'),
    );
    store.commit('set_mqtt_credentials', credentials);
    store.dispatch('MQTTConnect');
  } catch {
    localStorage.removeItem('set_mqtt_credentials');
  }
}

const store = new Vuex.Store({
  state: {
    ui: {
      selectedSession: undefined,
    },
    connection: {
      online: false,
      pending: false,
      credentials: {
        username: undefined,
        password: undefined,
      },
      broker: 'wss://broker.iot.cloud.vx-labs.net:443/mqtt',
      session: undefined,
    },
    sessions: [],
    subscriptions: [],
    peers: [],
  },
  mutations: {
    reset_sessions(state) {
      state.sessions = [];
    },
    reset_subscriptions(state) {
      state.subscriptions = [];
    },
    select_session(state, sessionID) {
      state.ui.selectedSession = sessionID;
    },
    unselect_session(state) {
      state.ui.selectedSession = undefined;
    },
    set_mqtt_session(state, session) {
      state.connection.session = session;
    },
    set_mqtt_broker(state, broker) {
      state.connection.broker = broker;
    },
    set_mqtt_credentials(state, { username, password }) {
      state.connection.credentials.username = username;
      state.connection.credentials.password = password;
      persistCredentials(state.connection.credentials);
    },
    set_mqtt_connection_pending(state) {
      state.connection.pending = true;
    },
    set_mqtt_connection_online(state) {
      state.connection.online = true;
      state.connection.pending = false;
    },
    set_mqtt_connection_offline(state) {
      state.connection.online = false;
      state.connection.pending = false;
    },
    create_peer(state, peer) {
      const existing = state.peers.findIndex(s => s.ID === peer.ID);
      if (existing === -1) {
        state.peers.push(peer);
        return;
      }
      Vue.set(state.peers, existing, peer);
    },
    delete_peer(state, peer) {
      const existing = state.peers.findIndex(s => s.ID === peer);
      if (existing === -1) {
        return;
      }
      state.peers = state.peers.filter(s => s.ID !== peer);
    },
    create_session(state, session) {
      const existing = state.sessions.findIndex(s => s.ID === session.ID);
      if (existing === -1) {
        state.sessions.push(session);
        return;
      }
      Vue.set(state.sessions, existing,  session);
    },
    delete_session(state, session) {
      const existing = state.sessions.findIndex(s => s.ID === session);
      if (existing === -1) {
        return;
      }
      state.sessions = state.sessions.filter(s => s.ID !== session);
    },
    create_subscription(state, subscription) {
      const existing = state.subscriptions.findIndex(
        s => s.ID === subscription.ID,
      );
      if (existing === -1) {
        state.subscriptions.push(subscription);
        return;
      }
      Vue.set(state.subscriptions, existing, subscription);
    },
    delete_subscription(state, subscription) {
      const existing = state.subscriptions.findIndex(
        s => s.ID === subscription,
      );
      if (existing === -1) {
        return;
      }
      state.subscriptions = state.subscriptions.filter(
        s => s.ID !== subscription,
      );
    },
  },
  actions: {
    async SetMQTTCredentials({ commit }, { username, password }) {
      commit('set_mqtt_credentials', { username, password });
    },
    async SetMQTTBroker({ commit }, broker) {
      commit('set_mqtt_broker', broker);
    },
    PublishCommand({ state }, { topic, payload }) {
      return new Promise((resolve, reject) => {
        if (state.connection.session === undefined) {
          reject('client not connected');
        }
        const session = state.connection.session;
        session.publish(
          topic,
          payload,
          {
            qos: 1,
          },
          () => {
            resolve();
          },
        );
      });
    },
    SelectSession({ commit }, sessionID) {
      commit('select_session', sessionID);
    },
    UnselectSession({ commit }) {
      commit('unselect_session');
    },
    async MQTTConnect({ state, commit }) {
      if (state.connection.session !== undefined) {
        await new Promise(resolve => {
          state.connection.session.end(false, resolve);
        });
      }
      const mqttSession = connect(
        state.connection.broker,
        state.connection.credentials,
      );
      commit('set_mqtt_connection_pending');
      commit('reset_sessions');
      commit('reset_subscriptions');
      mqttSession.on('error', function(err) {
        console.log('error', err);
      });
      mqttSession.on('reconnect', function() {
        commit('set_mqtt_connection_pending');
      });
      mqttSession.on('connect', function() {
        commit('set_mqtt_connection_online');
      });
      mqttSession.on('offline', function() {
        commit('set_mqtt_connection_offline');
      });
      mqttSession.on('message', (topic, payload) => {
        const sessionPrefix = '$SYS/sessions/';
        const subscriptionPrefix = '$SYS/subscriptions/';
        const peersPrefix = '$SYS/peers/';
        if (topic.startsWith(sessionPrefix)) {
          if (payload.length > 0) {
            try {
              const session = JSON.parse(payload);
              session.ClientID = atob(session.ClientID);
              if (
                session.WillTopic !== undefined &&
                session.WillTopic.length > 0
              ) {
                session.WillTopic = atob(session.WillTopic);
              }
              if (
                session.WillPayload !== undefined &&
                session.WillPayload.length > 0
              ) {
                session.WillPayload = atob(session.WillPayload);
              }
              commit('create_session', session);
            } catch (err) {
              console.log(`failed to parse payload: ${payload}`);
            }
          } else {
            const id = topic.slice(sessionPrefix.length);
            commit('delete_session', id);
          }
        } else if (topic.startsWith(subscriptionPrefix)) {
          if (payload.length > 0) {
            try {
              const subscription = JSON.parse(payload);
              subscription.Pattern = atob(subscription.Pattern);
              commit('create_subscription', subscription);
            } catch (err) {
              console.log(`failed to parse payload: ${payload}`);
            }
          } else {
            const id = topic.slice(subscriptionPrefix.length);
            commit('delete_subscription', id);
          }
        } else if (topic.startsWith(peersPrefix)) {
          if (payload.length > 0) {
            try {
              const peer = JSON.parse(payload);
              commit('create_peer', peer);
            } catch (err) {
              console.log(`failed to parse payload: ${payload}`);
            }
          } else {
            const id = topic.slice(subscriptionPrefix.length);
            commit('delete_peer', id);
          }
        }
      });
      mqttSession.subscribe('$SYS/sessions/+', { qos: 1 });
      mqttSession.subscribe('$SYS/subscriptions/+', { qos: 1 });
      mqttSession.subscribe('$SYS/peers/+', { qos: 1 });
      commit('set_mqtt_session', mqttSession);
    },
  },
  getters: {
    mqtt_connected: state => state.connection.online,
    mqtt_pending: state => state.connection.pending,
    selectedSession: state => state.ui.selectedSession,
    mqtt_broker: state => state.connection.broker,
    mqtt_username: state => state.connection.credentials.username,
    mqtt_password: state => state.connection.credentials.password,
    sessions: state => {
      return state.sessions.sort((a, b) => {
        if (a.Created > b.Created) {
          return -1;
        } else if (a.Created < b.Created) {
          return 1;
        } else {
          return 0;
        }
      });
    },
    peers: state => {
      return state.peers.sort();
    },
    subscriptions: state => state.subscriptions,
    subscriptionsBySession: state => id =>
      state.subscriptions.filter(
        elt => id !== undefined && elt.SessionID === id,
      ),
  },
});
loadCredentials(store);
export default store;
