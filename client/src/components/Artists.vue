<template>
    <div v-if="loaded" class="card border-0 mx-4 shadow-lg">
        <div class="card-body">
            <div class="row g-2 mx-2">
                <h3 class="fw-bold">Artists</h3>
                <p v-if="!artists.length" class="px-3 text-decoration-underline">No artists in the library.</p>
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="artist in artists">
                    <Artist :artist="artist" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Artist from "/components/recommendation/Artist.vue";

const artists = ref([]);
const loaded = ref(false);
const search_finished = ref(true);

async function get_all_artists(offset = 0) {
    search_finished.value = false;

    let data = await ft.API("/artists/" + offset);
    if (!data) {
        loaded.value = true;
        return;
    }
    artists.value = artists.value.concat(data.artists);

    loaded.value = true;
    search_finished.value = true;
}

onBeforeMount(() => {
    get_all_artists();

    // User scrolled to the bottom of the page
    let content_view = document.querySelector('.content-view')
    content_view.addEventListener('scroll', () => {
        if ((content_view.scrollTop >= content_view.scrollTopMax) && search_finished.value) {
            get_all_artists(artists.value.length);
        }
    });
})
</script>