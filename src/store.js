import Vue from 'vue';
import Vuex from 'vuex';
import { connect } from 'mqtt';

Vue.use(Vuex);

function persist(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function load(key, cb) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    cb(data);
  } catch {
    localStorage.removeItem(key);
  }
}
function persistCredentials(credentials) {
  persist('state_mqtt_credentials', credentials);
}
function loadCredentials(store) {
  load('state_mqtt_credentials', credentials => {
    store.commit('set_mqtt_credentials', credentials);
  });
}
function persistBroker(credentials) {
  persist('state_mqtt_broker', credentials);
}
function isStringSet(value) {
  return value !== undefined && value !== null && value.length > 0;
}
function loadBroker(store) {
  load('state_mqtt_broker', broker => {
    store.commit('set_mqtt_broker', broker);
  });
}

const store = new Vuex.Store({
  state: {
    ui: {
      selectedSession: undefined,
    },
    connection: {
      online: false,
      pending: false,
      error: undefined,
      credentials: {
        username: undefined,
        password: undefined,
      },
      broker: undefined,
      session: undefined,
    },
    sessions: [],
    subscriptions: [],
    peers: [],
  },
  mutations: {
    reset_state(state) {
      state.sessions = [];
      state.subscriptions = [];
      state.peers = [];
    },
    reset_peers(state) {
      state.peers = [];
    },
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
      persistBroker(broker);
    },
    set_mqtt_connection_error(state, err) {
      state.connection.error = err;
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
      Vue.set(state.sessions, existing, session);
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
    async MQTTStop({ commit, state }) {
      if (state.connection.session !== undefined) {
        await new Promise(resolve => {
          state.connection.session.end(false, resolve);
          commit('set_mqtt_connection_offline');
          commit('set_mqtt_connection_error', '');
          commit('reset_state');
          commit('set_mqtt_session', undefined);
        });
      }
    },
    async MQTTConnect({ state, commit }) {
      if (state.connection.session !== undefined) {
        await new Promise(resolve => {
          state.connection.session.end(false, resolve);
        });
      }
      if (
        !isStringSet(state.connection.broker)
      ) {
        return;
      }
      const mqttSession = connect(
        state.connection.broker,
        state.connection.credentials,
      );
      commit('set_mqtt_connection_pending');
      commit('reset_state');
      mqttSession.on('end', function() {
        commit('set_mqtt_connection_offline');
        commit('set_mqtt_connection_error', '');
        commit('reset_state');
        commit('set_mqtt_session', undefined);
      });
      mqttSession.on('error', function(err) {
        console.log(`MQTT session encountered an error: ${err}`);
        commit('set_mqtt_connection_error', err.code);
      });
      mqttSession.on('reconnect', function() {
        commit('set_mqtt_connection_pending');
        commit('reset_state');
      });
      mqttSession.on('connect', function() {
        commit('set_mqtt_connection_error', '');
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
              console.log(`failed to parse payload: ${err}`);
              console.log(`payload was: ${payload}`);
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
              console.log(`failed to parse payload: ${err}`);
              console.log(`payload was: ${payload}`);
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
              console.log(`failed to parse payload: ${err}`);
              console.log(`payload was: ${payload}`);
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
    mqtt_error: state => {
      const err = state.connection.error;
      if (err === undefined || err === '') {
        return undefined;
      }
      return {
        '4': 'Connection Refused, bad user name or password',
      }[err];
    },
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
    sessionsByPeer: state => id =>
      state.sessions.filter(elt => id !== undefined && elt.Peer === id),
  },
});
loadCredentials(store);
loadBroker(store);
store.dispatch('MQTTConnect');
export default store;
