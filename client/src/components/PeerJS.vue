<template>
    <div v-show="store.peer_status == 'connected'">
        <div class="input-group mb-2">
            <span class="input-group-text bg-success theme-border text-white">Connected to:</span>
            <input type="text" class="form-control search-card-input" :value="contacts.recipient.username" readonly>
        </div>
        <div class="d-flex flex-column">
            <button class="btn btn-danger fw-bold" @click="disconnect">Disconnect</button>
        </div>
        <hr />
        <div class="d-flex flex-column mb-2">
            <h5 class="theme-color fw-bold">Reactions</h5>
            <div class="input-group">
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('love')">❤️</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('hand')">🤘</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('eyes')">👀</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('ship')">🚀</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('bomb')">💣</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('puke')">🤮</button>
                <button class="btn theme-btn clickable-opacity theme-border" type="button"
                    @click="send_reaction('shit')">💩</button>
            </div>
        </div>
        <hr />
        <div class="input-group mb-2">
            <input ref="message" type="text" class="form-control search-card-input" placeholder="Send a message..."
                @keyup.enter="sendMessage">
            <button class="btn theme-btn black-on-hover text-white fw-bold" @click="sendMessage">Send</button>
        </div>
    </div>
    <div v-show="alert.show">
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ alert.message }}
            <button type="button" class="btn-close" @click="reset_alert"></button>
        </div>
    </div>
    <div v-show="store.peer_status == 'disconnected.connecting'" class="progress" style="height: 2em">
        <div class="progress-bar bg-success progress-bar-striped progress-bar-animated fw-bold unclickable"
            role="progressbar" aria-label="Animated striped example" aria-valuenow="100" aria-valuemin="0"
            aria-valuemax="100" style="width: 100%">
            Connecting...
        </div>
    </div>
    <div v-show="store.peer_status == 'requesting'">
        <div class="d-flex flex-column card foreground p-3 rounded text-white">
            <div class="d-flex mb-2 ">
                <p class="theme-color">
                    <a class="text-danger fw-bold" :href="recipient_profile">{{ contacts.requester.username }}</a>
                    wants to start a group session with you.
                </p>
            </div>
            <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-danger fw-bold" @click="rejectRequest">Reject</button>
                <button type="button" class="btn btn-success fw-bold" @click="acceptRequest">Accept</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { store } from "/js/store.js";
import { notify, reaction, refresh_queue, notify_message } from "/js/events.js"

const emit = defineEmits(['disconnected', 'show', 'reaction', 'message']);

const message = ref(null);
const status = ref("disconnected");

const peer_id = ref(null);
const recipient_id = ref(null);

const alert = ref({
    show: false,
    message: null,
});

const contacts = ref({
    requester: {},
    recipient: {},
});

const recipient_profile = computed(() => {
    return 'https://forte.buzl.uk/user/' + contacts.value.requester.username;
});

async function reset_alert() {
    alert.value = {
        show: false,
        message: null,
    };
}

function cleanup() {
    contacts.value.requester = {};
    contacts.value.recipient = {};
    store.peer_status = 'disconnected';
    emit('disconnected');
}

async function alert_notify(msg) {
    alert.value = {
        show: true,
        message: msg,
    };
}

async function sendMessage() {
    let msg = message.value.value;
    if (!msg.length) {
        return;
    }

    props.conn.send({
        type: 'message',
        message: msg,
    });
    message.value.value = '';
}

async function acceptRequest() {
    setRecipient();
    props.conn.send({
        type: 'accept',
        peer_id: props.peer_id,
        username: JSON.parse(localStorage.getItem('username')),
    });
    contacts.value.requester = {};
    store.peer_status = 'connected';
    ft.reset();
}

async function rejectRequest() {
    props.conn.send({
        type: 'reject',
        peer_id: props.peer_id,
        username: JSON.parse(localStorage.getItem('username')),
    });
    cleanup();
    emit('reset');
}

async function disconnect() {
    props.conn.send({
        type: 'disconnect',
        peer_id: peer_id.value,
        username: JSON.parse(localStorage.getItem('username')),
    });
    cleanup();
}

function setRecipient() {
    contacts.value.recipient = contacts.value.requester;
}

function ack() {
    props.conn.send({
        type: 'ack'
    });
}

async function peer_event(obj) {
    props.conn.send(obj);
}

async function send_reaction(event) {
    notify({
        "title": 'Reaction sent.'
    });
    props.conn.send({
        type: 'reaction',
        event: event,
    });
}

async function runFunc() {
    ack();
    let func = store.func_stack.pop();
    func();
}

props.conn.on("data", async function (data) {
    if (data.type == 'ack') {
        let func = store.func_stack.pop();
        func();
        return;
    }

    if (data.type == 'execute') {
        switch (data.operation) {
            // Player operations
            case 'play':
                store.func_stack.push(async function op() {
                    ft.play();
                });
                break;

            case 'playPrevious':
                store.func_stack.push(async function op() {
                    ft.play_previous();
                });
                break;

            case 'playNext':
                store.func_stack.push(async function op() {
                    ft.play_next();
                });
                break;

            case 'seek':
                store.func_stack.push(async function op() {
                    ft.seek(data.object);
                });
                break;

            case 'repeat':
                store.func_stack.push(async function op() {
                    ft.repeat();
                });
                break;

            // Queue operations
            case 'clearQueue':
                store.func_stack.push(async function op() {
                    if (!store.playing.is_playing) {
                        ft.setCurrentQueue([]);
                        refresh_queue();
                        return
                    }

                    let q = ft.getCurrentQueue();
                    q = [q[store.queue_index]];
                    store.queue_index = 0;
                    ft.setCurrentQueue(q);
                    refresh_queue();
                });
                break;

            case 'playQueueTrack':
                store.func_stack.push(async function op() {
                    let q = ft.getCurrentQueue();
                    store.queue_index = data.object;
                    if (q[store.queue_index].server) {
                        ft.load_federated_track(q[store.queue_index]);
                        return
                    }
                    ft.load_track(q[store.queue_index]);
                })
                break;

            case 'addTrackToQueue':
                store.func_stack.push(async function op() {
                    ft.queueTrack(...data.object).then(() => {
                        notify({
                            "title": "Added to the queue."
                        })
                    })
                })
                break;

            case 'addAlbumToQueue':
                store.func_stack.push(async function op() {
                    ft.queueAlbum(...data.object).then(() => {
                        notify({
                            "title": "Added to the queue."
                        })
                    })
                })
                break;

            case 'addPlaylistToQueue':
                store.func_stack.push(async function op() {
                    ft.queuePlaylist(...data.object).then(() => {
                        notify({
                            "title": "Added to the queue."
                        })
                    })
                })
                break;

            case 'removeQueueTrack':
                store.func_stack.push(async function op() {
                    ft.removeQueueTrack(...data.object);
                })
                break;

            // Play operations
            case 'playTrack':
                store.func_stack.push(async function op() {
                    ft.playTrack(...data.object)
                });
                break;

            case 'playAlbum':
                store.func_stack.push(async function op() {
                    ft.playAlbum(...data.object)
                });
                break;

            case 'playPlaylist':
                store.func_stack.push(async function op() {
                    ft.playPlaylist(...data.object)
                });
                break;

            case 'playTrackNext':
                store.func_stack.push(async function op() {
                    ft.playTrackNext(...data.object);
                });
                break;

            case 'playAlbumNext':
                store.func_stack.push(async function op() {
                    ft.playAlbumNext(...data.object);
                });
                break;

            case 'playPlaylistNext':
                store.func_stack.push(async function op() {
                    ft.playPlaylistNext(...data.object);
                });
                break;

            default:
                return;
        }
        runFunc();
        return;
    }

    if (data.type == 'message') {
        notify_message({
            "username": contacts.value.recipient.username,
            "message": data.message
        })
        return;
    }

    if (data.type == 'reaction') {
        reaction(data.event);
        return;
    }

    if (data.type == 'connect') {
        contacts.value.requester = {
            peer_id: data.peer_id,
            username: data.username
        };
        store.peer_status = 'requesting';
        emit('show');
        return;
    }

    if (data.type == 'disconnect') {
        cleanup();
        return;
    }

    if (data.type == 'accept') {
        contacts.value.recipient = {
            peer_id: data.peer_id,
            username: data.username
        };
        store.peer_status = 'connected';
        ft.reset();
        emit('show');
        return;
    }

    if (data.type == 'reject') {
        store.peer_status = 'disconnected';
        alert_notify(data.username + ' rejected your request.');
        cleanup();
        emit('reset');
        return;
    }
});

const props = defineProps({
    peer: {
        type: Object,
    },
    conn: {
        type: Object,
    },
    peer_id: {
        type: String,
    },
});

defineExpose({
    status,
    peer_id,
    recipient_id,
    peer_event,
});

onMounted(() => {
    window.addEventListener('peer', event => {
        peer_event(event.detail);
    });
})
</script>