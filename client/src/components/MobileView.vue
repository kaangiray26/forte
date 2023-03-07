<template>
    <div ref="offcanvasEl" class="offcanvas offcanvas-bottom bg-dark border-0 vh-100 vw-100" tabindex="-1"
        id="offcanvasBottom" aria-labelledby="offcanvasBottomLabel">
        <div class="offcanvas-body">
            <div class="row h-100 justify-content-center align-items-end gx-0">
                <div class="col h-100">
                    <div ref="cardView" class="card h-100">
                        <div>
                            <div class="m-4">
                                <img :src="get_cover(store.playing.cover)"
                                    class="card-img-top image-stable border border-dark rounded">
                            </div>
                            <div class="overflow-hidden text-center clickable mt-0 m-4" @click="openAlbum">
                                <div class="text-wrap">
                                    <h5 class="fw-bold bg-dark text-white rounded p-2 mb-2">{{ store.playing.title }}
                                    </h5>
                                    <button class="btn btn-sm btn-dark fw-bold" @click="emit('quality')">{{
                                        store.playing.quality }}</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body d-flex align-items-end p-2">
                            <div class="d-flex flex-fill flex-column">
                                <div class="d-flex justify-content-center">
                                    <button v-show="store.playing.radio" type="button"
                                        class="btn btn-sm btn-success fw-bold" @click="radio">ON
                                        AIR</button>
                                    <button v-show="!store.playing.radio" type="button"
                                        class="btn btn-sm btn-danger fw-bold" @click="radio">OFF
                                        AIR</button>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <div class="d-flex align-items-center font-monospace theme-color me-2">
                                        <small>{{ formatTime(store.playing.seek) }}</small>
                                    </div>
                                    <div class="d-flex align-items-center font-monospace theme-color me-2">
                                        <small>{{ formatTime(store.playing.duration) }}</small>
                                    </div>
                                </div>
                                <div class="progress mb-4" @click="props.seekProgress($event)">
                                    <div class="progress-bar theme-btn progress-bar-animated" aria-valuenow="0"
                                        aria-valuemin="0" aria-valuemax="100"
                                        :style="{ 'width': store.playing.progress + '%' }">
                                        <span class="visually-hidden"></span>
                                    </div>
                                </div>
                                <!-- First set of buttons -->
                                <div class="btn-group btn-group-sm mb-2" role="group" aria-label="Basic example">
                                    <button type="button" class="btn btn-dark rounded bi bi-skip-start-fill"
                                        @click="play_previous"></button>
                                    <button type="button" class="btn btn-dark rounded bi mx-2" :class="{
                                        'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                                    }" @click="play"></button>
                                    <button type="button" class="btn btn-dark rounded bi bi-skip-end-fill"
                                        @click="play_next"></button>
                                </div>
                                <hr />
                                <!-- Second set of buttons -->
                                <div class="d-flex justify-content-between">
                                    <button type="button" class="btn theme-color border bi bi-shuffle mx-1"
                                        @click="emit('shuffle')" />
                                    <button type="button" class="btn theme-color bi bi-soundwave mx-1"
                                        @click="emit('group_session')" />
                                    <button type="button" class="btn theme-color bi bi-chat-square-text-fill mx-1"
                                        @click="emit('lyrics')" />
                                    <button type="button" class="btn theme-color bi bi-collection-fill mx-1"
                                        @click="emit('queue')" />
                                    <button type="button" class="btn theme-color border bi mx-1" :class="props.repeat_icon"
                                        @click="repeat" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import { Offcanvas } from "bootstrap"
import { store } from "/js/store.js"
import { action } from '/js/events.js';
import Hammer from "hammerjs";

const router = useRouter();

const emit = defineEmits(['queue', 'lyrics', 'shuffle', 'group_session', 'quality']);

let offcanvas = null;
const offcanvasEl = ref(null);
const cardView = ref(null);

async function openAlbum() {
    store.selected_track_id = store.playing.id;
    router.push("/album/" + store.playing.album);
    _hide();
}

function get_cover(cover) {
    if (!cover) {
        return "/images/track.svg"
    }

    if (cover.startsWith("http")) {
        return cover;
    }

    return ft.server + '/' + cover;
}

function _show() {
    offcanvas.show();
}

function _hide() {
    offcanvas.hide();
}

function formatTime(secs) {
    let seconds = parseInt(secs);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

// Must be synchronized in groupSession: ok
async function repeat() {
    action({
        func: async function op() {
            ft.repeat();
        },
        object: null,
        operation: "repeat"
    });
}

async function radio() {
    ft.radio();
}

defineExpose({
    show: _show,
    hide: _hide,
})

const props = defineProps({
    seekProgress: {
        type: Function,
        default: () => { }
    },
    play: {
        type: Function,
        default: () => { }
    },
    play_next: {
        type: Function,
        default: () => { }
    },
    play_previous: {
        type: Function,
        default: () => { }
    },
    repeat_icon: {
        type: String,
        default: "bi-repeat text-muted"
    },
})

onMounted(() => {
    let hammertime = new Hammer(cardView.value);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on("swipedown", function () {
        _hide();
    });

    offcanvas = new Offcanvas(offcanvasEl.value);
})
</script>