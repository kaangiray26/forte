<template>
    <ul class="hide-on-desktop list-group list-group-horizontal mobile-carousel mx-4">
        <li class="list-group-item border-0 p-0" v-for="track in tracks.slice(0, 12)">
            <CarouselTrack :track="track" />
        </li>
    </ul>
    <div class="hide-on-desktop row g-2 mx-4">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks.slice(12, 24)">
            <Track :track="track" />
        </div>
    </div>
    <div class="hide-on-mobile row g-2 mx-4">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks">
            <Track :track="track" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Track from "/components/recommendation/Track.vue";
import CarouselTrack from "/components/recommendation/CarouselTrack.vue";

const tracks = ref([]);

async function get_random_tracks() {
    let data = await ft.API("/random/tracks");
    if (!data) return;

    tracks.value = tracks.value.concat(data.tracks);
}

onMounted(() => {
    get_random_tracks();
})
</script>