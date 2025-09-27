<template>
    <div id="lyricsModal" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content theme-bg theme-border">
                <div class="modal-header border-bottom-0 pb-0">
                    <h1 class="modal-title fs-5 theme-color fw-bold">{{ store.playing.title }}</h1>
                    <button type="button" class="btn-close theme-filter" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body pt-0">
                    <hr>
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
                    <div v-show="loaded" class="lyrics theme-color" />
                    <hr>
                    <div v-show="loaded">
                        <a class="theme-color fw-bold" :href=url target="_blank">Source</a>
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
import { notify } from '/js/events.js';

const url = ref(null);
const modal = ref(null);
const track_id = ref(null);
const lyrics_id = ref(null);
const loaded = ref(false);
const error = ref(false);

async function _get_lyrics(preload = false) {
    if (!store.playing.loaded) return;
    if (store.playing.type != 'track') {
        notify({
            "title": "Can't get lyrics for this item.",
        })
        return
    }

    if (!preload) {
        _show();
        return
    }

    error.value = false;

    if (store.playing.id == track_id.value) {
        loaded.value = true;
        return
    }

    loaded.value = false;
    error.value = false;

    // Get the lyrics
    let artist_id = store.playing.artist;
    let title = store.playing.title;
    let server = null;

    if (store.playing.server) {
        server = store.playing.server;
        artist_id = `${store.playing.artist}@${store.playing.server}`;
    }

    let response = await ft.lyrics(artist_id, title, server);
    if (!response || response.error) {
        document.querySelector(".lyrics").innerHTML = '';
        track_id.value = store.playing.id;
        error.value = true;
        loaded.value = true;
        return
    }

    url.value = response.url;
    lyrics_id.value = response.id;

    let lyrics = await fetch(`https://genius.com/songs/${lyrics_id.value}/embed.js`)
        .then(res => res.text());

    let div = document.createElement('div');
    div.innerHTML = eval(lyrics.match(/JSON\.parse\('(.*)'\)/)[0]);

    try {
        div.querySelector(".rg_embed_header").remove();
        div.querySelector(".rg_embed_footer").remove();
        div.querySelector(`#rg_embed_analytics_${lyrics_id.value}`).remove();
    } catch (e) {
        console.info(e);
    }

    document.querySelector(".lyrics").innerHTML = div.innerHTML;
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
    window.addEventListener('lyrics', event => {
        _get_lyrics(true);
    });
});
</script>