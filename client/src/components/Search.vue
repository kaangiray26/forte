<template>
    <ul class="list-group shadow-lg mx-4">
        <li class="list-group-item list-group-item-action d-flex justify-content-between" v-for="result in results"
            @contextmenu="right_click({ item: result, event: $event })">
            <div class="d-flex flex-fill align-items-center">
                <div class="ratio-1x1 me-2">
                    <img :src="result.cover" class="placeholder-img" width="56" height="56" />
                </div>
                <div class="d-flex flex-column">
                    <button class="btn btn-link search-link" :content_id="result.id" :content_type="result.type"
                        @click="openResult(result)" style="display:contents;">
                        {{ result.title }}
                    </button>
                    <span class="fst-italic text-capitalize text-muted">{{ result.type }}</span>
                </div>
            </div>
        </li>
    </ul>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { right_click } from '/js/events.js';

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
    let response = await ft.API('/search/' + query);
    if (!response) return;

    results.value = response.data;
}

async function openResult(result) {
    if (result.type == 'track') {
        ft.playTrack(result.id);
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