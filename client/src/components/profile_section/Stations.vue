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
    <div v-show="selectedStation" class="col-12">
        <iframe class="w-100" :src="'https://gemini.tunein.com/embed/player/' + selectedStation"></iframe>
    </div>
    <div class="d-inline-flex flex-column">
        <div class="input-group flex-nowrap mb-2">
            <span class="input-group-text bi bi-broadcast" id="addon-wrapping"></span>
            <input ref="station_name" type="text" class="form-control" placeholder="Station name" aria-label="Station name"
                aria-describedby="addon-wrapping" @keypress.enter="search_station">
            <button class="btn btn-dark theme-btn" @click="search_station">Search</button>
        </div>
        <div v-if="!searchFinished" class="alert alert-primary appear" role="alert">
            Searching...
        </div>
    </div>
    <div class="row g-3">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="station in stations">
            <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: station, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow">
                        <img class="playlist-img pe-auto" :src="station.Image" @click="openStation(station.GuideId)" />
                        <div class="d-flex position-absolute bottom-0 right-0 flex-nowrap">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2 me-2" type="button"
                                @click="play_station(station.GuideId)">
                            </button>
                        </div>
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable purple-on-hover theme-color p-2 ps-0"
                            @click="openStation(station.GuideId)">{{ station.Title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

const stations = ref([]);
const station_name = ref(null);
const searchFinished = ref(true);
const selectedStation = ref(null);

async function openStation(id) {
    router.push("/station/" + id);
}

async function play_station(id) {
    selectedStation.value = id;
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
    console.log("Searching for station: " + name)

    let response = await fetch(`https://api.tunein.com/profiles?fullTextSearch=true&query=${name.split(" ").join("+")}`, {
        method: "GET"
    }).then((res) => {
        return res.json()
    });
    let stats = response.Items[1].Children;

    for (let i = 0; i < stats.length; i++) {
        let station = stats[i];
        console.log(station);
    }
    stations.value = response.Items[1].Children;
    searchFinished.value = true;
}
</script>