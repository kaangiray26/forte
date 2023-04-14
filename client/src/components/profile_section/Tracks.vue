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
            <router-link to="/profile/tracks" class="nav-link fw-bold theme-btn black-on-hover text-white">Favorite
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
        <li class="list-group-item rounded mb-1 theme-btn text-light d-flex">
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <span class="fw-bold">{{ total }} liked tracks</span>
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
            v-for="track in tracks" @contextmenu.prevent="right_click({ item: track, event: $event })"
            @click="playTrack(track)">
            <div class="d-flex flex-fill align-items-center">
                <img :src="get_cover(track.cover)" class="playlist-selection-img me-2" @error="placeholder" />
                <div class="d-flex">
                    <div class="d-flex align-items-center">
                        <span v-if="track.server" class="server bi bi-globe-americas"></span>
                    </div>
                    <button class="btn btn-link search-link d-flex text-start" :content_id="track.id"
                        :content_type="track.type" style="display:contents;">
                        <span class="theme-color text-break">{{ track.title }}</span>
                    </button>
                </div>
            </div>
        </li>
    </ul>
    <div class="d-flex justify-content-end mt-3">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
            @click="get_tracks">Load more</button>
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
const total = ref(0);
const offset = ref(0);
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

async function placeholder(obj) {
    obj.target.src = "/images/track.svg";
}

// Must be synchronized in groupSession: ok
async function playTrack(track) {
    // Federated
    if (track.server) {
        action({
            func: async function op() {
                ft.playTrack(track.uuid, track.server)
            },
            object: [track.uuid, track.server],
            operation: "playTrack"
        })
        return
    }

    action({
        func: async function op() {
            ft.playTrack(track.id)
        },
        object: [track.id],
        operation: "playTrack"
    })
    return;
}

async function get_federated_tracks(track_ids) {
    // Categorize ids by domain
    let domains = {};
    for (let track_id of track_ids) {
        let [id, domain] = track_id.split('@');
        if (!domains[domain]) {
            domains[domain] = [];
        }
        domains[domain].push(parseInt(id));
    }

    // Get federated tracks from each domain
    for (let domain in domains) {
        let data = await ft.get_federated_tracks(domain, domains[domain]);
        if (!data) return;

        data.tracks.map(track => track.server = domain);

        let existing = tracks.value.filter(track => track.server).map(track => track.uuid);
        for (let i = 0; i < data.tracks.length; i++) {
            let track = data.tracks[i];
            if (!existing.includes(track.uuid)) {
                tracks.value.push(track);
            }
        }
    }
}

async function get_tracks() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/profile/tracks/${offset.value}`);
    if (!data) return;

    total.value = data.total;
    offset.value += data.tracks.length;

    // Get federated tracks
    get_federated_tracks(data.federated);

    // Get local tracks
    let existing = tracks.value.filter(track => !track.server).map(track => track.id);
    for (let i = 0; i < data.tracks.length; i++) {
        let track = data.tracks[i];
        if (!existing.includes(track.id)) {
            tracks.value.push(track);
        }
    }
    searchFinished.value = true;
}

onMounted(() => {
    get_tracks();
})
</script>