<template>
    <div id="playlistCreate" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="d-flex justify-content-end p-4 pb-2">
                    <button type="button" class="btn-close" @click="_hide" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <div class="d-flex justify-content-center pb-2">
                        <h3 class="fw-bold">Create playlist</h3>
                    </div>
                    <div class="container">
                        <div class="row row-cols-1 row-cols-md-2">
                            <div class="col">
                                <figure class="figure position-relative">
                                    <img ref="playlist_cover" src="/images/playlist.png"
                                        class="figure-img img-fluid rounded">
                                    <div class="position-absolute bottom-0 right-0">
                                        <button class="btn btn-light bi bi-pencil-square shadow m-2" type="button"
                                            style="opacity: 0.90;" @click="add_cover">
                                        </button>
                                    </div>
                                    <input ref="cover_upload" type="file" class="visually-hidden"
                                        @change="handle_cover" />
                                </figure>
                            </div>
                            <div class="col d-flex flex-column justify-content-between">
                                <div class="form-floating mb-3">
                                    <input ref="playlist_name" type="text" class="form-control" id="floatingInput">
                                    <label for="floatingInput">Playlist name</label>
                                </div>
                                <div class="d-flex justify-content-end mb-3">
                                    <button class="btn btn-dark" @click="create_playlist">Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import { useRouter } from 'vue-router';

const router = useRouter();

const modal = ref(null);
const cover = ref(null);
const cover_upload = ref(null);

const playlist_name = ref(null);
const playlist_cover = ref(null);

async function create_playlist() {
    if (!playlist_name.value.value) {
        playlist_name.value.focus();
        return;
    }

    let formData = new FormData();
    formData.append("title", playlist_name.value.value);

    if (cover.value) {
        formData.append("cover", cover.value);
    }

    let response = await ft.create_playlist(formData);
    if (response.hasOwnProperty('playlist_id')) {
        router.push(`/playlist/${response.playlist_id}`);
    }
}

async function add_cover() {
    cover_upload.value.click();
}

async function handle_cover() {
    let file = cover_upload.value.files[0];

    if (!file || !file.type.startsWith('image/')) {
        return;
    }
    cover.value = file;
    playlist_cover.value.src = URL.createObjectURL(cover.value);
}

function _show() {
    modal.value.show();
}

function _hide() {
    modal.value.hide();
}

defineExpose({
    show: _show,
    hide: _hide
})

onMounted(() => {
    modal.value = new Modal(document.querySelector('#playlistCreate'))
})
</script>