<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + username"
                class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/history'"
                class="nav-link fw-bold purple-on-hover theme-color">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/tracks'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Favorite
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
                    <span class="fw-bold">{{ total }} liked tracks</span>
                </div>
            </div>
        </li>
        <li v-if="tracks.length == 0"
            class="list-group-item theme-list-item-no-hover foreground d-flex justify-content-between">
            <div class="d-flex flex-fill align-items-center">
                <div class="d-flex flex-column">
                    <span class="theme-color fw-bold">No tracks found</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            v-for="track in tracks" @contextmenu.prevent="right_click({ item: track, event: $event })"
            @click="playTrack(track)">
            <div class="d-flex flex-fill foreground align-items-center">
                <img :src="get_cover(track.cover)" class="track-cover theme-border rounded" @error="placeholder" />
                <div class="d-flex align-items-center">
                    <button class="btn btn-link search-link d-flex text-start py-0" :content_id="track.id"
                        :content_type="track.type" @click="playTrack(track)" style="display:contents;">
                        <span class="theme-color text-break">{{
                            track.title }}</span>
                    </button>
                </div>
            </div>
        </li>
    </ul>
    <div class="d-flex justify-content-end mt-2">
        <button v-show="searchFinished" type="button" class="btn theme-btn black-on-hover text-white fw-bold"
            @click="setup">Load more</button>
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

const router = useRouter();

// Federated
const domain = ref(null);

const username = ref(router.currentRoute.value.params.id);

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
}

async function get_tracks(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/tracks/${offset.value}/${total.value}`);
    if (!data) return;

    // Push track placeholders
    for (let i = 0; i < data.order.length; i++) {
        tracks.value.push({});
    }

    // Get federated tracks
    get_federated_tracks(data.federated, data.order, offset.value);

    // Get local tracks
    for (let i = 0; i < data.order.length; i++) {
        let track_id = data.order[i];
        let tracks_found = data.tracks.filter(t => t.id == track_id);
        if (tracks_found.length) {
            tracks.value[i + offset.value] = tracks_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function get_federated_tracks(track_ids, order, _offset) {
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
        for (let i = 0; i < order.length; i++) {
            let track_id = order[i];
            let found_tracks = data.tracks.filter(t => `${t.id}@${t.server}` == track_id);
            if (found_tracks.length) {
                tracks.value[i + _offset] = found_tracks[0];
            }
        }
    }
}

async function get_tracks_from_domain(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/tracks/${offset.value}/${total.value}`);
    if (!data) return;

    // Push track placeholders
    for (let i = 0; i < data.order.length; i++) {
        tracks.value.push({});
    }

    // Get federated tracks
    get_federated_tracks(data.federated, data.order, offset.value);

    // Get local tracks
    for (let i = 0; i < data.order.length; i++) {
        let track_id = data.order[i];
        let tracks_found = data.tracks.filter(t => t.id == track_id);
        if (tracks_found.length) {
            tracks.value[i + offset.value] = tracks_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_tracks_from_domain(id);
        return
    }
    get_tracks(id);
}

onMounted(() => {
    setup();
})
</script>