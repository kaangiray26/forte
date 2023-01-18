<template>
    <div class="card text-bg-dark rounded-0 hide-on-mobile">
        <div class="card-body p-0">
            <div class="d-flex flex-column">
                <div v-show="store.playing.loaded">
                    <div class="d-flex flex-row align-items-center p-2 pb-0 rounded m-0">
                        <img class="img-fluid placeholder-img-lite me-2" :src="store.playing.cover" width="56"
                            height="56" />
                        <div class="d-flex flex-column">
                            <span class="fw-bold text-wrap clickable red-on-hover" @click="openAlbum">{{
                                store.playing.title
                            }}</span>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center p-2">
                    <div class="btn-group btn-group-sm me-2" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-light bi bi-skip-start-fill"
                            @click="play_previous"></button>
                        <button type="button" class="btn btn-light bi" :class="{
                            'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                        }" @click="play"></button>
                        <button type="button" class="btn btn-light bi bi-skip-end-fill" @click="play_next"></button>
                    </div>
                    <div class="d-flex align-items-center font-monospace me-2">
                        <small>{{ formatTime(store.playing.seek) }}</small>
                    </div>
                    <div class="progress flex-fill me-2" @click="seekProgress($event)">
                        <div class="progress-bar bg-primary progress-bar-animated" aria-valuenow="0" aria-valuemin="0"
                            aria-valuemax="100" :style="{ 'width': store.playing.progress + '%' }">
                        </div>
                    </div>
                    <div class="d-flex align-items-center font-monospace me-2">
                        <small>{{ formatTime(store.playing.duration) }}</small>
                    </div>
                    <div class="btn-group btn-group-sm" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-light bi bi-soundwave"></button>
                        <button ref="volumeButton" type="button" class="btn btn-light bi" :class="volume_icon"
                            data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="100"
                            @wheel.prevent="changeVolume($event)" :volume="setVolume" @click="muteVolume"></button>
                        <button type="button" class="btn btn-light bi bi-collection-fill" @click="show_queue"></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div ref="mobilePlayer" class="card text-bg-dark rounded-0 hide-on-desktop">
        <div class="card-body p-0">
            <div class="d-inline-flex flex-row w-100 align-items-center"
                :class="{ 'justify-content-between': store.playing.loaded, 'justify-content-end': !store.playing.loaded }">
                <div v-show="store.playing.loaded" class="overflow-hidden">
                    <div class="d-flex flex-row align-items-center p-2 pb-0 rounded m-0">
                        <img class="img-fluid placeholder-img-lite me-2" :src="store.playing.cover" width="56"
                            height="56" />
                        <div class="overflow-hidden">
                            <div class="fw-bold text-nowrap clickable red-on-hover" @click="openAlbum">{{
                                store.playing.title
                            }}</div>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center p-2">
                    <div class="btn-group btn-group-sm me-2" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-light bi bi-skip-start-fill"
                            @click="play_previous"></button>
                        <button type="button" class="btn btn-light bi" :class="{
                            'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                        }" @click="play"></button>
                        <button type="button" class="btn btn-light bi bi-skip-end-fill" @click="play_next"></button>
                    </div>
                </div>
            </div>
            <div class="progress flex-fill m-2" @click="seekProgress($event)">
                <div class="progress-bar bg-primary progress-bar-animated" aria-valuenow="0" aria-valuemin="0"
                    aria-valuemax="100" :style="{ 'width': store.playing.progress + '%' }">
                </div>
            </div>
        </div>
    </div>
    <Queue ref="queueEl" />
    <MobileView ref="mobileViewEl" :seekProgress="seekProgress" :play="play" :play_next="play_next"
        :play_previous="play_previous" @queue="show_queue" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Tooltip } from "bootstrap"
import { store } from '/js/store.js';
import Hammer from "hammerjs";
import Queue from './Queue.vue';
import MobileView from './MobileView.vue';

const router = useRouter();

const queueEl = ref(null);
const mobileViewEl = ref(null);
const mobilePlayer = ref(null);
const volume = ref(100);

const volumeButton = ref(null);
const volumeTooltip = ref(null);

async function muteVolume() {
    ft.mute();
}

const volume_icon = computed(() => {
    if (store.playing.muted) {
        return 'bi-volume-mute-fill';
    }
    if (volume.value > 75) {
        return 'bi-volume-up-fill';
    }
    if (volume.value > 50) {
        return 'bi-volume-down-fill';
    }
    if (volume.value > 0) {
        return 'bi-volume-off-fill';
    }
    return 'bi-volume-mute-fill';
});

function formatTime(secs) {
    let seconds = parseInt(secs);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

async function seekProgress(ev) {
    let src = null;

    if (ev.target.classList.contains('progress')) {
        src = ev.target;
    } else {
        src = ev.target.parentElement;
    }

    const rect = src.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const percent = x / rect.width;
    ft.player.seek(ft.player.duration() * percent);
}

async function initTooltips() {
    volumeTooltip.value = new Tooltip(volumeButton.value, {
        'placement': 'top',
        'container': 'body',
        'trigger': 'hover',
        'delay': {
            'hide': 300
        }
    })
}

const setVolume = computed(() => {
    if (volumeTooltip.value) {
        volumeTooltip.value.setContent({
            '.tooltip-inner': volume.value.toString()
        });
    }
})

async function changeVolume(ev) {
    if (ev.wheelDelta > 0) {
        raiseVolume();
    } else {
        lowerVolume();
    }
}

async function raiseVolume() {
    volume.value += 5;
    if (volume.value > 100) {
        volume.value = 100;
        return;
    }
    ft.player.volume(volume.value / 100);
    localStorage.setItem('volume', volume.value / 100);
}

async function lowerVolume() {
    volume.value -= 5;
    if (volume.value < 0) {
        volume.value = 0;
        return;
    }
    ft.player.volume(volume.value / 100);
    localStorage.setItem('volume', volume.value / 100);
}

async function get_progress() {
    if (!store.playing.is_playing) {
        return;
    }

    store.playing.seek = ft.player.seek();
    store.playing.progress = (store.playing.seek / store.playing.duration) * 100;
}

async function play() {
    ft.play();
}

async function play_previous() {
    ft.play_previous();
}

async function play_next() {
    ft.play_next();
}

async function show_queue() {
    queueEl.value.show();
}

async function openAlbum() {
    store.selected_track_id = store.playing.id;
    router.push("/album/" + store.playing.album);
}

defineExpose({
    show_queue
})

onMounted(() => {
    let vol = localStorage.getItem('volume');
    if (vol) {
        volume.value = parseInt(parseFloat(vol) * 100);
        ft.player.volume(volume.value / 100);
    } else {
        localStorage.setItem('volume', volume.value / 100);
    }

    let hammertime = new Hammer(mobilePlayer.value);
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on("swipeup", function () {
        mobileViewEl.value.show();
    });

    initTooltips();
    setInterval(get_progress, 1000);
})
</script>