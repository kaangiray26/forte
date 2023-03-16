<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + username"
                class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/history'"
                class="nav-link fw-bold purple-on-hover theme-color">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/tracks'" class="nav-link fw-bold purple-on-hover theme-color">Favorite
                Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/playlists'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/albums'"
                class="nav-link fw-bold purple-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/artists'"
                class="nav-link fw-bold purple-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/friends'"
                class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-2">
        <div v-show="!playlists.length" class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative">
                        <img class="playlist-img" src="/images/empty.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="theme-color fw-bold text-break text-wrap p-2 ps-0">No playlists added yet</h6>
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
                            <button class="btn btn-light action-btn bi bi-three-dots ms-0 m-2" type="button"
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click, action } from '/js/events.js';

const router = useRouter();
const playlists = ref([]);
const username = ref(router.currentRoute.value.params.id)

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
    let data = await ft.API(`/user/${username.value}/playlists`);
    if (!data) return;
    playlists.value = data.playlists;
}

onMounted(() => {
    get_playlists();
})
</script>