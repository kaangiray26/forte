<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card border-0 mx-4 shadow-lg" v-show="loaded">
        <div class="card-body">
            <div class="row g-4">
                <div class="col-12 col-sm-auto">
                    <div @contextmenu.prevent="right_click({ item: artist, event: $event })">
                        <img class="playlist-img shadow" :src="get_artist_cover(artist.cover)" />
                    </div>
                </div>
                <div class="col d-flex flex-column justify-content-between">
                    <div class="d-flex flex-column">
                        <h1 class="artist-title">{{ artist.title }}</h1>
                        <small class="text-muted">{{ albums.length }} albums</small>
                        <div class="pt-2">
                            <button type="button" class="btn btn-dark" :class="{ 'disabled': about_disabled }"
                                @click="get_about">{{ about_text }}</button>
                        </div>
                        <hr />
                    </div>
                    <ul class="list-group">
                        <li class="list-group-item bg-dark text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Album</span>
                                </div>
                                <div>
                                    <span class="fw-bold">Tracks</span>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item list-group-item-action clickable d-flex" v-for="album in albums"
                            @contextmenu.prevent="right_click({ item: album, event: $event })" @click="openAlbum(album.id)">
                            <div class="d-flex w-100 justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex align-items-start padding-7">
                                        <img :src="get_album_cover(album.cover)" class="track-cover" />
                                    </div>
                                    <div class="d-flex align-items-start">
                                        <button class="btn btn-link search-link d-flex flex-column text-start"
                                            style="display:contents;">
                                            <span>{{ album.title }}</span>
                                            <span class="text-muted">{{ album.year }}</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="search-link">{{
                                        album.nb_tracks
                                    }}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const artist = ref({});
const albums = ref([]);

const loaded = ref(false);
const about_disabled = ref(false);
const about_text = ref("About");

const router = useRouter();

async function get_about() {
    about_disabled.value = true;

    let search = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&search=${artist.value.title}&limit=1&namespace=0&format=json`)
        .then((response) => response.json())
        .then((data) => {
            return data[3];
        });

    if (search.length) {
        window.open(search[0], "_blank")
        about_disabled.value = false;
        return;
    }

    // // Query with "(band)"

    // let search_1 = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&generator=prefixsearch&gpssearch=${encodeURIComponent(artist.value.title)} (band)&gpsnamespace=0&gpslimit=6`)
    //     .then((response) => response.json())
    //     .then((data) => {
    //         return Object.keys(data.query.pages);
    //     })
    //     .catch((error) => {
    //         return [];
    //     });

    // if (search_1.length) {
    //     window.open("https://en.wikipedia.org/?curid=" + search_1[0], "_blank")
    //     about_disabled.value = false;
    //     return
    // }

    // // Query without "(band)"

    // let search_2 = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&generator=prefixsearch&gpssearch=${encodeURIComponent(artist.value.title)}&gpsnamespace=0&gpslimit=6`)
    //     .then((response) => response.json())
    //     .then((data) => {
    //         return Object.keys(data.query.pages);
    //     }).catch((error) => {
    //         return [];
    //     });

    // if (search_2.length) {
    //     window.open("https://en.wikipedia.org/?curid=" + search_2[0], "_blank")
    //     about_disabled.value = false;
    //     return
    // }

    about_text.value = "No information found";
}

function get_artist_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/artist.svg"
}

function get_album_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/album.svg"
}

function year_sort(a, b) {
    return b.year - a.year;
}

async function get_artist(id) {
    let data = await ft.API(`/artist/${id}`);
    if (!data) return;

    artist.value = data.artist;
    albums.value = data.albums;
    albums.value.sort(year_sort);
    loaded.value = true;
}

async function openAlbum(id) {
    router.push("/album/" + id);
}

onMounted(() => {
    let id = router.currentRoute.value.params.id;
    get_artist(id);
})
</script>