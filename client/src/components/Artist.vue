<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 mx-3" v-show="loaded">
        <div class="card-body px-3">
            <div class="row g-3">
                <div class="col-12 col-sm-auto">
                    <div @contextmenu.prevent="right_click({ item: artist, event: $event })">
                        <img class="playlist-img shadow" :src="get_artist_cover(artist.cover)" />
                    </div>
                </div>
                <div class="col d-flex flex-column justify-content-between">
                    <div class="theme-color d-flex flex-column">
                        <h1 class="artist-title">{{ artist.title }}</h1>
                        <small class="text-muted">{{ albums.length }} albums</small>
                        <div class="pt-2">
                            <div class="d-flex flex-wrap">
                                <div class="m-1">
                                    <button ref="wiki_btn" type="button"
                                        class="btn btn-dark theme-btn black-on-hover fw-bold"
                                        :class="{ 'disabled': about_disabled }" @click="get_wiki_page">Wikipedia</button>
                                </div>
                                <div class="m-1">
                                    <button ref="lastfm_btn" type="button"
                                        class="btn btn-dark theme-btn black-on-hover fw-bold"
                                        :class="{ 'disabled': about_disabled }" @click="get_lastfm_page">Last.fm</button>
                                </div>
                            </div>
                        </div>
                        <hr />
                    </div>
                    <ul class="list-group">
                        <li class="list-group-item theme-btn text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Album</span>
                                </div>
                                <div>
                                    <span class="fw-bold">Tracks</span>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item theme-list-item clickable d-flex p-1" v-for="album in albums"
                            @contextmenu.prevent="right_click({ item: album, event: $event })" @click="openAlbum(album.id)">
                            <div class="d-flex w-100 justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex align-items-center">
                                        <img :src="get_album_cover(album.cover)" class="track-cover" @error="placeholder" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <div class="btn btn-link search-link d-flex flex-row text-start"
                                            style="display:contents;">
                                            <span class="theme-color me-2">{{ album.title }}</span>
                                            <span class="text-muted">{{ album.year }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center search-link">
                                    <div class="btn btn-link search-link d-flex flex-row text-start"
                                        style="display:contents;">
                                        <span class="text-muted">{{
                                            album.nb_tracks
                                        }}</span>
                                    </div>
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
import { ref, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const artist = ref({});
const albums = ref([]);

const loaded = ref(false);
const about_disabled = ref(false);

const wiki_btn = ref(null);
const lastfm_btn = ref(null);

const router = useRouter();

async function placeholder(obj) {
    obj.target.src = "/images/album.svg";
}

async function get_wiki_page() {
    wiki_btn.value.disabled = true;

    let search = await fetch(`https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&search=${artist.value.title}&limit=1&namespace=0&format=json`)
        .then((response) => response.json())
        .then((data) => {
            return data[3];
        });

    if (search.length) {
        window.open(search[0], "_blank")
        wiki_btn.value.disabled = false;
        return;
    }

    wiki_btn.value.value = "Page not found";
}

async function get_lastfm_page() {
    lastfm_btn.value.disabled = true;

    let response = await ft.lastfm_artist_page(artist.value.title);
    if (response.hasOwnProperty('url')) {
        window.open(response.url, "_blank")
        lastfm_btn.value.disabled = false;
        return;
    }

    lastfm_btn.value.value = "Page not found";
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
    if (!data || data.error) {
        router.push('/404')
        return;
    }

    artist.value = data.artist;
    albums.value = data.albums;
    albums.value.sort(year_sort);
    loaded.value = true;
}

async function openAlbum(id) {
    router.push("/album/" + id);
}

onBeforeMount(() => {
    get_artist(router.currentRoute.value.params.id);
})
</script>