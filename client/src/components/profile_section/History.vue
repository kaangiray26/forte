<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link fw-bold theme-btn black-on-hover text-white">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link fw-bold purple-on-hover theme-color">Favorite
                Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists"
                class="nav-link fw-bold purple-on-hover theme-color">Playlists</router-link>
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
    <ul class="list-group">
        <li class="list-group-item theme-btn text-light d-flex">
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
        <li class="list-group-item theme-list-item clickable d-flex justify-content-between p-1" v-for="track in tracks"
            @contextmenu.prevent="right_click({ item: track, event: $event })" @click="playTrack(track.id)">
            <div class="d-flex flex-fill align-items-center">
                <img :src="get_cover(track.cover)" class="playlist-selection-img me-2" />
                <div class="d-flex flex-column">
                    <button class="btn btn-link theme-color purple-on-hover" :content_id="track.id"
                        :content_type="track.type" style="display:contents;">
                        {{ track.title }}
                    </button>
                </div>
            </div>
        </li>
    </ul>
    <div class="d-flex justify-content-end mt-3">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="get_history">Refresh</button>
        <button v-show="!searchFinished" class="btn btn-dark" type="button" disabled>
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading...
        </button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { right_click, action } from '/js/events.js';

const tracks = ref([]);
const searchFinished = ref(true);

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

async function get_history() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/profile/history`);
    if (!data) return;

    tracks.value = data.tracks;
    searchFinished.value = true;
}

onMounted(() => {
    get_history();
})
</script>