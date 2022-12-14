<template>
    <div class="card text-bg-dark rounded-0">
        <div class="card-body p-2">
            <div class="d-flex flex-column">
                <div v-show="store.playing.loaded">
                    <div class="d-inline-flex flex-row border rounded p-2 mb-2">
                        <img class="img-fluid me-2" :src="store.playing.cover" width="56" height="56" />
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">{{ store.playing.title }}</span>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="btn-group btn-group-sm me-2" role="group" aria-label="Basic example">
                        <button type="button" class="btn btn-light bi bi-skip-start-fill"></button>
                        <button type="button" class="btn btn-light bi" :class="{
                            'bi-play-fill': !store.playing.is_playing, 'bi-pause-fill': store.playing.is_playing
                        }" @click="play"></button>
                        <button type="button" class="btn btn-light bi bi-skip-end-fill"></button>
                    </div>
                    <div class="progress flex-fill" @click="seekProgress($event)">
                        <div class="progress-bar bg-primary progress-bar-animated" aria-valuenow="0" aria-valuemin="0"
                            aria-valuemax="100" :style="{ 'width': progress + '%' }">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Howl, Howler } from 'howler';
import { store } from '/js/store.js';

const sound = ref(null);
const track = ref(null);
const progress = ref(0);
const seek = ref(0);

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
    if (store.playing.is_playing) {
        sound.value.pause();
        store.playing.is_playing = false;
        return;
    }

    sound.value.play();
    store.playing.is_playing = true;
}

onMounted(() => {
    sound.value = new Howl({
        src: [''],
        format: ['flac'],
        preload: true,
        html5: true,
    });

    sound.value.on('load', track_loaded)

    window.addEventListener('playTrack', event => {
        play_track(event.detail);
    })
    setInterval(get_progress, 1000);
})
</script>