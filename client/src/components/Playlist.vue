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
                        @contextmenu.prevent="right_click({ item: playlist, event: $event })">
                        <img class="playlist-img shadow" :src="get_cover(playlist.cover)" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_playlist(playlist.id)">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col theme-color">
                    <div class="d-flex flex-column">
                        <h1 class="album-title">{{ playlist.title }}</h1>
                        <small class="text-muted">{{ tracks.length }} tracks</small>
                    </div>
                    <div class="pt-2">
                        <router-link :to="'/user/' + playlist.author" class="search-link">
                            <div class="d-inline-flex align-content-center align-items-center">
                                <span class="purple-on-hover theme-color">{{ playlist.author }}</span>
                            </div>
                        </router-link>
                    </div>
                    <hr />
                    <ul class="list-group">
                        <li class="list-group-item rounded mb-1 theme-btn text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Playlist</span>
                                </div>
                            </div>
                        </li>
                        <li v-for="(track, index) in tracks"
                            class="list-group-item theme-list-item clickable rounded d-flex p-1"
                            @contextmenu.prevent="right_click({ item: track, event: $event })">
                            <div class="d-flex w-100 justify-content-between" @click="play_track(track.id)">
                                <div class="d-flex">
                                    <div class="d-flex align-items-start">
                                        <img :src="get_track_cover(track.cover)" class="track-cover" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link search-link d-flex text-start"
                                            style="display:contents;">
                                            <span class="text-muted me-2">{{ index + 1 }}.</span>
                                            <span class="theme-color text-break">{{ track.title }}</span>
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
import { right_click, action } from '/js/events.js';

const router = useRouter();

const playlist = ref({})
const tracks = ref([]);
const loaded = ref(false);

const isAuthor = ref(false);

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/cassette.svg"
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

async function delete_track_from_playlist(id) {
    await ft.deleteTrackFromPlaylist(playlist.value.id, id);
    get_playlist(router.currentRoute.value.params.id);
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

async function get_playlist(id) {
    let data = await ft.API(`/playlist/${id}`);
    if (!data) return;

    playlist.value = data.playlist;
    tracks.value = data.tracks;

    if (JSON.parse(localStorage.getItem('username')) == playlist.value.author) {
        isAuthor.value = true;
    }

    loaded.value = true;
}

// Must be synchronized in groupSession: ok
async function play_playlist(id) {
    action({
        func: async function op() {
            ft.playPlaylist(id)
        },
        object: id,
        operation: "playPlaylist"
    })
}

onMounted(() => {
    get_playlist(router.currentRoute.value.params.id);
})
</script>