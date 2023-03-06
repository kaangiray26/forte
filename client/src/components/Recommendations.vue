<template>
    <div class="card border-0 mx-4 shadow-lg" v-if="loaded">
        <div class="card-body">
            <div v-if="loaded" class="hide-on-desktop mx-2">
                <h3 class="fw-bold">Recommended for you</h3>
                <p v-if="!tracks.length" class="px-3 text-decoration-underline">No content in the library.</p>
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
            <div v-if="loaded" class="hide-on-mobile row g-2 mx-2">
                <h3 class="fw-bold">Recommended for you</h3>
                <p v-if="!tracks.length" class="px-3 text-decoration-underline">No content in the library.</p>
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="track in tracks">
                    <Track :track="track" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Track from "/components/recommendation/Track.vue";
import CarouselTrack from "/components/recommendation/CarouselTrack.vue";

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