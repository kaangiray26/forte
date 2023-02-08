<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile/settings" class="nav-link search-link">Settings</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link search-link">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link search-link">Favorite Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists" class="nav-link bg-dark search-link text-white">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/albums" class="nav-link search-link">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/artists" class="nav-link search-link">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/stations" class="nav-link search-link">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link search-link">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-2">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow" @click="showPlaylistCreate">
                        <img class="playlist-img" src="/images/add.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable search-link p-2 ps-0"
                            @click="showPlaylistCreate">Create a playlist</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="playlist in playlists">
            <div class="card h-100 w-100 border-0"
                @contextmenu.prevent="right_click({ item: playlist, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow">
                        <img class="playlist-img pe-auto" :src="get_cover(playlist.cover)"
                            @click="openPlaylist(playlist.id)" />
                        <div class="d-flex position-absolute bottom-0 right-0 flex-nowrap">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2 me-2" type="button"
                                @click="play_playlist(playlist.id)">
                            </button>
                            <button class="btn btn-light action-btn bi bi-three-dots ms-0 m-2" type="button"
                                data-bs-toggle="dropdown">
                                <ul class="dropdown-menu shadow-lg context-menu">
                                    <li>
                                        <button class="dropdown-item" type="button"
                                            @click="delete_playlist(playlist.id)">
                                            <span class="bi bi-trash-fill me-1"></span>Delete playlist</button>
                                    </li>
                                </ul>
                            </button>
                        </div>
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable search-link p-2 ps-0"
                            @click="openPlaylist(playlist.id)">{{ playlist.title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <PlaylistCreate ref="playlistCreate" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';
import PlaylistCreate from '../PlaylistCreate.vue';

const router = useRouter();
const playlists = ref([]);

const playlistCreate = ref(null);

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

async function play_playlist(id) {
    ft.playPlaylist(id);
}

async function get_playlists() {
    let data = await ft.API('/profile/playlists');
    if (!data) return;
    playlists.value = data.playlists;
}

onMounted(() => {
    get_playlists();
})
</script>