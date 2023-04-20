<template>
    <div ref="offcanvasEl" class="offcanvas offcanvas-bottom border-0 vh-100 vw-100" tabindex="-1" id="offcanvasBottom"
        aria-labelledby="offcanvasBottomLabel" style="z-index: 1046;">
        <div class="offcanvas-header d-flex bg-dark text-white justify-content-end">
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
            <ul class="list-group">
                <li class="list-group-item bg-dark text-light d-flex pe-1">
                    <div class="d-flex justify-content-between w-100">
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">Queue</span>
                        </div>
                        <div>
                            <button class="btn btn-dark theme-btn black-on-hover fw-bold"
                                @click="clear_queue">Clear</button>
                        </div>
                    </div>
                </li>
                <li class="list-group-item theme-list-item foreground-content clickable d-flex p-1"
                    :class="{ 'now-playing': index === store.queue_index }" v-for="(track, index) in queue">
                    <div class="d-flex w-100 justify-content-between" @click="play_queue_track(index)">
                        <div class="d-flex">
                            <div class="d-flex align-items-center">
                                <img :src="get_track_cover(track.cover)" class="track-cover theme-border rounded"
                                    @error="placeholder" />
                            </div>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-link search-link d-flex text-start py-0" :content_id="track.id"
                                    style="display:contents;">
                                    <span class="text-muted me-2">{{ index + 1 }}.</span>
                                    <span class="theme-color text-break">{{ track.title }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex h-100 align-items-center">
                        <button class="btn theme-btn black-on-hover text-white fw-bold action-btn bi bi-x ms-0 m-2"
                            type="button" @click="remove_track(index)"></button>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Offcanvas } from "bootstrap"
import { store } from "/js/store.js"
import { notify, action, refresh_queue } from '/js/events.js';

let offcanvas = null;
const offcanvasEl = ref(null);
const queue = ref(store.queue);

async function placeholder(obj) {
    obj.target.src = "/images/track.svg";
}

// Must be synchronized in groupSession: ok
async function remove_track(index) {
    action({
        func: async function op() {
            ft.removeQueueTrack(index);
        },
        object: [index],
        operation: "removeQueueTrack"
    })
}

function get_track_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/track.svg"
}

function shuffle_arr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

function _show() {
    queue.value = ft.getCurrentQueue();
    offcanvas.show();
}

async function _shuffle() {
    // Disable shuffle in groupSession
    if (ft.inGroupSession()) {
        notify({
            "title": "You can't use shuffle in a group session."
        })
        return;
    }

    if (!store.playing.is_playing) {
        shuffle_arr(store.queue);
        queue.value = store.queue;
        return
    }

    let current_track = store.queue[store.queue_index];
    store.queue.splice(store.queue_index, 1);
    shuffle_arr(store.queue);
    store.queue.unshift(current_track);
    store.queue_index = 0;
    queue.value = store.queue;
}

// Must be synchronized in groupSession: ok
async function clear_queue() {
    action({
        func: async function op() {
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
        },
        object: [null],
        operation: "clearQueue"
    })
}

// Must be synchronized in groupSession: ok
async function play_queue_track(index) {
    action({
        func: async function op() {
            let q = ft.getCurrentQueue();
            store.queue_index = index;
            if (q[store.queue_index].server) {
                ft.load_federated_track(q[store.queue_index]);
                return
            }
            ft.load_track(q[store.queue_index]);
        },
        object: [index],
        operation: "playQueueTrack"
    })
}

defineExpose({
    show: _show,
    shuffle: _shuffle,
})

onMounted(() => {
    offcanvas = new Offcanvas(offcanvasEl.value);
    window.addEventListener('queue', () => {
        queue.value = ft.getCurrentQueue();
    })
})
</script>