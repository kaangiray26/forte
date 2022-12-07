<template>
    <div class="card text-bg-dark">
        <div class="card-body d-flex flex-column">
            <div class="progress mb-2">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                    aria-label="Animated striped example" aria-valuemin="0" aria-valuemax="100"
                    :style="('width:' + progress)"></div>
            </div>
            <div class="btn-group" role="group" aria-label="Basic example">
                <button type="button" class="btn btn-outline-light bi-skip-start-fill"></button>
                <button type="button" class="btn btn-outline-light bi"
                    :class="{ 'bi-play-fill': !is_playing, 'bi-pause-fill': is_playing }" @click="play"></button>
                <button type="button" class="btn btn-outline-light bi-skip-end-fill"></button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Howl, Howler } from 'howler';

const sound = ref(null);
const progress = ref(null);
const is_playing = ref(false);
const duration = ref(0);

async function load_track(id) {
    sound.value.unload();
    sound.value._src = [`http://localhost:3000/api/track/${id}`];
    sound.value.load();
    duration.value = sound.value.duration();
}

async function play() {
    if (is_playing.value) {
        sound.value.pause();
        is_playing.value = false;
        return;
    }

    console.log(sound.value);
    sound.value.play();
    is_playing.value = true;
}

async function get_progress() {
    if (!is_playing.value) {
        return;
    }
    let val = sound.value.seek();

}

onMounted(() => {
    sound.value = new Howl({
        src: [''],
        format: ['flac', 'mp3'],
        html5: true
    });
    setInterval(get_progress, 1000);
})

</script>