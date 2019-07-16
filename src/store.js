import Vue from 'vue';
import Vuex from 'vuex';
import { connect } from 'mqtt';
import Axios from 'axios';

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
    set_peers(state, peers) {
      state.peers = peers;
    },
    delete_peer(state, peer) {
      const existing = state.peers.findIndex(s => s.ID === peer);
      if (existing === -1) {
        return;
      }
      state.peers = state.peers.filter(s => s.ID !== peer);
    },
    set_sessions(state, sessions) {
      state.sessions = sessions;
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
    async startPoll({ commit }) {
      setInterval(() => {
        Axios.get('https://broker-api.iot.cloud.vx-labs.net/v1/sessions/').then((sessions) => {
          commit('set_sessions', sessions.data
          .map(elt => {
            if (elt.WillPayload !== "") {
              elt.WillPayload = atob(elt.WillPayload)
            }
            if (elt.WillTopic !== "") {
              elt.WillTopic = atob(elt.WillTopic)
            }
            return elt;
          }));
        });
      }, 3000);
      setInterval(() => {
        Axios.get('https://broker-api.iot.cloud.vx-labs.net/v1/peers/').then((peers) => {
          commit('set_peers', peers.data
            .map(elt => {
              if (elt.Services === undefined) {
                elt.Services = [];
              }
              return elt;
            }));
        });
      }, 3000);
    },
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
store.dispatch('startPoll');
export default store;
