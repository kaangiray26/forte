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
                    <img class="img-fluid rounded placeholder-img" :src="album.cover" width="250" height="250" />
                </div>
                <div class="col">
                    <h1 class="album-title mb-4">{{ album.title }}</h1>
                    <router-link :to="'/artist/' + artist.id" class="search-link">
                        <div class="d-inline-flex align-content-center align-items-center">
                            <img class="img-fluid figure-img rounded m-0" :src="artist.cover" width="28" height="28">
                            <span class="mx-2">{{ artist.title }}</span>
                        </div>
                    </router-link>
                    <hr />
                    <ul class="list-group">
                        <li class="list-group-item bg-dark text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Track</span>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item list-group-item-action d-flex" v-for="track in tracks">
                            <div class="d-flex w-100 justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex ratio-1x1 align-items-center">
                                        <img :src="album.cover" class="placeholder-img rounded" width="56"
                                            height="56" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link search-link d-flex text-start"
                                            style="display:contents;" @click="playTrack(track)">
                                            <span class="text-muted me-2">{{ track.track_position }}.</span>
                                            <span>{{ track.title }}</span>
                                        </button>
                                    </div>
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
import { API, playTrack } from '/js/api.js';

const album = ref({});
const artist = ref({});
const tracks = ref([]);
const loaded = ref(false);

const router = useRouter();

async function get_album(id) {
    let data = await API(`/album/${id}`);
    artist.value = data.artist;
    album.value = data.album;
    tracks.value = data.tracks;
    loaded.value = true;
}

onMounted(() => {
    let id = router.currentRoute.value.params.id;
    get_album(id);
})
</script>