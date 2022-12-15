<template>
    <ul class="list-group shadow-lg mx-4">
        <li class="list-group-item list-group-item-action d-flex justify-content-between" v-for="result in results">
            <div class="d-flex">
                <div class="ratio-1x1">
                    <img :src="result.cover" class="img-fluid placeholder-img" width="56" height="56" />
                    <button class="btn btn-link search-link" :content_id="result.id" :content_type="result.type"
                        @click="openResult(result)">{{ result.title }}</button>
                </div>
            </div>
            <span>{{ result.type }}</span>
        </li>
    </ul>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { API, playTrack } from '/js/api.js';

const router = useRouter();
const results = ref([]);

const query_param = computed(() => {
    return router.currentRoute.value.params.query;
})

async function get_search_results() {
    let query = router.currentRoute.value.params.query;
    if (!query) {
        router.push('/');
    }
    let response = await API('/search/' + query);
    results.value = response.data;
}

async function openResult(result) {
    if (result.type == 'track') {
        playTrack(result);
        return;
    }
    router.push("/" + result.type + "/" + result.id);
}

watch(query_param, () => {
    get_search_results();
})

onMounted(() => {
    get_search_results();
})
</script>