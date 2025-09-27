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
                class="nav-link fw-bold theme-btn black-on-hover text-white">Albums</router-link>
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
                    <span class="fw-bold">{{ total }} liked albums</span>
                </div>
            </div>
        </li>
        <li v-if="albums.length == 0"
            class="list-group-item theme-list-item-no-hover foreground d-flex justify-content-between">
            <div class="d-flex flex-fill align-items-center">
                <div class="d-flex flex-column">
                    <span class="theme-color fw-bold">No albums found</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item clickable rounded d-flex justify-content-between p-1"
            v-for="album in albums" @contextmenu.prevent="right_click({ item: album, event: $event })"
            @click="openAlbum(album)">
            <div class="d-flex flex-fill foreground align-items-center">
                <img :src="get_cover(album.cover)" class="track-cover theme-border rounded" @error="placeholder" />
                <div class="d-flex align-items-center">
                    <button class="btn btn-link search-link d-flex text-start py-0" :content_id="album.id"
                        :content_type="album.type" style="display:contents;">
                        <span class="theme-color text-break">{{
                            album.title }}</span>
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

const albums = ref([]);
const total = ref(0);
const offset = ref(0);
const searchFinished = ref(true);

// Must be synchronized in groupSession: ok
async function play_album(id) {
    action({
        func: async function op() {
            ft.playAlbum(id)
        },
        object: [id],
        operation: "playAlbum"
    })
}

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/album.svg"
}

async function placeholder(obj) {
    obj.target.src = "/images/album.svg";
}

async function openAlbum(album) {
    if (album.server) {
        router.push("/album/" + album.id + "@" + album.server);
        return
    }
    router.push("/album/" + album.id);
}

async function get_albums_from_domain(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/albums/${offset.value}/${total.value}`);
    if (!data) return;

    // Push album placeholders
    for (let i = 0; i < data.order.length; i++) {
        albums.value.push({});
    }

    // Get federated albums
    get_federated_albums(data.federated, data.order, offset.value);

    // Get local albums
    for (let i = 0; i < data.order.length; i++) {
        let album_id = data.order[i];
        let albums_found = data.albums.filter(t => t.id == album_id);
        if (albums_found.length) {
            albums.value[i + offset.value] = albums_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function get_albums(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/albums/${offset.value}/${total.value}`);
    if (!data) return;

    // Push album placeholders
    for (let i = 0; i < data.order.length; i++) {
        albums.value.push({});
    }

    // Get federated albums
    get_federated_albums(data.federated, data.order, offset.value);

    // Get local albums
    for (let i = 0; i < data.order.length; i++) {
        let album_id = data.order[i];
        let albums_found = data.albums.filter(t => t.id == album_id);
        if (albums_found.length) {
            albums.value[i + offset.value] = albums_found[0];
        }
    }

    total.value = data.total;
    offset.value += data.order.length;

    searchFinished.value = true;
}

async function get_federated_albums(album_ids, order, _offset) {
    // Categorize ids by domain
    let domains = {};
    for (let album_id of album_ids) {
        let [id, domain] = album_id.split('@');
        if (!domains[domain]) {
            domains[domain] = [];
        }
        domains[domain].push(parseInt(id));
    }

    // Get federated albums from each domain
    for (let domain in domains) {
        let data = await ft.get_federated_albums(domain, domains[domain]);
        if (!data) return;

        data.albums.map(album => album.server = domain);
        for (let i = 0; i < order.length; i++) {
            let album_id = order[i];
            let found_albums = data.albums.filter(t => `${t.id}@${t.server}` == album_id);
            if (found_albums.length) {
                albums.value[i + _offset] = found_albums[0];
            }
        }
    }
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_albums_from_domain(id);
        return
    }
    get_albums(id);
}

onMounted(() => {
    setup();
})
</script>