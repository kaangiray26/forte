<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card border-0 mx-4 shadow-lg" v-show="loaded">
        <div class="card-body">
            <div class="row g-4">
                <div class="col-12 col-sm-auto">
                    <img class="img-fluid rounded placeholder-img" :src="artist.cover" width="250" height="250" />
                </div>
                <div class="col">
                    <h1 class="artist-title">{{ artist.title }}</h1>
                    <small class="text-muted">{{ albums.length }} albums</small>
                    <hr />
                    <ul class="list-group">
                        <li class="list-group-item bg-dark text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Album</span>
                                </div>
                                <div>
                                    <span class="fw-bold">Tracks</span>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item list-group-item-action d-flex" v-for="album in albums"
                            @contextmenu="right_click({ item: album, event: $event })">
                            <div class="d-flex w-100 justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex ratio-1x1 align-items-center">
                                        <img :src="album.cover" class="placeholder-img rounded" width="56"
                                            height="56" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link search-link d-flex flex-column text-start"
                                            style="display:contents;" @click="openAlbum(album.id)">
                                            <span>{{ album.title }}</span>
                                            <span class="text-muted">{{ album.year }}</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="search-link">{{
                                            album.nb_tracks
                                    }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const artist = ref({});
const albums = ref([]);
const loaded = ref(false);

const router = useRouter();

function year_sort(a, b) {
    return b.year - a.year;
}

async function get_artist(id) {
    let data = await ft.API(`/artist/${id}`);
    artist.value = data.artist;
    albums.value = data.albums;
    albums.value.sort(year_sort);
    loaded.value = true;
}

async function openAlbum(id) {
    router.push("/album/" + id);
}

onMounted(() => {
    let id = router.currentRoute.value.params.id;
    get_artist(id);
})
</script>