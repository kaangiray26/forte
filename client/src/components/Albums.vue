<template>
    <div v-if="loaded" class="card rounded-0 border-0 mx-3">
        <div class="card-body px-3">
            <div class="row g-3">
                <h3 class="theme-color fw-bold">Albums</h3>
                <p v-if="!albums.length" class="px-3 text-decoration-underline theme-color">No albums in the library.</p>
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="album in albums">
                    <Album :album="album" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import Album from "/components/recommendation/Album.vue";

const albums = ref([]);
const loaded = ref(false);
const search_finished = ref(true);

async function get_all_albums(offset = 0) {
    search_finished.value = false;

    let data = await ft.API("/albums/" + offset);
    if (!data) {
        loaded.value = true;
        return;
    }
    albums.value = albums.value.concat(data.albums);

    loaded.value = true;
    search_finished.value = true;
}

onBeforeMount(() => {
    get_all_albums();

    // User scrolled to the bottom of the page
    let content_view = document.querySelector('.content-view')
    content_view.addEventListener('scroll', () => {
        if ((content_view.scrollTop >= content_view.scrollTopMax) && search_finished.value) {
            get_all_albums(albums.value.length);
        }
    });
})
</script>