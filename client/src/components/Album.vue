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
                        <img class="playlist-img" :src="get_cover(album.cover)" width="250" height="250" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_album(album.id)">
                            </button>
                        </div>
                    </div>
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
                        <div v-for="track in tracks">
                            <li class="list-group-item bg-dark text-light d-flex" v-if="track.track_position == 1">
                                <div class="d-flex w-100 justify-content-between">
                                    <div>
                                        <span class="fw-bold">Disc {{ track.disc_number }}</span>
                                    </div>
                                </div>
                            </li>
                            <li class="list-group-item list-group-item-action d-flex"
                                :class="{ 'now-playing': selected_track == track.id }"
                                @contextmenu.prevent="right_click({ item: track, event: $event })">
                                <div class="d-flex w-100 justify-content-between">
                                    <div class="d-flex">
                                        <div class="d-flex ratio-1x1 align-items-center">
                                            <img :src="album.cover" class="placeholder-img rounded" width="56"
                                                height="56" />
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <button class="btn btn-link search-link d-flex text-start"
                                                style="display:contents;" @click="play_track(track.id)">
                                                <span class="text-muted me-2">{{ track.track_position }}.</span>
                                                <span>{{ track.title }}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </div>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../js/store';
import { right_click } from '/js/events.js';

const router = useRouter();

const album = ref({});
const artist = ref({});
const tracks = ref([]);
const loaded = ref(false);

const selected_track = ref(null);

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/playlist.png"
}

async function play_track(id) {
    ft.playTrack(id);
}

async function get_album(id) {
    let data = await ft.API(`/album/${id}`);
    if (!data) return;

    artist.value = data.artist;
    album.value = data.album;
    tracks.value = data.tracks;
    tracks.value.sort((a, b) => a.track_position - b.track_position);
    tracks.value.sort((a, b) => a.disc_number - b.disc_number);
    loaded.value = true;
}

async function play_album(id) {
    ft.playAlbum(id);
}

onMounted(() => {
    if (store.selected_track_id) {
        selected_track.value = store.selected_track_id;
        store.selected_track_id = null;
    }
    get_album(router.currentRoute.value.params.id);
})
</script>