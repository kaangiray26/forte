<template>
    <div class="card text-bg-dark rounded-0">
        <div class="card-body p-0">
            <div class="d-flex flex-column">
                <div v-show="store.playing.loaded">
                    <div class="d-flex flex-row p-2 pb-0 rounded m-0">
                        <img class="img-fluid placeholder-img me-2" :src="store.playing.cover" width="56" height="56" />
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">{{ store.playing.title }}</span>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center p-2">
                    <div class="btn-group btn-group-sm me-2" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-light bi bi-skip-start-fill"></button>
                        <button type="button" class="btn btn-light bi" :class="{
                            'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                        }" @click="play"></button>
                        <button type="button" class="btn btn-light bi bi-skip-end-fill"></button>
                    </div>
                    <div class="progress flex-fill me-2" @click="seekProgress($event)">
                        <div class="progress-bar bg-primary progress-bar-animated" aria-valuenow="0" aria-valuemin="0"
                            aria-valuemax="100" :style="{ 'width': progress + '%' }">
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm" role="group" aria-label="Basic example">
                        <button ref="volumeButton" type="button" class="btn btn-light bi" :class="volume_icon"
                            data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="100"
                            @wheel.prevent="changeVolume($event)" :volume="setVolume" @click="muteVolume"></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Tooltip } from "bootstrap"
import { Howl } from 'howler';
import { store } from '/js/store.js';

const sound = ref(null);
const track = ref(null);
const progress = ref(0);
const volume = ref(50);
const muted = ref(null);
const seek = ref(0);

const volumeButton = ref(null);
const volumeTooltip = ref(null);

async function muteVolume() {
    muted.value = !muted.value;
    sound.value.mute(muted.value);
}

const volume_icon = computed(() => {
    if (muted.value) {
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
    sound.value.volume(volume.value / 100);
}

async function lowerVolume() {
    volume.value -= 5;
    if (volume.value < 0) {
        volume.value = 0;
        return;
    }
    sound.value.volume(volume.value / 100);
}

async function get_progress() {
    if (!store.playing.is_playing) {
        return;
    }
    seek.value = sound.value.seek();
    progress.value = (seek.value / store.playing.duration) * 100;
}

async function play_track(obj) {
    track.value = obj;
    console.log("Loading track:", obj.id);

    sound.value.unload();
    sound.value._src = [`http://localhost:3000/api/track/${obj.id}`];
    sound.value.load();
}

async function track_loaded() {
    store.playing.id = track.value.id;
    store.playing.loaded = true;
    store.playing.type = track.value.type;
    store.playing.title = track.value.title;
    store.playing.cover = track.value.cover;
    store.playing.duration = sound.value.duration();

    sound.value.play();
    store.playing.is_playing = true;
}

async function play() {
    if (!store.playing.loaded) {
        return;
    }

    if (store.playing.is_playing) {
        sound.value.pause();
        store.playing.is_playing = false;
        return;
    }

    sound.value.play();
    store.playing.is_playing = true;
}

onMounted(() => {
    initTooltips();

    sound.value = new Howl({
        src: [''],
        format: ['flac'],
        preload: true,
        html5: true,
        volume: 0.5,
    });

    sound.value.on('load', track_loaded)

    window.addEventListener('playTrack', event => {
        play_track(event.detail);
    })
    setInterval(get_progress, 1000);
})
</script>