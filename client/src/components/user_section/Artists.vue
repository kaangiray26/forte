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
                class="nav-link fw-bold purple-on-hover theme-color">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/albums'"
                class="nav-link fw-bold purple-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/artists'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Artists</router-link>
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
                    <span class="fw-bold">{{ total }} liked artists</span>
                </div>
            </div>
        </li>
        <li v-if="artists.length == 0"
            class="list-group-item theme-list-item-no-hover foreground d-flex justify-content-between">
            <div class="d-flex flex-fill align-items-center">
                <div class="d-flex flex-column">
                    <span class="theme-color fw-bold">No artists found</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            v-for="artist in artists" @contextmenu.prevent="right_click({ item: artist, event: $event })"
            @click="openArtist(artist)">
            <div class="d-flex flex-fill foreground align-items-center">
                <img :src="get_cover(artist.cover)" class="track-cover theme-border rounded" @error="placeholder" />
                <div class="d-flex align-items-center">
                    <button class="btn btn-link search-link d-flex text-start py-0" :content_id="artist.id"
                        :content_type="artist.type" style="display:contents;">
                        <span class="theme-color text-break">{{
                            artist.title }}</span>
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
import { right_click } from '/js/events.js';

const router = useRouter();

// Federated
const domain = ref(null);

const username = ref(router.currentRoute.value.params.id);

const artists = ref([]);
const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

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
        router.push("/artist/" + artist.id + "@" + artist.server);
        return
    }
    router.push("/artist/" + artist.id);
}

async function get_artists_from_domain(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/artists/${offset.value}/${total.value}`);
    if (!data) return;

    // Push artist placeholders
    for (let i = 0; i < data.order.length; i++) {
        artists.value.push({});
    }

    // Get federated artists
    get_federated_artists(data.federated, data.order, offset.value);

    // Get local artists
    for (let i = 0; i < data.order.length; i++) {
        let artist_id = data.order[i];
        let artists_found = data.artists.filter(t => t.id == artist_id);
        if (artists_found.length) {
            artists.value[i + offset.value] = artists_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function get_artists(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/artists/${offset.value}/${total.value}`);
    if (!data) return;

    // Push artist placeholders
    for (let i = 0; i < data.order.length; i++) {
        artists.value.push({});
    }

    // Get federated artists
    get_federated_artists(data.federated, data.order, offset.value);

    // Get local artists
    for (let i = 0; i < data.order.length; i++) {
        let artist_id = data.order[i];
        let artists_found = data.artists.filter(t => t.id == artist_id);
        if (artists_found.length) {
            artists.value[i + offset.value] = artists_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function get_federated_artists(artist_ids, order, _offset) {
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
        for (let i = 0; i < order.length; i++) {
            let artist_id = order[i];
            let found_artists = data.artists.filter(t => `${t.id}@${t.server}` == artist_id);
            if (found_artists.length) {
                artists.value[i + _offset] = found_artists[0];
            }
        }
    }
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_artists_from_domain(id);
        return
    }
    get_artists(id);
}

onMounted(() => {
    setup()
})
</script>