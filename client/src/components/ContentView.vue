<template>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Howl, Howler } from 'howler';
import { server } from '/js/api.js';

const sound = ref(null);
const progress = ref(null);
const is_playing = ref(false);
const duration = ref(0);

async function load_track(id) {
    sound.value.unload();
    sound.value._src = [server + '/' + id];
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