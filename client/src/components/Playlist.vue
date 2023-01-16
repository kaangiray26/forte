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
                    <div class="d-inline-flex position-relative">
                        <img class="playlist-img rounded" :src="get_cover(playlist.cover)" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_playlist(playlist.id)">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col">
                    <h1 class="album-title mb-4">{{ playlist.title }}</h1>
                    <router-link :to="'/user/' + playlist.author" class="search-link">
                        <div class="d-inline-flex align-content-center align-items-center">
                            <span class="mx-2">{{ playlist.author }}</span>
                        </div>
                    </router-link>
                    <div class="text-muted">
                        <span class="mx-2">{{ tracks.length }} tracks</span>
                    </div>
                    <hr />
                    <ul class="list-group">
                        <li class="list-group-item bg-dark text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Playlist</span>
                                </div>
                            </div>
                        </li>
                        <li v-for="(track, index) in tracks" class="list-group-item list-group-item-action d-flex"
                            @contextmenu="right_click({ item: track, event: $event })">
                            <div class="d-flex w-100 justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex ratio-1x1 align-items-center">
                                        <img :src="track.cover" class="placeholder-img-lite rounded" width="56"
                                            height="56" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link search-link d-flex text-start"
                                            style="display:contents;" @click="play_track(track.id)">
                                            <span class="text-muted me-2">{{ index+ 1 }}.</span>
                                            <span>{{ track.title }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div v-show="isAuthor">
                                <div class="d-flex h-100 align-items-center">
                                    <button class="btn btn-light action-btn bi bi-three-dots ms-0 m-2" type="button"
                                        data-bs-toggle="dropdown">
                                        <ul class="dropdown-menu shadow-lg context-menu">
                                            <li>
                                                <button class="dropdown-item" type="button"
                                                    @click="delete_track_from_playlist(track.id)">
                                                    <span class="bi bi-trash-fill me-1"></span>Delete
                                                    track</button>
                                            </li>
                                        </ul>
                                    </button>
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

const router = useRouter();

const playlist = ref({})
const tracks = ref([]);
const loaded = ref(false);

const isAuthor = ref(false);

function get_cover(cover) {
    if (cover) {
        return ft.server + '/' + cover;
    }
    return "/images/playlist.png"
}

async function delete_track_from_playlist(id) {
    await ft.deleteTrackFromPlaylist(playlist.value.id, id);
    get_playlist(router.currentRoute.value.params.id);
}

async function play_track(id) {
    ft.playTrack(id);
}

async function get_playlist(id) {
    let data = await ft.API(`/playlist/${id}`);
    if (!data) return;

    playlist.value = data.playlist;
    tracks.value = data.tracks;

    if (localStorage.getItem('username') == playlist.value.author) {
        isAuthor.value = true;
    }

    loaded.value = true;
}

async function play_playlist(id) {
    ft.playPlaylist(id);
}

onMounted(() => {
    get_playlist(router.currentRoute.value.params.id);
})
</script>