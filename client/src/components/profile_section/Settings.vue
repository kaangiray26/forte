<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link bg-dark search-link text-white">Settings</router-link>
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
            <div class="d-inline-flex flex-column mb-4">
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
            <div class="d-flex flex-column">
                <h5>Recommended Albums</h5>
                <ul class="list-group flex-fill">
                    <li v-for="album in lastfm_albums" class="list-group-item list-group-item-action clickable"
                        @click="openAlbum(album)">
                        <div class="d-flex flex-column">
                            <span class="fw-bold">{{ album.artist['#text'] }}</span>
                            <span>{{ album.name }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeMount, ref } from 'vue'
import { store } from '/js/store.js';

const lastfm_config = ref({});
const lastfm_profile = ref(null);
const lastfm_albums = ref([]);

async function openAlbum(album) {
    window.open(album.url, '_blank');
}

async function toggle_scrobbling() {
    if (!lastfm_config.value.lastfm_key) {
        window.location.href = 'https://www.last.fm/api/auth/?api_key=48c8147a3ca9e182717a154ab44ab848'
        return
    }

    lastfm_config.value.scrobbling = !lastfm_config.value.scrobbling;
    localStorage.setItem('scrobbling', JSON.stringify(lastfm_config.value.scrobbling));
    store.scrobbling = lastfm_config.value.scrobbling;
}

async function get_lastfm_profile() {
    let username = localStorage.getItem('lastfm_username');
    if (!username) {
        return
    }

    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${JSON.parse(username)}&api_key=48c8147a3ca9e182717a154ab44ab848&format=json`)
        .then((response) => response.json());
    lastfm_profile.value = response.user;
}

async function get_album_recommendations() {
    let username = localStorage.getItem('lastfm_username');
    if (!username) {
        return
    }

    let response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getWeeklyAlbumChart&user=${JSON.parse(username)}&api_key=48c8147a3ca9e182717a154ab44ab848&format=json`)
        .then((response) => response.json());
    lastfm_albums.value = response.weeklyalbumchart.album.slice(0, 24);
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

onBeforeMount(() => {
    ['lastfm_key', 'scrobbling'].forEach((key) => {
        let value = localStorage.getItem(key);
        if (value) {
            lastfm_config.value[key] = JSON.parse(value);
        } else {
            lastfm_config.value[key] = null
        }
    })

    get_lastfm_profile();
    get_album_recommendations();
})
</script>