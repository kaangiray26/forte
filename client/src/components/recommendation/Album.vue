<template>
    <div class="card h-100 w-100 border-0 shadow-lg">
        <div class="p-3">
            <div class="position-relative mb-2">
                <img class="card-img-top img-fluid rounded placeholder-img" :src="props.album.cover" height="250"
                    width="250" />
                <div class="position-absolute bottom-0 right-0">
                    <button class="btn btn-light bi bi-play shadow m-2" type="button" style="opacity: 0.90;"
                        @click="play(props.album.id)">
                    </button>
                </div>
            </div>
            <div class="d-flex flex-fill">
                <h6 class="fw-bold text-break text-wrap clickable search-link p-2 ps-0" @click="openAlbum">{{
                        album.title
                }}</h6>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

async function openAlbum() {
    router.push("/album/" + props.album.id);
}

async function play(id) {
    ft.playAlbum(id);
}

const props = defineProps({
    album: {
        type: Object,
    }
});
</script>