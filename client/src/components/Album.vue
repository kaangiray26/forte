<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 mx-3" v-show="loaded">
        <div class="card-body px-3">
            <div class="row g-3">
                <div class="col-12 col-sm-auto">
                    <div class="d-inline-flex position-relative"
                        @contextmenu.prevent="right_click({ item: album, event: $event })">
                        <img class="playlist-img shadow" :src="get_cover(album.cover)" width="250" height="250" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_album(album.id)">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col theme-color">
                    <h1 class="album-title mb-4">{{ album.title }}</h1>
                    <router-link :to="'/artist/' + artist.id" class="search-link">
                        <div class="d-inline-flex align-content-center align-items-center">
                            <img class="img-fluid figure-img rounded m-0" :src="get_artist_cover(artist.cover)" width="28"
                                height="28">
                            <span class="red-on-hover theme-color mx-2">{{ artist.title }}</span>
                        </div>
                    </router-link>
                    <hr />
                    <ul class="list-group">
                        <div v-for="track in tracks">
                            <li class="list-group-item theme-btn text-light d-flex" v-if="track.track_position == 1">
                                <div class="d-flex w-100 justify-content-between">
                                    <div>
                                        <span class="fw-bold">Disc {{ track.disc_number }}</span>
                                    </div>
                                </div>
                            </li>
                            <li class="list-group-item theme-list-item clickable d-flex"
                                :class="{ 'now-playing': selected_track == track.id }"
                                @contextmenu.prevent="right_click({ item: track, event: $event })"
                                @click="play_track(track.id)">
                                <div class="d-flex w-100 justify-content-between">
                                    <div class="d-flex">
                                        <div class="d-flex align-items-start">
                                            <img :src="get_track_cover(album.cover)" class="track-cover" />
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <button class="btn btn-link search-link d-flex text-start"
                                                style="display:contents;">
                                                <span class="text-muted me-2">{{ track.track_position }}.</span>
                                                <span class="theme-color text-break">{{ track.title }}</span>
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
import { ref, watch, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '/js/store.js';
import { right_click, action } from '/js/events.js';

const router = useRouter();

const query_param = computed(() => {
    return router.currentRoute.value.params;
})

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
    return "/images/album.svg"
}

function get_track_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/track.svg"
}

function get_artist_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/artist.svg"
}

// Must be synchronized in groupSession: ok
async function play_track(id) {
    action({
        func: async function op() {
            ft.playTrack(id)
        },
        object: id,
        operation: "playTrack"
    })
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

// Must be synchronized in groupSession: ok
async function play_album(id) {
    action({
        func: async function op() {
            ft.playAlbum(id)
        },
        object: id,
        operation: "playAlbum"
    })
}

watch(query_param, (params) => {
    if (store.selected_track_id) {
        selected_track.value = store.selected_track_id;
        store.selected_track_id = null;
    }
    if (params.id) {
        get_album(params.id);
    }
})
onBeforeMount(() => {
    if (store.selected_track_id) {
        selected_track.value = store.selected_track_id;
        store.selected_track_id = null;
    }
    get_album(router.currentRoute.value.params.id);
})
</script>