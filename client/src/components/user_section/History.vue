<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + username"
                class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/history'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Listening
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
                class="nav-link fw-bold purple-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/friends'"
                class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <ul class="list-group">
        <li class="list-group-item rounded mb-1 theme-btn text-light d-flex">
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <span class="fw-bold">Recently played</span>
                </div>
            </div>
        </li>
        <li v-if="tracks.length == 0" class="list-group-item list-group-item-action d-flex justify-content-between">
            <div class="d-flex flex-fill align-items-center">
                <div class="d-flex flex-column">
                    <span class="fw-bold">No tracks found</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            v-for="track in tracks" @contextmenu.prevent="right_click({ item: track, event: $event })">
            <div class="d-flex flex-fill align-items-center">
                <img :src="get_cover(track.cover)" class="playlist-selection-img me-2" />
                <div class="d-flex flex-column">
                    <button class="btn btn-link search-link d-flex text-start" :content_id="track.id"
                        :content_type="track.type" @click="playTrack(track.id)" style="display:contents;">
                        <span class="theme-color text-break">{{ track.title }}</span>
                    </button>
                </div>
            </div>
        </li>
    </ul>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="setup">Refresh</button>
        <button v-show="!searchFinished" class="btn btn-dark" type="button" disabled>
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click, action } from '/js/events.js';

// Federated
const domain = ref(null);

const tracks = ref([]);
const searchFinished = ref(true);

const router = useRouter();
const username = ref(router.currentRoute.value.params.id);

function get_cover(cover) {
    if (!cover) {
        return "/images/track.svg"
    }

    if (cover.startsWith("http")) {
        return cover;
    }

    return ft.server + '/' + cover;
}

// Must be synchronized in groupSession: ok
async function playTrack(track_id) {
    action({
        func: async function op() {
            ft.playTrack(track_id)
        },
        object: track_id,
        operation: "playTrack"
    })
    return;
}

async function get_history(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/history`);
    if (!data) return;

    tracks.value = data.tracks;
    searchFinished.value = true;
}

async function get_federated_history(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/history`);
    if (!data) return;

    tracks.value = data.tracks;
    searchFinished.value = true;
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_federated_history(id);
        return
    }
    get_history(id);
}

onMounted(() => {
    setup();
})
</script>