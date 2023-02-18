<template>
    <div class="h-100 vw-100 p-4">
        <nav class="bg-light rounded p-2">
            <div class="d-flex justify-content-between">
                <div class="d-flex flex-column">
                    <div class="d-flex align-items-center mb-2">
                        <a href="/" class="me-2">
                            <img src="/forte.svg" class="bg-dark rounded p-2" width="38" height="38">
                        </a>
                        <h3 class="fw-bold m-0">Forte Dashboard</h3>
                    </div>
                    <div class="d-flex bg-dark text-white px-2">
                        <span id="welcome">> Welcome back {{ username }}</span>
                    </div>
                </div>
                <div>
                    <button class="btn btn-dark text-nowrap" @click="log_off">Log off</button>
                </div>
            </div>
        </nav>
        <!-- Users collapse -->
        <div class="bg-light rounded p-2 mt-4">
            <button type="button" class="btn btn-dark w-100 text-start" data-bs-toggle="collapse"
                data-bs-target="#userCollapse">Users</button>
            <div class="collapse" id="userCollapse">
                <ul class="list-group mt-2">
                    <li v-if="!users.length">No users.</li>
                    <li class="list-group-item d-flex justify-content-end">
                        <button type="button" class="btn btn-dark" data-bs-toggle="modal"
                            data-bs-target="#addUserModal">Create</button>
                    </li>
                    <li v-for="user in users" class="d-flex justify-content-between align-items-center list-group-item">
                        <div class="d-flex flex-nowrap align-items-center">
                            <img :src="get_user_cover(user.cover)" class="img-profile rounded-5 m-2" width="48" height="48">
                            <span class="fw-bold text-decoration-underline">{{ user.username }}</span>
                        </div>
                        <button type="button" class="btn btn-dark" @click="get_confirm">Remove</button>
                        <button type="button" class="btn btn-danger visually-hidden"
                            @click="remove_user(user.username)">Confirm</button>
                    </li>
                </ul>
            </div>
        </div>
        <!-- Artists collapse -->
        <div class="bg-light rounded p-2 mt-1">
            <button type="button" class="btn btn-dark w-100 text-start" data-bs-toggle="collapse"
                data-bs-target="#artistCollapse">Artists</button>
            <div class="collapse" id="artistCollapse">
                <div class="input-group mt-2">
                    <span class="input-group-text bi bi-search" id="basic-addon1"></span>
                    <input id="artist_input" type="text" class="form-control" placeholder="Search"
                        aria-label="Artist search" aria-describedby="basic-addon1" @keyup.enter="search_artist">
                </div>
                <ul class="list-group mt-2">
                    <li v-if="!artist_results.length">No artists.</li>
                    <li v-for="artist in artist_results"
                        class="d-flex justify-content-between align-items-center list-group-item list-group-item-action clickable"
                        @click="open_artist(artist)">
                        <div class="d-flex flex-nowrap align-items-center">
                            <img :src="get_artist_cover(artist.cover)" class="img-profile rounded-5 m-2" width="48"
                                height="48">
                            <span class="fw-bold text-decoration-underline">{{ artist.title }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <!-- Album collapse -->
        <div class="bg-light rounded p-2 mt-1">
            <button type="button" class="btn btn-dark w-100 text-start" data-bs-toggle="collapse"
                data-bs-target="#albumCollapse">Albums</button>
            <div class="collapse" id="albumCollapse">
                <div class="input-group mt-2">
                    <span class="input-group-text bi bi-search" id="basic-addon2"></span>
                    <input id="album_input" type="text" class="form-control" placeholder="Search" aria-label="Album search"
                        aria-describedby="basic-addon2" @keyup.enter="search_album">
                </div>
                <ul class="list-group mt-2">
                    <li v-if="!album_results.length">No albums.</li>
                    <li v-for="album in album_results"
                        class="d-flex justify-content-between align-items-center list-group-item list-group-item-action clickable"
                        @click="open_album(album)">
                        <div class="d-flex flex-nowrap align-items-center">
                            <img :src="get_album_cover(album.cover)" class="img-profile rounded m-2" width="48" height="48">
                            <span class="fw-bold text-decoration-underline">{{ album.title }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <!-- Track collapse -->
        <div class="bg-light rounded p-2 mt-1">
            <button type="button" class="btn btn-dark w-100 text-start" data-bs-toggle="collapse"
                data-bs-target="#trackCollapse">Tracks</button>
            <div class="collapse" id="trackCollapse">
                <div class="input-group mt-2">
                    <span class="input-group-text bi bi-search" id="basic-addon3"></span>
                    <input id="track_input" type="text" class="form-control" placeholder="Search" aria-label="Track search"
                        aria-describedby="basic-addon3" @keyup.enter="search_track">
                </div>
                <ul class="list-group mt-2">
                    <li v-if="!track_results.length">No tracks.</li>
                    <li v-for="track in track_results"
                        class="d-flex justify-content-between align-items-center list-group-item list-group-item-action clickable"
                        @click="open_track(track)">
                        <div class="d-flex flex-nowrap align-items-center">
                            <img :src="get_track_cover(track.cover)" class="img-profile rounded m-2" width="48" height="48">
                            <span class="fw-bold text-decoration-underline">{{ track.title }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
    <!-- Add user modal -->
    <div id="addUserModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add a new user</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="card shadow-lg">
                    <div class="card-body">
                        <div class="input-group flex-nowrap">
                            <span class="input-group-text" id="addon-wrapping">@</span>
                            <input id="username" type="text" class="form-control" placeholder="Username"
                                aria-label="Username" aria-describedby="addon-wrapping" @keyup.enter="add_user">
                            <button class="btn btn-dark" @click="add_user">Add</button>
                        </div>
                        <div id="user_add_alert" class="alert alert-primary invisible mt-2" role="alert"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Artist modal -->
    <div id="artistModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Artist</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="card shadow-lg">
                    <div class="card-body" v-if="_artist">
                        <img id="artistCover" :src="get_artist_cover(_artist.cover)" class="card-img-top mb-2">
                        <div class="form-floating mb-2">
                            <input type="url" class="form-control" id="artistCoverInput" :value="_artist.cover"
                                @change="change_artist_cover">
                            <label for="artistCoverInput">Artist cover</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="text" class="form-control" id="artistTitleInput" :value="_artist.title">
                            <label for="artistTitleInput">Artist title</label>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button tpye="button" class="btn btn-dark" @click="save_artist">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Album modal -->
    <div id="albumModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Album</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="card shadow-lg">
                    <div class="card-body" v-if="_album">
                        <img id="albumCover" :src="get_album_cover(_album.cover)" class="card-img-top mb-2">
                        <div class="form-floating mb-2">
                            <input type="url" class="form-control" id="albumCoverInput" :value="_album.cover"
                                @change="change_album_cover">
                            <label for="albumCoverInput">Album cover</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="text" class="form-control" id="albumTitleInput" :value="_album.title">
                            <label for="albumTitleInput">Album title</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="date" class="form-control" id="albumDateInput" :value="_album.date.slice(0, 10)">
                            <label for="albumDateInput">Album date</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="number" class="form-control" id="albumYearInput" :value="_album.year">
                            <label for="albumYearInput">Album year</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="text" class="form-control" id="albumGenreInput" :value="_album.genre">
                            <label for="albumGenreInput">Album genre</label>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button tpye="button" class="btn btn-dark" @click="save_album">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Track modal -->
    <div id="trackModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Track</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="card shadow-lg">
                    <div class="card-body" v-if="_track">
                        <img id="trackCover" :src="get_track_cover(_track.cover)" class="card-img-top mb-2">
                        <div class="form-floating mb-2">
                            <input type="url" class="form-control" id="trackCoverInput" :value="_track.cover"
                                @change="change_track_cover">
                            <label for="trackCoverInput">Track cover</label>
                        </div>
                        <div class="form-floating mb-2">
                            <input type="text" class="form-control" id="trackTitleInput" :value="_track.title">
                            <label for="trackTitleInput">Track title</label>
                        </div>
                        <div class="d-flex justify-content-end">
                            <button tpye="button" class="btn btn-dark" @click="save_track">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Modal, Collapse } from 'bootstrap'
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const users = ref([]);
const modal = ref(null);

const _artist = ref(null);
const _album = ref(null);
const _track = ref(null);

const artist_modal = ref(null);
const album_modal = ref(null);
const track_modal = ref(null);

const artist_results = ref([]);
const album_results = ref([]);
const track_results = ref([]);

async function save_artist() {
    let cover = document.querySelector('#artistCoverInput');
    let title = document.querySelector('#artistTitleInput');

    let response = await fetch(`/artist/${_artist.value.id}`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: _artist.value.id,
            cover: cover.value,
            title: title.value
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        save_artist();
        artist_modal.value.hide();
    }
}

async function save_album() {
    let cover = document.querySelector('#albumCoverInput');
    let title = document.querySelector('#albumTitleInput');
    let date = document.querySelector('#albumDateInput');
    let year = document.querySelector('#albumYearInput');
    let genre = document.querySelector('#albumGenreInput');

    let response = await fetch(`/album/${_album.value.id}`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: _album.value.id,
            cover: cover.value,
            title: title.value,
            date: date.value,
            year: year.value,
            genre: genre.value
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        search_album();
        album_modal.value.hide();
    }
}

async function save_track() {
    let cover = document.querySelector('#trackCoverInput');
    let title = document.querySelector('#trackTitleInput');

    let response = await fetch(`/track/${_track.value.id}`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: _artist.value.id,
            cover: cover.value,
            title: title.value
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        search_track();
        track_modal.value.hide();
    }
}

async function change_artist_cover() {
    let cover = document.querySelector('#artistCoverInput');
    document.querySelector('#artistCover').src = cover.value;
}

async function change_album_cover() {
    let cover = document.querySelector('#albumCoverInput');
    document.querySelector('#albumCover').src = cover.value;
}

async function change_track_cover() {
    let cover = document.querySelector('#trackCoverInput');
    document.querySelector('#trackCover').src = cover.value;
}

async function open_artist(artist) {
    _artist.value = artist;
    artist_modal.value.show();
}

async function open_album(album) {
    _album.value = album;
    album_modal.value.show();
}

async function open_track(track) {
    _track.value = track;
    track_modal.value.show();
}

async function search_artist() {
    let query = document.querySelector('#artist_input');
    if (!query.value.length) {
        query.focus();
        return
    }

    let response = await fetch(`/search/artist/${query.value}`, {
        method: "GET"
    }).then((response) => {
        return response.json();
    })

    artist_results.value = response.data;
}

async function search_album() {
    let query = document.querySelector('#album_input');
    if (!query.value.length) {
        query.focus();
        return
    }

    let response = await fetch(`/search/album/${query.value}`, {
        method: "GET"
    }).then((response) => {
        return response.json();
    })
    album_results.value = response.data;
}

async function search_track() {
    let query = document.querySelector('#track_input');
    if (!query.value.length) {
        query.focus();
        return
    }

    let response = await fetch(`/search/track/${query.value}`, {
        method: "GET"
    }).then((response) => {
        return response.json();
    })

    track_results.value = response.data;
}

function get_user_cover(cover) {
    if (cover) {
        return `/${cover}`;
    } else {
        return "/default_profile.svg";
    }
}

function get_artist_cover(cover) {
    if (cover) {
        return cover;
    } else {
        return "/artist.svg";
    }
}

function get_album_cover(cover) {
    if (cover) {
        return cover;
    } else {
        return "/album.svg";
    }
}

function get_track_cover(cover) {
    if (cover) {
        return cover;
    } else {
        return "/track.svg";
    }
}

async function get_confirm(event) {
    event.target.classList.add('visually-hidden');
    event.target.nextElementSibling.classList.remove('visually-hidden');
}

async function get_users() {
    let data = await fetch("/get_users", {
        method: "GET"
    }).then((response) => {
        return response.json();
    })

    users.value = data.users;
}

async function log_off() {
    sessionStorage.clear();
    fetch("/log_off", {
        method: "GET"
    }).then(() => {
        router.push("/");
    })
}

async function add_user() {
    let username = document.querySelector('#username');
    if (!username.value.length) {
        username.focus();
        return;
    }

    let response = await fetch("/add_user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username.value
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        get_users();
        modal.value.hide();
    }
}

async function remove_user(username) {
    let response = await fetch("/remove_user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        get_users();
    }
}

onMounted(() => {
    username.value = sessionStorage.getItem('username');
    get_users();

    // Add user modal

    let modal_el = document.querySelector('#addUserModal');
    modal.value = new Modal(modal_el, {
        keyboard: false,
        backdrop: 'static'
    });

    modal_el.addEventListener('shown.bs.modal', (event) => {
        document.querySelector('#username').focus();
    })

    modal_el.addEventListener('hidden.bs.modal', (event) => {
        get_users();
    })

    // Artist modal
    artist_modal.value = new Modal(document.querySelector('#artistModal'), {
        keyboard: false,
        backdrop: 'static'
    });

    // Album modal
    album_modal.value = new Modal(document.querySelector('#albumModal'), {
        keyboard: false,
        backdrop: 'static'
    });

    // Track modal
    track_modal.value = new Modal(document.querySelector('#trackModal'), {
        keyboard: false,
        backdrop: 'static'
    });
})

</script>