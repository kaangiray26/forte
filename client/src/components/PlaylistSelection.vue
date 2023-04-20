<template>
    <div id="playlistSelection" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content theme-bg theme-border">
                <div class="d-flex justify-content-end p-3 pb-2">
                    <button type="button" class="btn-close theme-filter" @click="_hide" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <div class="d-flex justify-content-center pb-2">
                        <h3 class="theme-color fw-bold">Add to playlist</h3>
                    </div>
                    <ul class="list-group">
                        <li v-for="playlist in playlists"
                            class="list-group-item theme-list-item foreground-content clickable rounded d-flex p-1"
                            @click="add_to_playlist(playlist.id)">
                            <div class="d-flex flex-fill align-items-center">
                                <img :src="get_cover(playlist.cover)" class="playlist-selection-img me-2"
                                    @error="placeholder">
                                <div class="d-flex flex-column">
                                    <span class="theme-color fw-bold">{{ playlist.title }}</span>
                                    <span class="fst-italic text-muted">{{ playlist.author }}</span>
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
import { Modal } from 'bootstrap';
import { notify } from "/js/events.js";

const modal = ref(null);
const track_id = ref(null);
const playlists = ref([]);

function get_cover(cover) {
    if (cover) {
        return ft.server + '/' + cover;
    }
    return "/images/cassette.svg"
}

async function placeholder(obj) {
    obj.target.src = "/images/cassette.svg";
}

async function add_to_playlist(playlist_id) {
    // Federated
    if (String(track_id.value).includes('@')) {
        let server = track_id.value.split('@')[1];
        ft.addTrackToPlaylist(track_id.value, playlist_id, server).then((response) => {
            if (response.hasOwnProperty("success")) {
                _hide();
                notify({
                    "title": "Added to playlist.",
                })
            }
        })
        return
    }

    ft.addTrackToPlaylist(track_id.value, playlist_id).then((response) => {
        if (response.hasOwnProperty("success")) {
            _hide();
            notify({
                "title": "Added to playlist.",
            })
        }
    })
}

async function get_playlists() {
    let data = await ft.API(`/author/${ft.username}/playlists`);
    if (!data) return;

    playlists.value = data.playlists;
}

function _show(id) {
    get_playlists();
    track_id.value = id;
    modal.value.show();
}

function _hide() {
    modal.value.hide();
}

defineExpose({
    show: _show,
    hide: _hide
});

onMounted(() => {
    modal.value = new Modal(document.querySelector('#playlistSelection'));
});
</script>