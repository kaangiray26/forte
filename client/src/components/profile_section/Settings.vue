<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link bg-dark search-link text-white">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link search-link">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link search-link">Favorite Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists" class="nav-link search-link">Playlists</router-link>
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
    <div class="card">
        <div class="card-body">
            <h3>Last.fm</h3>
            <div class="d-inline-flex flex-column">
                <div v-if="lastfm_profile" class="d-inline-flex border rounded mb-2 p-2">
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
                <div class="input-group flex-nowrap mb-2">
                    <span class="input-group-text" id="basic-addon1">Scrobbling</span>
                    <button v-show="!lastfm_config.scrobbling" type="button" class="btn btn-danger flex-fill"
                        @click="toggle_scrobbling">Off</button>
                    <button v-show="lastfm_config.scrobbling" type="button" class="btn btn-success flex-fill"
                        @click="toggle_scrobbling">On</button>
                </div>
                <button v-if="lastfm_profile" class="btn btn-dark mb-2" @click="remove_account">Remove account</button>
            </div>
            <div v-if="lastfm_profile" class="d-flex flex-column mt-4">
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
            <hr />
            <h3>Notifications</h3>
            <div class="d-inline-flex">
                <div class="input-group flex-nowrap mb-2">
                    <span class="input-group-text" id="basic-addon1">Notifications</span>
                    <button v-show="!store.notifications_enabled" type="button" class="btn btn-danger flex-fill"
                        @click="toggle_notifications">Off</button>
                    <button v-show="store.notifications_enabled" type="button" class="btn btn-success flex-fill"
                        @click="toggle_notifications">On</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeMount, ref } from 'vue'
import { store } from '/js/store.js';

const lastfm_config = ref({});
const lastfm_api_key = ref(null);
const lastfm_profile = ref(null);

const top_tracks = ref([]);

async function openTrack(track) {
    window.open(track.url, '_blank');
}

async function toggle_scrobbling() {
    if (!lastfm_config.value.lastfm_key) {
        window.location.href = `https://www.last.fm/api/auth/?api_key=${lastfm_api_key.value}`
        return
    }

    lastfm_config.value.scrobbling = !lastfm_config.value.scrobbling;
    localStorage.setItem('scrobbling', JSON.stringify(lastfm_config.value.scrobbling));
    store.scrobbling = lastfm_config.value.scrobbling;
}

async function toggle_notifications() {
    if ("Notification" in window) {
        if (store.notifications_granted) {
            store.notifications_enabled = !store.notifications_enabled;
            localStorage.setItem('notifications_enabled', JSON.stringify(store.notifications_enabled));
            console.log(store.notifications_granted, store.notifications_enabled)
            return
        }

        if (!store.notifications_granted) {
            Notification.requestPermission().then(function (permission) {
                if (permission === "granted") {
                    store.notifications_granted = true;
                    store.notifications_enabled = true;
                    localStorage.setItem('notifications_granted', JSON.stringify(true));
                    localStorage.setItem('notifications_enabled', JSON.stringify(true));
                }
            });
            return
        }
    }
}

async function get_lastfm_profile() {
    let username = localStorage.getItem('lastfm_username');
    if (!username) {
        return
    }

    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${JSON.parse(username)}&api_key=${lastfm_api_key.value}&format=json`)
        .then((response) => response.json());
    lastfm_profile.value = response.user;
}

async function get_top_tracks() {
    let username = localStorage.getItem('lastfm_username');
    if (!username) {
        return
    }

    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&limit=24&period=7day&user=${JSON.parse(username)}&api_key=${lastfm_api_key.value}&format=json`)
        .then((response) => response.json());

    top_tracks.value = response.toptracks.track;
}

async function remove_account() {
    localStorage.removeItem('lastfm_key');
    localStorage.removeItem('lastfm_username');
    localStorage.removeItem('scrobbling');
    lastfm_config.value = {};
    lastfm_profile.value = null;
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

onBeforeMount(async () => {
    ['lastfm_key', 'scrobbling'].forEach((key) => {
        let value = localStorage.getItem(key);
        if (value) {
            lastfm_config.value[key] = JSON.parse(value);
        } else {
            lastfm_config.value[key] = null
        }
    })

    let response = await ft.API('/lastfm/auth');
    if (response.hasOwnProperty('error')) {
        return
    }
    lastfm_api_key.value = response.api_key;

    get_lastfm_profile();
    get_top_tracks();
})
</script>