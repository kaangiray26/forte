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
            <router-link to="/profile/artists"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/stations" class="nav-link fw-bold purple-on-hover theme-color">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link fw-bold purple-on-hover theme-color">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-3">
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
                        <img class="img-fluid pe-auto" :src="get_cover(artist.cover)" @click="openArtist(artist)"
                            @error="placeholder" width="250" height="250" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color purple-on-hover p-2 ps-0"
                            @click="openArtist(artist)">{{ artist.title }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="get_artists">Load more</button>
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
const artists = ref([]);
const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

async function placeholder(obj) {
    obj.target.src = "/images/artist.svg";
}

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/artist.svg"
}

async function openArtist(artist) {
    if (artist.server) {
        router.push("/artist/" + artist.uuid + "@" + artist.server);
        return
    }
    router.push("/artist/" + artist.id);
}

async function get_federated_artists(artist_ids) {
    // Categorize ids by domain
    let domains = {};
    for (let artist_id of artist_ids) {
        let [id, domain] = artist_id.split('@');
        if (!domains[domain]) {
            domains[domain] = [];
        }
        domains[domain].push(parseInt(id));
    }

    // Get federated artists from each domain
    for (let domain in domains) {
        let data = await ft.get_federated_artists(domain, domains[domain]);
        if (!data) return;

        data.artists.map(artist => artist.server = domain);

        console.log(data.artists);

        artists.value = artists.value.concat(data.artists);
    }
}

async function get_artists() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/profile/artists/${offset.value}`);
    if (!data) return;

    total.value = data.total;

    // Get federated artists
    get_federated_artists(data.federated);

    // Get local artists
    artists.value = artists.value.concat(data.artists);
    offset.value += data.artists.length;
    searchFinished.value = true;
}

onMounted(() => {
    get_artists();
})
</script>