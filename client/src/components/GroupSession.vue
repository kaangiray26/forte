<template>
    <div id="groupSessionModal" class="modal" role="dialog" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content theme-bg theme-border">
                <div class="modal-header d-flex flex-column border-bottom-0 pb-0">
                    <button class="btn-close theme-filter" type="button" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    <h2 class="modal-title theme-color fw-bold">Group Session</h2>
                    <span class="text-muted">Connect to another user to start a group session.</span>
                </div>
                <div class="modal-body pt-0">
                    <hr>
                    <div v-show="store.peer_status != 'connected'" class="input-group mb-2">
                        <form class="form-floating">
                            <input type="text" class="form-control search-card-input" id="floatingInputValue"
                                :value="peer_id" readonly>
                            <label for="floatingInputValue" class="theme-label theme-color">My PeerID</label>
                        </form>
                        <button class="btn theme-btn black-on-hover text-white fw-bold" @click="copyPeerID">Copy</button>
                    </div>
                    <div class="input-group mb-2" v-show="store.peer_status.startsWith('disconnected')">
                        <input ref="recipient_id" type="text" class="form-control search-card-input" placeholder="PeerID"
                            aria-label="Username" aria-describedby="basic-addon1">
                        <button v-show="store.peer_status == 'disconnected'"
                            class="btn theme-btn black-on-hover text-white fw-bold"
                            @click="createConnection">Connect</button>
                        <button v-show="store.peer_status == 'disconnected.connecting'"
                            class="btn theme-btn black-on-hover text-white fw-bold" @click="stopConnection">Stop</button>
                    </div>
                    <PeerJS ref="thisPeerJS" v-if="peerInit" :key="peer_key" :peer="peer" :conn="conn" :peer_id="peer_id"
                        @show="_show" @disconnected="disconnect" @reaction="showReaction" @message="showMessage">
                    </PeerJS>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { store } from "/js/store.js";
import { Modal } from 'bootstrap';
import { Peer } from "peerjs";
import PeerJS from "./PeerJS.vue";
import { group_key } from "/js/events.js";

const emit = defineEmits(['reaction', 'message']);

const modal = ref(null);

const peer = ref(null);
const conn = ref(null);

let thisPeerJS = ref(null);
const peerInit = ref(false);

const peer_id = ref(null);
const recipient_id = ref(null);

const peer_key = ref(0);

async function createConnection() {
    let id = recipient_id.value.value;
    if (!id.length) {
        return;
    }

    store.peer_status = 'disconnected.connecting';

    conn.value = peer.value.connect(id);
    peerInit.value = true;

    conn.value.on("open", () => {
        conn.value.send({
            type: 'connect',
            peer_id: peer_id.value,
            username: JSON.parse(localStorage.getItem('username')),
        });
    });
}

async function createConnectionWithStoredID(stored_id) {
    store.peer_status = 'disconnected.connecting';

    conn.value = peer.value.connect(stored_id);
    peerInit.value = true;

    conn.value.on("open", () => {
        conn.value.send({
            type: 'connect',
            peer_id: peer_id.value,
            username: JSON.parse(localStorage.getItem('username')),
        });
    });
}

async function disconnect() {
    _hide();
    group_key();
}

async function stopConnection() {
    store.peer_status = 'disconnected';
}

async function showReaction(event) {
    emit('reaction', event);
}

async function showMessage(event) {
    emit('message', event);
}

async function _show() {
    modal.value.show();
}

async function _hide() {
    modal.value.hide();
}

async function _toggle() {
    modal.value.toggle();
}

async function _peer_event(obj) {
    thisPeerJS.value.peer_event(obj);
}

async function copyPeerID() {
    navigator.clipboard.writeText('https://forte.buzl.uk/groupsession/' + peer_id.value);
}

defineExpose({
    show: _show,
    hide: _hide,
    toggle: _toggle,
    peer_event: _peer_event,
});

onMounted(() => {
    modal.value = new Modal(document.querySelector('#groupSessionModal'));
    peer.value = new Peer();

    peer.value.on('open', id => {
        peer_id.value = id;
        store.queue_index = 0;
        store.group_queue = [];
        store.func_stack = [];

        // Group session
        let group_session_id = JSON.parse(localStorage.getItem('group_session_id'));
        if (group_session_id) {
            createConnectionWithStoredID(group_session_id);
            localStorage.removeItem('group_session_id');
        }
    });

    peer.value.on('connection', connection => {
        conn.value = connection;
        peerInit.value = true;
    });
})
</script>