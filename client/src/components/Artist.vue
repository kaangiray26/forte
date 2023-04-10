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
    <div class="card rounded-0 border-0 mx-3 mt-3">
        <div class="card-body px-3">
            <h5 class="theme-color fw-bold">Comments</h5>
            <div class="row g-3">
                <div class="input-group">
                    <textarea class="form-control" aria-label="With textarea" rows="5" cols="33"
                        placeholder="Remember, be nice!"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button class="btn btn-dark theme-btn black-on-hover fw-bold" @click="add_comment">Post</button>
                </div>
                <div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item theme-comment-item p-1" v-for="comment in comments">
                            <div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <router-link :to="'/user/' + comment.author"
                                        class="theme-color purple-on-hover fw-bold me-2">{{
                                            comment.author
                                        }}</router-link>
                                    <span class="text-muted timestamp">{{ format_date(comment.created_at)
                                    }}</span>
                                </div>
                                <p class="theme-color">{{ comment.content }}</p>
                            </div>
                        </li>
                    </ul>
                    <div class="d-flex justify-content-end">
                        <button v-show="searchFinished && comments.length" type="button"
                            class="btn btn-dark theme-btn black-on-hover fw-bold" @click="get_comments">Load more</button>
                        <button v-show="!searchFinished && comments.length" class="btn btn-dark" type="button" disabled>
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Loading...
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

// Federated
const domain = ref(null);

const artist = ref({});
const albums = ref([]);
const comments = ref([]);

const offset = ref(0);

const loaded = ref(false);
const searchFinished = ref(true);
const about_disabled = ref(false);

const wiki_btn = ref(null);
const lastfm_btn = ref(null);


async function placeholder(obj) {
    obj.target.src = "/images/album.svg";
}

function format_date(dt) {
    let date = new Date(dt);

    let date_string = date.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    let time_string = date.toLocaleString("en-GB", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    })

    return `${date_string} ${time_string}`

}

async function add_comment() {
    console.log("post comment");
    let comment = document.querySelector("textarea").value;
    if (!comment.length) {
        return;
    }

    let response = await ft.add_comment(ft.username, "artist", artist.value.id, artist.value.uuid, comment);
    console.log(response);
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
        return;
    }

    console.log(data);

    artist.value = data.artist;
    albums.value = data.albums;
    albums.value.sort(year_sort);
    loaded.value = true;
}

async function get_federated_artist(id) {
    let data = await ft.fAPI(domain.value, `/artist/${id}`);
    if (!data || data.error) {
        return;
    }

    artist.value = data.artist;
    albums.value = data.albums;
    albums.value.sort(year_sort);
    loaded.value = true;
}

async function get_comments() {
    let id = router.currentRoute.value.params.id;
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/comments/artist/${id}/${offset.value}`);
    if (!data || data.error) {
        return;
    }

    offset.value += data.comments.length;
    comments.value = comments.value.concat(data.comments);
    searchFinished.value = true;
}

async function openAlbum(id) {
    router.push("/album/" + id);
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_federated_artist(id);
        return
    }

    get_artist(id);
    get_comments();
}

onBeforeMount(() => {
    setup();
})
</script>