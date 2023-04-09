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
                class="nav-link fw-bold purple-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/artists'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Artists</router-link>
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
                        <h6 class="theme-color fw-bold text-break text-wrap p-2 ps-0">No artists added yet</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="artist in artists">
            <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: artist, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow">
                        <img class="playlist-img pe-auto" :src="get_cover(artist.cover)" @click="openArtist(artist.id)" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color purple-on-hover p-2 ps-0"
                            @click="openArtist(artist.id)">{{ artist.title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="setup">Load more</button>
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

// Federated
const domain = ref(null);

const username = ref(router.currentRoute.value.params.id);

const artists = ref([]);
const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/artist.svg"
}

async function openArtist(id) {
    router.push("/artist/" + id);
}

async function get_artists(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/artists/${offset.value}`);
    if (!data) return;

    total.value = data.total;
    for (let i = 0; i < data.artists.length; i++) {
        let artist = data.artists[i];
        if (artists.value.includes(artist)) {
            continue;
        }
        artists.value.push(artist);
        offset.value += 1;
    }
    searchFinished.value = true;
}

async function get_federated_artists(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/artists/${offset.value}`);
    if (!data) return;

    total.value = data.total;
    for (let i = 0; i < data.artists.length; i++) {
        let artist = data.artists[i];
        if (artists.value.includes(artist)) {
            continue;
        }
        artists.value.push(artist);
        offset.value += 1;
    }
    searchFinished.value = true;
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_federated_artists(id);
        return
    }
    get_artists(id);
}

onMounted(() => {
    setup()
})
</script>