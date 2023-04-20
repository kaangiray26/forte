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
                    <div class="d-inline-flex position-relative"
                        @contextmenu.prevent="right_click({ item: playlist, event: $event })">
                        <img class="playlist-img shadow rounded" :src="get_cover(playlist.cover)" @error="placeholder" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_playlist(playlist.id)">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col theme-color">
                    <div class="d-flex flex-column">
                        <h1 class="album-title">{{ playlist.title }}</h1>
                        <small class="text-muted">{{ tracks.length }} tracks</small>
                    </div>
                    <div class="pt-2">
                        <router-link :to="'/user/' + playlist.author" class="search-link">
                            <div class="d-inline-flex align-content-center align-items-center">
                                <span class="purple-on-hover theme-color">{{ playlist.author }}</span>
                            </div>
                        </router-link>
                    </div>
                    <hr />
                    <ul class="list-group">
                        <li class="list-group-item rounded mb-1 theme-btn text-light d-flex">
                            <div class="d-flex w-100 justify-content-between">
                                <div>
                                    <span class="fw-bold">Playlist</span>
                                </div>
                            </div>
                        </li>
                        <li v-for="(track, index) in tracks"
                            class="list-group-item theme-list-item foreground-content clickable rounded d-flex p-1"
                            @contextmenu.prevent="right_click({ item: track, event: $event })">
                            <div class="d-flex w-100 justify-content-between" @click="play_track(track)">
                                <div class="d-flex">
                                    <div class="d-flex align-items-start">
                                        <img :src="get_track_cover(track.cover)" class="track-cover theme-border rounded"
                                            @error="track_placeholder" />
                                    </div>
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-link search-link d-flex text-start py-0"
                                            style="display:contents;">
                                            <span class="text-muted me-2">{{ index + 1 }}.</span>
                                            <span class="theme-color text-break">{{ track.title }}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div v-show="isAuthor">
                                <div class="d-flex h-100 align-items-center">
                                    <button class="btn btn-light action-btn bi bi-three-dots m-0 me-3" type="button"
                                        data-bs-toggle="dropdown">
                                        <ul class="dropdown-menu shadow-lg context-menu">
                                            <li>
                                                <button class="dropdown-item" type="button"
                                                    @click="delete_track_from_playlist(index)">
                                                    <span class="bi bi-trash-fill me-1"></span>Delete
                                                    track</button>
                                            </li>
                                        </ul>
                                    </button>
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
                    <textarea class="form-control search-card-input" aria-label="With textarea" rows="5" cols="33"
                        placeholder="Remember, be nice!"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button class="btn theme-btn black-on-hover text-white fw-bold" @click="post_comment">Post</button>
                </div>
                <div>
                    <ul class="list-group list-group-flush mb-3">
                        <li class="list-group-item foreground-content theme-comment-item p-1" v-for="comment in comments">
                            <div class="d-flex flex-column mx-2 py-1">
                                <div class="d-flex justify-content-between align-items-center">
                                    <router-link :to="'/user/' + comment.author"
                                        class="theme-color purple-on-hover fw-bold">{{
                                            comment.author
                                        }}</router-link>
                                    <span class="text-muted timestamp">{{ format_date(comment.created_at)
                                    }}</span>
                                </div>
                                <p class="theme-color mb-0">{{ comment.content }}</p>
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
import { right_click, action } from '/js/events.js';

const router = useRouter();

// Federated
const domain = ref(null);
const playlist_id = ref(null);
const federated = ref(false);

const tracks = ref([]);
const playlist = ref({})
const comments = ref([]);
const offset = ref(0);

const loaded = ref(false);
const searchFinished = ref(true);

const isAuthor = ref(false);

const query_param = computed(() => {
    return router.currentRoute.value.params;
})

function get_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }
    return "/images/cassette.svg"
}

function get_track_cover(cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return over;
        }
        return ft.server + '/' + cover;
    }
    return "/images/track.svg"
}

async function placeholder(obj) {
    obj.target.src = "/images/cassette.svg";
}

async function track_placeholder(obj) {
    obj.target.src = "/images/track.svg";
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

    let response = await ft.add_comment(ft.username, "playlist", playlist.value.id, playlist.value.uuid, comment);
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

    let response = await ft.add_federated_comment(domain.value, ft.username, "playlist", playlist.value.id, playlist.value.uuid, comment);
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

async function get_comments(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/comments/playlist/${id}/${offset.value}`);
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

    let data = await ft.fAPI(domain.value, `/comments/playlist/${id}/${offset.value}`);
    if (!data || data.error) {
        return;
    }

    offset.value += data.comments.length;
    comments.value = comments.value.concat(data.comments);
    searchFinished.value = true;
}

async function delete_track_from_playlist(index) {
    await ft.deleteTrackFromPlaylist(playlist.value.id, index);
    setup();
}

// Must be synchronized in groupSession: ok
async function play_track(track) {
    // Federated
    if (track.server) {
        action({
            func: async function op() {
                ft.playTrack(track.id, track.server)
            },
            object: [track.id, track.server],
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

async function get_federated_tracks(track_ids, order) {
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
                tracks.value[i] = found_tracks[0];
            }
        }
    }
}

async function get_playlist(id) {
    let data = await ft.API(`/playlist/${id}`);
    if (!data || data.error) return;

    playlist.value = data.playlist;

    // Push track placeholders
    tracks.value = [];
    for (let i = 0; i < data.playlist.tracks.length; i++) {
        tracks.value.push({});
    }

    // Get federated tracks
    get_federated_tracks(data.federated, data.playlist.tracks);

    // Get local tracks
    for (let i = 0; i < data.playlist.tracks.length; i++) {
        let track_id = data.playlist.tracks[i];
        let tracks_found = data.tracks.filter(t => t.id == track_id);
        if (tracks_found.length) {
            tracks.value[i] = tracks_found[0];
        }
    }

    if (JSON.parse(localStorage.getItem('username')) == playlist.value.author) {
        isAuthor.value = true;
    }

    loaded.value = true;
}

// Must be synchronized in groupSession: ok
async function play_playlist(id) {
    // Federated
    if (domain.value) {
        action({
            func: async function op() {
                ft.playPlaylist(id, domain.value)
            },
            object: [id, domain.value],
            operation: "playAlbum"
        })
        return
    }

    action({
        func: async function op() {
            ft.playPlaylist(id)
        },
        object: [id],
        operation: "playPlaylist"
    })
}

async function get_federated_playlist(id) {
    let data = await ft.fAPI(domain.value, '/playlist/' + id);
    if (!data || data.error) {
        return;
    }

    playlist.value = data.playlist;
    playlist.value.server = domain.value;

    // Push track placeholders
    for (let i = 0; i < data.playlist.tracks.length; i++) {
        tracks.value.push({});
    }

    // Get federated tracks
    get_federated_tracks(data.federated, data.playlist.tracks);

    // Get local tracks
    data.tracks.map(track => track.server = domain.value);
    for (let i = 0; i < data.playlist.tracks.length; i++) {
        let track_id = data.playlist.tracks[i];
        let tracks_found = data.tracks.filter(t => t.id == track_id);
        if (tracks_found.length) {
            tracks.value[i] = tracks_found[0];
        }
    }

    loaded.value = true;
}

async function setup() {
    playlist_id.value = router.currentRoute.value.params.id;
    if (playlist_id.value.includes('@')) {
        [playlist_id.value, domain.value] = playlist_id.value.split('@');
        federated.value = true;
        get_federated_playlist(playlist_id.value);
        get_federated_comments(playlist_id.value);
        return
    }

    get_playlist(playlist_id.value);
    get_comments(playlist_id.value);
}

async function load_more() {
    if (federated.value) {
        get_federated_comments(playlist_id.value);
        return
    }
    get_comments(playlist_id.value);
}

watch(query_param, (params) => {
    if (params.id) {
        setup();
    }
})

onBeforeMount(() => {
    setup()
})
</script>