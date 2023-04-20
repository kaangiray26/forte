<template>
    <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: props.playlist, event: $event })">
        <div class="p-3">
            <div class="d-inline-flex position-relative">
                <div class="d-inline-flex clickable-shadow rounded" @click="openPlaylist">
                    <img class="img-profile rounded" :src="get_cover(props.playlist.cover)" @error="placeholder"
                        height="250" width="250" />
                </div>
                <div class="position-absolute bottom-0 right-0 m-2">
                    <button class="btn btn-light action-btn bi bi-play-fill" type="button" @click="play(props.playlist.id)">
                    </button>
                </div>
            </div>
            <div class="d-flex flex-fill">
                <h6 class="theme-color purple-on-hover fw-bold text-break text-wrap clickable p-2 ps-0"
                    @click="openPlaylist">
                    {{
                        props.playlist.title
                    }}</h6>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { right_click, action } from '/js/events.js';

const router = useRouter();

async function placeholder(obj) {
    obj.target.src = "/images/cassette.svg";
}

function get_cover(cover) {
    if (!cover) {
        return "/images/cassette.svg"
    }

    if (cover.startsWith("http")) {
        return cover;
    }

    return ft.server + '/' + cover;
}

async function openPlaylist() {
    router.push("/playlist/" + props.playlist.id);
}

// Must be synchronized in groupSession: ok
async function play(id) {
    action({
        func: async function op() {
            ft.playPlaylist(id);
        },
        object: [id],
        operation: "playPlaylist",
    })
}

const props = defineProps({
    playlist: {
        type: Object,
    }
});
</script>