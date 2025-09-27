<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 m-3" v-show="loaded">
        <div class="card-body px-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="d-flex position-relative"
                        @contextmenu.prevent="right_click({ item: album, event: $event })">
                        <div class="ph rounded">
                            <img class="playlist-img shadow rounded" :src="get_cover(album.cover)" @error="placeholder" />
                        </div>
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_album(album.id)">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col theme-color">
                    <div class="d-flex flex-column">
                        <h1 class="album-title">{{ album.title }}</h1>
                        <div class="d-flex">
                            <small class="text-muted">{{ album.year }}</small>
                            <small class="album-info text-muted">{{ get_genre(album.genre) }}</small>
                            <small class="album-info text-muted">{{ tracks.length }} tracks</small>
                        </div>
                    </div>
                    <div class="pt-2">
                        <a class="search-link clickable" @click="openArtist(artist)">
                            <div class="d-inline-flex align-content-center align-items-center">
                                <img class="img-fluid figure-img rounded m-0" :src="get_artist_cover(artist.cover)"
                                    width="28" height="28">
                                <span class="purple-on-hover theme-color mx-2">{{ artist.title }}</span>
                            </div>
                        </a>
                    </div>
                    <hr />
                    <ul class="list-group">
                        <div v-for="track in tracks">
                            <li class="list-group-item rounded my-1 theme-btn text-light d-flex"
                                v-if="track.track_position == 1">
                                <div class="d-flex w-100 justify-content-between">
                                    <div>
                                        <span class="fw-bold">Disc {{ track.disc_number }}</span>
                                    </div>
                                </div>
                            </li>
                            <li class="list-group-item theme-list-item foreground-content clickable rounded d-flex p-1"
                                :class="{ 'now-playing': selected_track == track.id }"
                                @contextmenu.prevent="right_click({ item: track, event: $event })"
                                @click="play_track(track.id)">
                                <div class="d-flex w-100 justify-content-between">
                                    <div class="d-flex">
                                        <div class="d-flex align-items-center">
                                            <img :src="get_track_cover(album.cover)"
                                                class="track-cover theme-border rounded" @error="track_placeholder" />
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <button class="btn btn-link search-link d-flex text-start py-0"
                                                style="display:contents;">
                                                <span class="text-muted me-2">{{ track.track_position }}.</span>
                                                <span class="theme-color text-break">{{ track.title }}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </div>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 mx-3 mt-3" v-show="loaded">
        <div class="card-body px-3">
            <h5 class="theme-color fw-bold">Comments</h5>
            <div class="row g-3">
                <div class="input-group">
                    <textarea class="form-control search-card-input" aria-label="With textarea" rows="5" cols="33"
                        placeholder="Remember, be nice!"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button class="btn theme-btn black-on-hover text-white fw-bold" @click="post_comment">Post</button>
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
                            class="btn theme-btn black-on-hover text-white fw-bold" @click="load_more">Load more</button>
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
import { ref, watch, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '/js/store.js';
import { right_click, action } from '/js/events.js';

const router = useRouter();

// Federated
const domain = ref(null);
const album_id = ref(null);
const federated = ref(false);

const album = ref({});
const artist = ref({});
const tracks = ref([]);
const comments = ref([]);

const offset = ref(0);

const loaded = ref(false);
const searchFinished = ref(true);
const selected_track = ref(null);

const query_param = computed(() => {
    return router.currentRoute.value.params;
})

async function placeholder(obj) {
    obj.target.src = "/images/album.svg";
}

async function track_placeholder(obj) {
    obj.target.src = "/images/track.svg";
}

function get_genre(genre) {
    if (!genre) {
        return "Unknown";
    }
    return genre.toString()
}

async function openArtist(artist) {
    // Federated
    if (domain.value) {
        router.push(`/artist/${artist.id}@${domain.value}`)
        return
    }
    router.push(`/artist/${artist.id}`)
}

async function post_comment() {
    if (federated.value) {
        add_federated_comment();
        return;
    }
    add_comment();
}

async function add_comment() {
    let comment = document.querySelector("textarea").value;
    if (!comment.length) {
        return;
    }

    document.querySelector("textarea").value = "";

    let response = await ft.add_comment(ft.username, "album", album.value.id, album.value.uuid, comment);
    // if (response.hasOwnProperty('success')) {
    //     comments.value.unshift(response.comment);
    // }
}

async function add_federated_comment() {
    let comment = document.querySelector("textarea").value;
    if (!comment.length) {
        return;
    }

    document.querySelector("textarea").value = "";

    let response = await ft.add_federated_comment(domain.value, ft.username, "album", album.value.id, album.value.uuid, comment);
    // if (response.hasOwnProperty('success')) {
    //     comments.value.unshift(response.comment);
    // }
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

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/album.svg"
}

function get_track_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/track.svg"
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

// Must be synchronized in groupSession: ok
async function play_track(id) {
    // Federated
    if (domain.value) {
        action({
            func: async function op() {
                ft.playTrack(id, domain.value)
            },
            object: [id, domain.value],
            operation: "playTrack"
        })
        return
    }

    action({
        func: async function op() {
            ft.playTrack(id)
        },
        object: [id],
        operation: "playTrack"
    })
}

async function get_album(id) {
    let data = await ft.API(`/album/${id}`);
    if (!data || data.error) return;

    artist.value = data.artist;
    album.value = data.album;
    tracks.value = data.tracks;
    tracks.value.sort((a, b) => a.track_position - b.track_position);
    tracks.value.sort((a, b) => a.disc_number - b.disc_number);
    loaded.value = true;
}

async function get_federated_album(id) {
    let data = await ft.fAPI(domain.value, '/album/' + id);
    if (!data || data.error) {
        return;
    }

    artist.value = data.artist;
    artist.value.server = domain.value;

    album.value = data.album;
    album.value.server = domain.value;

    tracks.value = data.tracks;
    tracks.value.map(track => track.server = domain.value);
    tracks.value.sort((a, b) => a.track_position - b.track_position);
    tracks.value.sort((a, b) => a.disc_number - b.disc_number);
    loaded.value = true;
}

// Must be synchronized in groupSession: ok
async function play_album(id) {
    // Federated
    if (domain.value) {
        action({
            func: async function op() {
                ft.playAlbum(id, domain.value)
            },
            object: [id, domain.value],
            operation: "playAlbum"
        })
        return
    }

    action({
        func: async function op() {
            ft.playAlbum(id)
        },
        object: [id],
        operation: "playAlbum"
    })
}

async function get_comments(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/comments/album/${id}/${offset.value}`);
    if (!data || data.error) {
        return;
    }

    offset.value += data.comments.length;
    comments.value = comments.value.concat(data.comments);
    searchFinished.value = true;
}

async function get_federated_comments(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/comments/album/${id}/${offset.value}`);
    if (!data || data.error) {
        return;
    }

    offset.value += data.comments.length;
    comments.value = comments.value.concat(data.comments);
    searchFinished.value = true;
}

async function setup() {
    if (store.selected_track_id) {
        selected_track.value = store.selected_track_id;
        store.selected_track_id = null;
    }

    album_id.value = router.currentRoute.value.params.id;
    if (album_id.value.includes('@')) {
        [album_id.value, domain.value] = album_id.value.split('@');
        federated.value = true;
        get_federated_album(album_id.value);
        get_federated_comments(album_id.value);
        return
    }

    get_album(album_id.value);
    get_comments(album_id.value);
}

async function load_more() {
    if (federated.value) {
        get_federated_comments(album_id.value);
        return
    }
    get_comments(album_id.value);
}

watch(query_param, (params) => {
    if (store.selected_track_id) {
        selected_track.value = store.selected_track_id;
        store.selected_track_id = null;
    }
    if (params.id) {
        setup()
    }
})

onBeforeMount(() => {
    setup()
})
</script>