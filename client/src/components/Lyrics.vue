<template>
    <div id="lyricsModal" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5 fw-bold">Lyrics</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div v-show="!loaded">
                        <div class="d-flex justify-content-center text-dark p-2">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                    <div v-show="error">
                        <div class="d-flex justify-content-center text-dark p-2">
                            <h1 class="fs-5 fw-bold">Lyrics not found</h1>
                        </div>
                    </div>
                    <div v-show="loaded" class="lyrics">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import { store } from '/js/store.js';

const modal = ref(null);
const track_id = ref(null);
const loaded = ref(false);
const error = ref(false);

async function _get_lyrics() {
    _show();

    if (store.playing.id == track_id.value) {
        loaded.value = true;
        return
    }

    loaded.value = false;
    error.value = false;

    let response = await ft.lyrics(store.playing.artist, store.playing.title);

    if (response.hasOwnProperty('error')) {
        document.querySelector(".lyrics").innerHTML = '';
        track_id.value = store.playing.id;
        error.value = true;
        loaded.value = true;
        return
    }

    track_id.value = store.playing.id;
    let parser = new DOMParser();
    let doc = parser.parseFromString(response.lyrics, "text/html");
    let lyrics = doc.querySelector('#lyrics-root');

    if (!lyrics) {
        document.querySelector(".lyrics").innerHTML = '';
        error.value = true;
        loaded.value = true;
        return
    }

    document.querySelector(".lyrics").innerHTML = lyrics.childNodes[2].innerHTML;
    loaded.value = true;
}

function _show() {
    modal.value.show();
}

function _hide() {
    modal.value.hide();
}

defineExpose({
    get_lyrics: _get_lyrics
})

onMounted(() => {
    modal.value = new Modal(document.querySelector('#lyricsModal'));
});
</script>