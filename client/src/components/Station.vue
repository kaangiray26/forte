<template>
    <div v-show="!loaded">
        <div class="d-flex justify-content-center text-dark p-2">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
    <div class="card border-0 mx-4 shadow-lg" v-show="loaded">
        <div class="card-body">
            <div class="row g-4">
                <div class="col">
                    <div class="col-12">
                        <iframe class="w-100" :src="'https://gemini.tunein.com/embed/player/' + station.id"></iframe>
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

async function get_station(id) {
    station.value.id = id;
    station.value.cover = `https://cdn-profiles.tunein.com/${id}/images/logoq.jpg`;
    loaded.value = true;
}

onMounted(() => {
    get_station(router.currentRoute.value.params.id);
})
</script>