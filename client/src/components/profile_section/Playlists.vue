<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link fw-bold purple-on-hover theme-color">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link fw-bold purple-on-hover theme-color">Favorite
                Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/albums" class="nav-link fw-bold purple-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/artists" class="nav-link fw-bold purple-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/stations" class="nav-link fw-bold purple-on-hover theme-color">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-3">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow" @click="showPlaylistCreate">
                        <img class="playlist-img" src="/images/add.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable purple-on-hover theme-color p-2 ps-0"
                            @click="showPlaylistCreate">
                            Create a playlist</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="playlist in playlists">
            <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: playlist, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow">
                        <img class="playlist-img pe-auto" :src="get_cover(playlist.cover)"
                            @click="openPlaylist(playlist.id)" />
                        <div class="d-flex position-absolute bottom-0 right-0 flex-nowrap">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2 me-2" type="button"
                                @click="play_playlist(playlist.id)">
                            </button>
                            <button v-if="playlist.author == username"
                                class="btn btn-light action-btn bi bi-three-dots ms-0 m-2" type="button"
                                data-bs-toggle="dropdown">
                                <ul class="dropdown-menu shadow-lg context-menu">
                                    <li>
                                        <button class="dropdown-item" type="button" @click="delete_playlist(playlist.id)">
                                            <span class="bi bi-trash-fill me-1"></span>Delete playlist</button>
                                    </li>
                                </ul>
                            </button>
                        </div>
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color purple-on-hover p-2 ps-0"
                            @click="openPlaylist(playlist.id)">{{ playlist.title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="get_playlists">Load more</button>
        <button v-show="!searchFinished" class="btn btn-dark" type="button" disabled>
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        </button>
    </div>
    <PlaylistCreate ref="playlistCreate" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click, action } from '/js/events.js';
import PlaylistCreate from '../PlaylistCreate.vue';

const router = useRouter();

const playlists = ref([]);
const offset = ref(0);
const searchFinished = ref(true);
const playlistCreate = ref(null);

const username = ref(ft.username);

async function showPlaylistCreate() {
    playlistCreate.value.show();
}

async function delete_playlist(playlist_id) {
    await ft.deletePlaylist(playlist_id);
    get_playlists();
}

function get_cover(cover) {
    if (cover) {
        return ft.server + '/' + cover;
    }
    return "/images/cassette.svg"
}

async function openPlaylist(id) {
    router.push("/playlist/" + id);
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

async function get_playlists() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/profile/playlists/${offset.value}`);
    if (!data) return;

    playlists.value = playlists.value.concat(data.playlists);
    offset.value = playlists.value.length;
    searchFinished.value = true;
}

onMounted(() => {
    get_playlists();
})
</script>