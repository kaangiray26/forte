<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 m-3" v-show="loaded">
        <div class="card-body px-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="d-flex position-relative">
                        <div class="ph rounded">
                            <img class="playlist-img shadow rounded" :src="station.logo" @error="placeholder" />
                        </div>
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light action-btn bi bi-play-fill m-2" type="button"
                                @click="play_station()">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col theme-color">
                    <div class="d-flex flex-column">
                        <h1 class="album-title">{{ station.name }}</h1>
                        <small class="text-muted">{{ station.slogan }}</small>
                    </div>
                    <div class="pt-2">
                        <div class="d-flex flex-wrap">
                            <div class="m-1">
                                <button ref="wiki_btn" type="button" class="btn theme-btn black-on-hover text-white fw-bold"
                                    @click="get_website">Website</button>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div>
                        <p>{{ station.description }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

const station = ref({});
const loaded = ref(false);

async function placeholder(obj) {
    obj.target.src = "/images/station.svg";
}

async function get_website() {
    window.open(station.value.url, "_blank")
}

async function play_station() {
    ft.playStation({
        guide_id: station.value.guide_id,
        text: station.value.name,
        image: station.value.logo,
    });
}

async function get_station(id) {
    // Get station info
    let data = await ft.API("/station/" + id);
    if (!data || data.error) {
        return;
    }

    station.value = data.station;
    loaded.value = true;
}

onMounted(() => {
    get_station(router.currentRoute.value.params.id);
})
</script>