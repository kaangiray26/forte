<template>
    <div class="row g-2 mx-4">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks">
            <Track :track="track" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Track from "/components/recommendation/Track.vue";

const tracks = ref([]);

async function get_random_tracks() {
    let data = await ft.API("/random/tracks");
    tracks.value = tracks.value.concat(data.tracks);
}

onMounted(() => {
    get_random_tracks();
})
</script>