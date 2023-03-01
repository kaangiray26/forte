<template>
    <div v-if="!loaded" class="hide-on-desktop mx-2">
        <h3 class="fw-bold px-3">Recommended for you</h3>
        <ul class="list-group list-group-horizontal mobile-carousel">
            <li class="list-group-item border-0 p-0" v-for="i in 12">
                <CarouselTrackPlaceholder />
            </li>
        </ul>
        <hr class="mx-3">
        <div class="row g-2">
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="i in 12">
                <TrackPlaceholder />
            </div>
        </div>
    </div>
    <div v-if="loaded" class="hide-on-desktop mx-2">
        <h3 class="fw-bold px-3">Recommended for you</h3>
        <ul class="list-group list-group-horizontal mobile-carousel">
            <li class="list-group-item border-0 p-0" v-for="track in tracks.slice(0, 12)">
                <CarouselTrack :track="track" />
            </li>
        </ul>
        <hr class="mx-3">
        <div class="row g-2">
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks.slice(12, 24)">
                <Track :track="track" />
            </div>
        </div>
    </div>
    <div v-if="!loaded" class="hide-on-mobile row g-2 mx-2">
        <h3 class="fw-bold px-3">Recommended for you</h3>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="i in 24">
            <TrackPlaceholder />
        </div>
    </div>
    <div v-if="loaded" class="hide-on-mobile row g-2 mx-2">
        <h3 class="fw-bold px-3">Recommended for you</h3>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks">
            <Track :track="track" />
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Track from "/components/recommendation/Track.vue";
import CarouselTrack from "/components/recommendation/CarouselTrack.vue";

import TrackPlaceholder from "/components/recommendation/TrackPlaceholder.vue";
import CarouselTrackPlaceholder from "/components/recommendation/CarouselTrackPlaceholder.vue";

const tracks = ref([]);
const loaded = ref(false);

async function get_random_tracks() {

    let data = await ft.API("/random/tracks");
    if (!data) return;

    tracks.value = tracks.value.concat(data.tracks);
    loaded.value = true;
}

onBeforeMount(() => {
    get_random_tracks();
})
</script>