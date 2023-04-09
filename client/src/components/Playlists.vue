<template>
    <div v-if="loaded" class="card rounded-0 border-0 mx-3">
        <div class="card-body px-3">
            <div class="row g-3">
                <h3 class="theme-color fw-bold">Playlists</h3>
                <p v-if="!playlists.length" class="px-3 text-decoration-underline">No playlists in the library.</p>
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="playlist in playlists">
                    <Playlist :playlist="playlist" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Playlist from "/components/recommendation/Playlist.vue";

const playlists = ref([]);
const loaded = ref(false);
const search_finished = ref(true);

async function get_all_playlists(offset = 0) {
    search_finished.value = false;

    let data = await ft.API("/playlists/" + offset);
    if (!data) {
        loaded.value = true;
        return;
    }

    playlists.value = playlists.value.concat(data.playlists);

    loaded.value = true;
    search_finished.value = true;
}

onBeforeMount(() => {
    get_all_playlists();

    // User scrolled to the bottom of the page
    let content_view = document.querySelector('.content-view')
    content_view.addEventListener('scroll', () => {
        if ((content_view.scrollTop >= content_view.scrollTopMax) && search_finished.value) {
            get_all_playlists(playlists.value.length);
        }
    });
})
</script>