<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link fw-bold purple-on-hover theme-color">Listening
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
            <router-link to="/profile/stations"
                class="nav-link fw-bold theme-btn black-on-hover text-white ">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div v-if="selectedStation" class="col-12 mb-2">
        <iframe class="radio-player w-100 rounded" :src="get_station_address()"></iframe>
    </div>
    <div class="d-flex flex-column">
        <div class="input-group flex-nowrap mb-2">
            <span class="input-group-text bi bi-broadcast" id="addon-wrapping"></span>
            <input ref="station_name" type="text" class="form-control" placeholder="Station name" aria-label="Station name"
                aria-describedby="addon-wrapping" @keypress.enter="search_station">
        </div>
        <div v-if="!searchFinished" class="alert alert-primary appear" role="alert">
            Searching...
        </div>
    </div>
    <div class="row g-3 mx-0">
        <ul class="list-group p-0">
            <div v-for="station in stations">
                <li class="list-group-item theme-list-item clickable rounded d-flex p-1"
                    @click="openStation(station.guide_id, station.hover)">
                    <div class="d-flex w-100 foreground justify-content-between">
                        <div class="d-flex">
                            <div @mouseenter="station.hover = true" @mouseleave="station.hover = false"
                                class="d-inline-flex align-items-center position-relative">
                                <img :src="station.image" class="track-cover theme-border rounded" @error="placeholder" />
                                <div v-if="station.hover" class="position-absolute bottom-0 right-0">
                                    <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                        @click="play_station(station)">
                                    </button>
                                </div>
                            </div>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-link search-link d-flex flex-column text-start py-0"
                                    style="display:contents;">
                                    <span class="theme-color text-break">{{ station.text }}</span>
                                    <span class="text-muted">{{ station.subtext }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            </div>
        </ul>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

const stations = ref([]);
const station_name = ref(null);
const searchFinished = ref(true);
const selectedStation = ref(null);

function get_station_address() {
    // Check for dark theme
    let background = '?background=light';
    if (document.body.classList.contains("dark-theme")) {
        background = '?background=dark'
    }
    console.log("https://gemini.tunein.com/embed/player/" + selectedStation.value + background)
    return "https://gemini.tunein.com/embed/player/" + selectedStation.value + background;
}

async function placeholder(obj) {
    obj.target.src = "/images/station.svg";
}

async function openStation(id, hover) {
    if (hover) return;
    router.push("/station/" + id);
}

async function play_station(station) {
    ft.playStation(station);
}

async function search_station() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let name = station_name.value.value;
    if (!name.length) {
        return;
    }

    let data = await ft.API("/station/search/" + name);
    if (!data || data.error) {
        return;
    }

    data.stations.forEach(station => {
        station.hover = false;
    });

    stations.value = data.stations;
    searchFinished.value = true;
}

onMounted(() => {
    station_name.value.focus();
});
</script>