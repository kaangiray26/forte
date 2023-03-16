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
                class="nav-link fw-bold purple-on-hover theme-color">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/albums'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Albums</router-link>
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
        <div v-show="!total" class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative">
                        <img class="playlist-img" src="/images/empty.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="theme-color fw-bold text-break text-wrap p-2 ps-0">No albums added yet</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="album in albums">
            <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: album, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow">
                        <img class="playlist-img pe-auto" :src="get_cover(album.cover)" @click="openAlbum(album.id)" />
                        <div class="d-flex position-absolute bottom-0 right-0 flex-nowrap">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2 me-2" type="button"
                                @click="play_album(album.id)">
                            </button>
                        </div>
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color purple-on-hover p-2 ps-0"
                            @click="openAlbum(album.id)">{{
                                album.title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="get_albums">Load more</button>
        <button v-show="!searchFinished" class="btn btn-dark" type="button" disabled>
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();
const username = ref(router.currentRoute.value.params.id);

const albums = ref([]);
const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

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

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/album.svg"
}

async function openAlbum(id) {
    router.push("/album/" + id);
}

async function get_albums() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${username.value}/albums/${offset.value}`);
    if (!data) return;

    total.value = data.total;
    for (let i = 0; i < data.albums.length; i++) {
        let album = data.albums[i];
        if (albums.value.includes(album)) {
            continue;
        }
        albums.value.push(album);
        offset.value += 1;
    }
    searchFinished.value = true;
}

onMounted(() => {
    get_albums();
})
</script>