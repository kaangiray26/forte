<template>
    <div ref="offcanvasEl" class="offcanvas offcanvas-bottom bg-dark border-0 vh-100 vw-100" tabindex="-1"
        id="offcanvasBottom" aria-labelledby="offcanvasBottomLabel">
        <div class="offcanvas-body">
            <div class="row h-100 justify-content-center align-items-end gx-0">
                <div class="col h-100">
                    <div ref="cardView" class="card h-100">
                        <img :src="store.playing.cover" class="card-img-top image-stable p-2">
                        <div class="overflow-hidden text-center">
                            <div class="text-wrap">
                                <h5 class="fw-bold">{{ store.playing.title }}</h5>
                            </div>
                        </div>
                        <div class="card-body d-flex align-items-end p-2">
                            <div class="d-flex flex-fill flex-column">
                                <div class="d-flex justify-content-between">
                                    <div class="d-flex align-items-center font-monospace me-2">
                                        <small>{{ formatTime(store.playing.seek) }}</small>
                                    </div>
                                    <div class="d-flex align-items-center font-monospace me-2">
                                        <small>{{ formatTime(store.playing.duration) }}</small>
                                    </div>
                                </div>
                                <div class="progress mb-4" @click="props.seekProgress($event)">
                                    <div class="progress-bar bg-dark progress-bar-striped progress-bar-animated"
                                        aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
                                        :style="{ 'width': store.playing.progress + '%' }">
                                        <span class="visually-hidden"></span>
                                    </div>
                                </div>
                                <div class="btn-group btn-group-sm mb-2" role="group" aria-label="Basic example">
                                    <button type="button" class="btn btn-dark rounded bi bi-skip-start-fill mx-1"
                                        @click="play_previous"></button>
                                    <button type="button" class="btn btn-dark rounded bi mx-1" :class="{
                                        'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                                    }" @click="play"></button>
                                    <button type="button" class="btn btn-dark rounded bi bi-skip-end-fill mx-1"
                                        @click="play_next"></button>
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
import { Offcanvas } from "bootstrap"
import { store } from "/js/store.js"
import Hammer from "hammerjs";

let offcanvas = null;
const offcanvasEl = ref(null);
const cardView = ref(null);

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
})

onMounted(() => {
    let hammertime = new Hammer(offcanvasEl.value);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on("swipedown", function () {
        console.log("Swipedown");
        _hide();
    });

    offcanvas = new Offcanvas(offcanvasEl.value);
})
</script>