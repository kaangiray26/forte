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
            <div class="input-group mb-3">
                <span class="input-group-text" id="basic-addon1">Scrobbling</span>
                <button v-show="!lastfm_config.scrobbling" type="button" class="btn btn-danger"
                    @click="toggle_scrobbling">Off</button>
                <button v-show="lastfm_config.scrobbling" type="button" class="btn btn-success"
                    @click="toggle_scrobbling">On</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { store } from '/js/store.js';
const lastfm_config = ref({});

async function toggle_scrobbling() {
    if (!lastfm_config.value.lastfm_key) {
        window.location.href = 'http://www.last.fm/api/auth/?api_key=48c8147a3ca9e182717a154ab44ab848'
        return
    }

    lastfm_config.value.scrobbling = !lastfm_config.value.scrobbling;
    localStorage.setItem('scrobbling', JSON.stringify(lastfm_config.value.scrobbling));
    store.scrobbling = lastfm_config.value.scrobbling;
}

onMounted(() => {
    ['lastfm_key', 'scrobbling'].forEach((key) => {
        let value = localStorage.getItem(key);
        if (value) {
            lastfm_config.value[key] = JSON.parse(value);
        } else {
            lastfm_config.value[key] = null
        }
    })
})
</script>