<template>
    <ul class="list-group rounded-0 mx-3 px-3 pb-3 theme-background">
        <li v-if="results.length == 0" class="list-group-item theme-btn text-light d-flex">
            <div class="d-flex w-100 justify-content-between">
                <div>
                    <span class="fw-bold">No results</span>
                </div>
            </div>
        </li>
        <li class="list-group-item theme-list-item foreground-content clickable rounded d-flex p-1"
            v-for="result in results" @contextmenu.prevent="right_click({ item: result, event: $event })"
            @click="openResult(result)">
            <div class="d-flex w-100 justify-content-between">
                <div class="d-flex">
                    <div class="d-flex align-items-center">
                        <img :src="get_cover(result.type, result.cover)" class="track-cover theme-border rounded"
                            :type="result.type" @error="placeholder" />
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="d-flex flex-column">
                            <button class="btn btn-link search-link d-flex text-start py-0" :content_id="result.id"
                                :content_type="result.type" style="display:contents;">
                                <span class="theme-color text-break fw-bold"
                                    :class="{ 'text-decoration-underline': result.server }">{{
                                        result.title }}</span>
                            </button>
                            <div class="btn btn-link d-flex text-start align-items-center py-0">
                                <span class="badge" :class="result.type">{{ result.type }}</span>
                            </div>
                        </div>
                    </div>
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

async function placeholder(obj) {
    switch (obj.target.attributes["type"].value) {
        case 'user':
            obj.target.src = "/images/default_profile.svg";
            break;
        case 'track':
            obj.target.src = "/images/track.svg";
            break;
        case 'album':
            obj.target.src = "/images/album.svg";
            break;
        case 'artist':
            obj.target.src = "/images/artist.svg";
            break;
        case 'playlist':
            obj.target.src = "/images/cassette.svg";
            break;
    }
}

function get_cover(type, cover) {
    if (cover) {
        if (cover.startsWith('http')) {
            return cover;
        }
        return ft.server + '/' + cover;
    }

    switch (type) {
        case 'user':
            return "/images/default_profile.svg";
        case 'track':
            return "/images/track.svg";
        case 'album':
            return "/images/album.svg";
        case 'artist':
            return "/images/artist.svg";
        case 'playlist':
            return "/images/cassette.svg";
    }
}

async function get_search_results() {
    let query = router.currentRoute.value.params.query;
    if (!query) {
        router.push('/');
    }
    let response = await ft.API('/search/' + query);
    if (!response) return;

    results.value = response.data;
}

async function get_federated_search_results() {
    let query = router.currentRoute.value.params.query;
    if (!query) {
        router.push('/');
    }

    // Get federated servers
    let federated_servers = JSON.parse(localStorage.getItem('federated_servers'));

    // Iterate through federated servers
    for (let i = 0; i < federated_servers.length; i++) {
        let server = federated_servers[i];
        let response = await ft.fAPI(server, '/search/' + query);
        if (!response) return;


        // Add federated server results to results
        response.data.forEach(result => {
            result.server = server;
            results.value.push(result);
            // if (!results.value.filter(r => r.uuid == result.uuid).length) {
            //     results.value.push(result);
            // }
        });
    }
}

async function openResult(result) {
    let server = null;
    let id = result.id;
    let oid = result.id;
    let title = result.title;

    // Federated result
    if (result.server) {
        server = result.server;
        oid = result.id + `@${result.server}`;
        title = result.title + `@${result.server}`;
    }

    if (result.type == 'track') {
        ft.playTrack(id, server);
        return;
    }

    if (result.type == 'user') {
        router.push("/user/" + title);
        return;
    }

    router.push("/" + result.type + "/" + oid);
}

watch(query_param, () => {
    if (!router.currentRoute.value.params.query) return;
    get_search_results();
    get_federated_search_results();
})

onMounted(() => {
    get_search_results();
    get_federated_search_results();
})
</script>