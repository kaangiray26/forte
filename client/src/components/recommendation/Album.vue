<template>
    <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: props.album, event: $event })">
        <div class="p-3">
            <div class="position-relative clickable-shadow">
                <div @click="openAlbum">
                    <img class="img-fluid placeholder-img" :src="get_cover(props.album.cover)" height="250" width="250" />
                </div>
                <div class="position-absolute bottom-0 right-0">
                    <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                        @click="play(props.album.id)">
                    </button>
                </div>
            </div>
            <div class="d-flex flex-fill">
                <h6 class="theme-color red-on-hover fw-bold text-break text-wrap clickable p-2 ps-0" @click="openAlbum">{{
                    props.album.title
                }}</h6>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

function get_cover(cover) {
    if (!cover) {
        return "/images/album.svg"
    }

    if (cover.startsWith("http")) {
        return cover;
    }

    return ft.server + '/' + cover;
}

async function openAlbum() {
    router.push("/album/" + props.album.id);
}

// Must be synchronized in groupSession: ok
async function play(id) {
    action({
        func: async function op() {
            ft.playAlbum(id);
        },
        object: id,
        operation: "playAlbum",
    })
}

const props = defineProps({
    album: {
        type: Object,
    }
});
</script>