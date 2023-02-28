<template>
    <div class="card border-0 p-0" @contextmenu.prevent="right_click({ item: props.track, event: $event })">
        <div class="card-body border-0">
            <div class="clickable-shadow" @click="openTrack">
                <img class="carousel-img" :src="get_cover(props.track.cover)" width="250" height="250" />
            </div>
            <div class="mt-2">
                <h6 class="fw-bold clickable search-link" @click="openTrack">{{ track.title }}</h6>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { store } from '/js/store.js';
import { right_click } from '/js/events.js';

const router = useRouter();

function get_cover(cover) {
    if (!cover) {
        return "/images/track.svg"
    }

    if (cover.startsWith("http")) {
        return cover;
    }

    return ft.server + '/' + cover;
}

async function openTrack() {
    store.selected_track_id = props.track.id;
    router.push("/album/" + props.track.album);
}

const props = defineProps({
    track: {
        type: Object,
    }
});
</script>