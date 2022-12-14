<template>
    <ul class="list-group">
        <li class="list-group-item" v-for="result in results">{{ result }}</li>
    </ul>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { API } from '/js/api.js';

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

watch(query_param, () => {
    get_search_results();
})

onMounted(() => {
    get_search_results();
})
</script>