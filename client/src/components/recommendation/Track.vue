<template>
    <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: props.track, event: $event })">
        <div class="p-3">
            <div class="position-relative clickable-shadow" @click="openTrack">
                <img class="img-fluid placeholder-img" :src="get_cover(props.track.cover)" height="250" width="250" />
                <div class="position-absolute bottom-0 right-0">
                    <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                        @click="play(props.track.id)">
                    </button>
                </div>
            </div>
            <div class="d-flex flex-fill">
                <h6 class="fw-bold text-break text-wrap clickable search-link p-2 ps-0" @click="openTrack">{{
                    track.title
                }}</h6>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { store } from '../../js/store';
import { right_click } from '/js/events.js';

const router = useRouter();

function get_cover(cover) {
    if (cover) {
        return cover;
    }
    return "/images/playlist.png"
}

async function openTrack() {
    store.selected_track_id = props.track.id;
    router.push("/album/" + props.track.album);
}

async function play(id) {
    ft.playTrack(id);
}

const props = defineProps({
    track: {
        type: Object,
    }
});
</script>