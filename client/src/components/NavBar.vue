<template>
    <nav class="card mx-3 mt-3 rounded-0 border-0">
        <div class="card-body p-3">
            <div class="d-flex flex-column">
                <div class="d-inline-flex input-group flex-nowrap">
                    <input ref="search_field" type="text" class="form-control search-card-input" placeholder="Search"
                        aria-label="Search" @input="search" @keyup.enter="search">
                </div>
                <div class="hide-on-desktop mt-3">
                    <ul class="nav nav-pills nav-justified">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active theme-btn text-white': path == '/', 'theme-color': path != '/' }">
                                <span class="fs-5">Home</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/artists" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active theme-btn text-white': path == '/artists', 'theme-color': path != '/artists' }">
                                <span class="fs-5">Artists</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/albums" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active theme-btn text-white': path == '/albums', 'theme-color': path != '/albums' }">
                                <span class="fs-5">Albums</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/profile" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active theme-btn text-white': path == '/profile', 'theme-color': path != '/profile' }">
                                <span class="fs-5">Profile</span>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router'

const router = useRouter();
const search_field = ref(null);

const path = computed(() => {
    return router.currentRoute.value.path;
})

async function focus_search() {
    search_field.value.focus();
}

async function search(event) {
    event.preventDefault();
    let query = search_field.value.value;
    if (!query.length) {
        search_field.value.focus();
        return;
    }
    router.push('/search/' + query);
}

defineExpose({
    focus_search,
})
</script>