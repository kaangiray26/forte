<template>
    <div id="playlistSelection" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="d-flex justify-content-end p-4 pb-2">
                    <button type="button" class="btn-close" @click="_hide" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <div class="d-flex justify-content-center pb-2">
                        <h3 class="fw-bold">Add to playlist</h3>
                    </div>
                    <ul class="list-group">
                        <li v-for="playlist in playlists" class="list-group-item list-group-item-action clickable"
                            @click="add_to_playlist(playlist.id)">
                            <div class="d-flex flex-fill align-items-center">
                                <img :src="get_cover(playlist.cover)" class="playlist-selection-img me-2">
                                <div class="d-flex flex-column">
                                    <span class="fw-bold">{{ playlist.title }}</span>
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
    return "/images/playlist.png"
}

async function add_to_playlist(playlist_id) {
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
    let data = await ft.API('/profile/playlists');
    playlists.value = data.playlists;
}

function _show(id) {
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
    get_playlists();
});
</script>