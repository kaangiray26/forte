<template>
    <div ref="offcanvasEl" class="offcanvas offcanvas-bottom border-0 vh-100 vw-100" tabindex="-1" id="offcanvasBottom"
        aria-labelledby="offcanvasBottomLabel" style="z-index: 1046;">
        <div class="offcanvas-header d-flex bg-dark text-white justify-content-end">
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"
                aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
            <ul class="list-group shadow-lg">
                <li class="list-group-item bg-dark text-light d-flex">
                    <div class="d-flex justify-content-between w-100">
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">Queue</span>
                        </div>
                        <div>
                            <button class="btn btn-light fw-bold" @click="clear_queue">Clear</button>
                        </div>
                    </div>
                </li>
                <li class="list-group-item list-group-item-action d-flex justify-content-between"
                    :class="{ 'now-playing': index === store.queue_index }" v-for="(track, index) in queue">
                    <div class="d-flex flex-fill">
                        <div class="ratio-1x1 me-2">
                            <img :src="track.cover" class="placeholder-img" width="56" height="56" />
                        </div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-link search-link" :content_id="track.id" style="display:contents;"
                                @click="play_queue_track(index)">
                                <span class="text-muted me-2">{{ index + 1 }}.</span>{{ track.title }}
                            </button>
                        </div>
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

let offcanvas = null;
const offcanvasEl = ref(null);

const queue = ref(store.queue);

function shuffle_arr(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

function _show() {
    queue.value = store.queue
    offcanvas.show();
}

async function _shuffle() {
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

async function clear_queue() {
    if (!store.playing.is_playing) {
        store.queue = [];
        queue.value = store.queue;
        return
    }

    store.queue = [store.queue[store.queue_index]]
    store.queue_index = 0;
    queue.value = store.queue;
}

async function play_queue_track(index) {
    store.queue_index = index;
    ft.load_track(store.queue[store.queue_index]);
}

defineExpose({
    show: _show,
    shuffle: _shuffle,
})

onMounted(() => {
    offcanvas = new Offcanvas(offcanvasEl.value);
})
</script>