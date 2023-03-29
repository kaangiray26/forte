<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + username"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Profile</router-link>
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
                class="nav-link fw-bold purple-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/friends'"
                class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <!-- Last.fm Section -->
    <div v-if="lastfm_profile" class="card">
        <div class="card-body">
            <h3>Last.fm</h3>
            <div class="d-inline-flex flex-column">
                <div class="d-inline-flex border rounded mb-2 p-2">
                    <div class="d-flex">
                        <img :src="lastfm_profile.image[3]['#text']" class="img-lastfm" width="50" height="50" />
                    </div>
                    <div class="d-flex flex-column mx-2">
                        <span class="fw-bold">{{ lastfm_profile.name }}</span>
                        <div class="d-flex flex-wrap align-items-center">
                            <span class="text-muted fw-bold">Scrobbles:</span>
                            <span class="badge bg-dark mx-2">{{ formatNumber(lastfm_profile.playcount) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column mt-4">
                <h5>Top Tracks This Week</h5>
                <ul class="list-group list-group-flush flex-fill">
                    <li v-for="track in top_tracks" class="list-group-item list-group-item-action clickable"
                        @click="openTrack(track)">
                        <div class="d-flex">
                            <img :src="track.image[3]['#text']" class="img-lastfm" width="50" height="50" />
                            <div class="d-flex flex-fill justify-content-between">
                                <div class="d-flex flex-column mx-2">
                                    <span class="fw-bold">{{ track.artist.name }}</span>
                                    <span>{{ track.name }}</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-dark">{{ track.playcount }}</span>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Federated
const domain = ref(null);

const username = ref(router.currentRoute.value.params.id);

const lastfm_profile = ref(null);
const lastfm_api_key = ref(null);
const top_tracks = ref([]);

async function check_lastfm_profile(id) {
    let response = await ft.API('/lastfm/profile/' + id);
    if (!response.lastfm) {
        return
    }

    get_lastfm_profile(response.lastfm);
    get_top_tracks(response.lastfm);
}

async function check_federated_lastfm_profile(id) {
    let response = await ft.fAPI(domain.value, '/lastfm/profile/' + id);

    if (!response.lastfm) {
        return
    }

    get_lastfm_profile(response.lastfm);
    get_top_tracks(response.lastfm);
}

async function get_lastfm_profile(username) {
    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${lastfm_api_key.value}&format=json`)
        .then((response) => response.json());
    lastfm_profile.value = response.user;
}

async function get_top_tracks(username) {
    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&limit=24&period=7day&user=${username}&api_key=${lastfm_api_key.value}&format=json`)
        .then((response) => response.json());
    top_tracks.value = response.toptracks.track;
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

async function setup() {
    let response = await ft.API('/lastfm/auth');
    if (response.hasOwnProperty('error')) {
        return
    }
    lastfm_api_key.value = response.api_key;

    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        check_federated_lastfm_profile(id);
        return
    }
    check_lastfm_profile(id);
}

onBeforeMount(() => {
    setup();
})
</script>