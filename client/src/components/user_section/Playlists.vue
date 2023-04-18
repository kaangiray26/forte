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
            <router-link :to="'/user/' + username + '/tracks'" class="nav-link fw-bold purple-on-hover theme-color">Favorite
                Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/playlists'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Playlists</router-link>
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
                    <span class="fw-bold">{{ total }} liked playlists</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            @click="showPlaylistCreate">
            <div class="d-flex flex-fill align-items-center">
                <img class="playlist-selection-img me-2" src="/images/add.svg" />
                <div class="d-flex">
                    <button class="btn btn-link search-link d-flex text-start" style="display:contents;">
                        <span class="theme-color text-break">Create a playlist</span>
                    </button>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            v-for="playlist in playlists" @contextmenu.prevent="right_click({ item: playlist, event: $event })"
            @click="openPlaylist(playlist)">
            <div class="d-flex align-items-center position-absolute bottom-0 right-0 p-1">
                <span v-if="playlist.server" class="server bi bi-globe-americas"></span>
            </div>
            <div class="d-flex flex-fill align-items-center">
                <img :src="get_cover(playlist.cover)" class="playlist-selection-img me-2" @error="placeholder" />
                <div class="d-flex">
                    <button class="btn btn-link search-link d-flex text-start" :content_id="playlist.id"
                        :content_type="playlist.type" style="display:contents;">
                        <span class="theme-color text-break" :class="{ 'text-decoration-underline': playlist.server }">{{
                            playlist.title }}</span>
                    </button>
                </div>
            </div>
        </li>
    </ul>
    <div class="d-flex justify-content-end mt-3">
        <button v-show="searchFinished" type="button" class="btn btn-dark theme-btn black-on-hover fw-bold"
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

const playlists = ref([]);
const username = ref(router.currentRoute.value.params.id)

const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

function get_cover(cover) {
    if (cover) {
        return ft.server + '/' + cover;
    }
    return "/images/cassette.svg"
}

async function openPlaylist(id) {
    router.push("/playlist/" + id);
}

// Must be synchronized in groupSession: ok
async function play_playlist(id) {
    action({
        func: async function op() {
            ft.playPlaylist(id)
        },
        object: id,
        operation: "playPlaylist"
    })
}

async function get_federated_playlists(playlist_ids, order, _offset) {
    // Categorize ids by domain
    let domains = {};
    for (let playlist_id of playlist_ids) {
        let [id, domain] = playlist_id.split('@');
        if (!domains[domain]) {
            domains[domain] = [];
        }
        domains[domain].push(parseInt(id));
    }

    // Get federated playlists from each domain
    for (let domain in domains) {
        let data = await ft.get_federated_playlists(domain, domains[domain]);
        if (!data) return;

        data.playlists.map(playlist => playlist.server = domain);
        for (let i = 0; i < order.length; i++) {
            let playlist_id = order[i];
            let found_playlists = data.playlists.filter(t => `${t.id}@${t.server}` == playlist_id);
            if (found_playlists.length) {
                playlists.value[i + _offset] = found_playlists[0];
            }
        }
    }
}

async function get_playlists(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;


    let data = await ft.API(`/user/${id}/playlists/${offset.value}/${total.value}`);
    if (!data) return;

    // Push playlist placeholders
    for (let i = 0; i < data.order.length; i++) {
        playlists.value.push({});
    }

    // Get federated playlists
    get_federated_playlists(data.federated, data.order, offset.value);

    // Get local playlists
    for (let i = 0; i < data.order.length; i++) {
        let playlist_id = data.order[i];
        let playlists_found = data.playlists.filter(t => t.id == playlist_id);
        if (playlists_found.length) {
            playlists.value[i + offset.value] = playlists_found[0];
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
        get_federated_playlists(id);
        return
    }
    get_playlists(id);
}

onMounted(() => {
    setup();
})
</script>