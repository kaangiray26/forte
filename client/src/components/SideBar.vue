<template>
    <div class="d-flex flex-column flex-shrink-1 p-2">
        <router-link to="/" class="text-decoration-none text-black p-3">
            <div class="d-flex justify-content-center">
                <div class="d-flex align-items-center">
                    <div class="me-1">
                        <img v-if="store.theme == 'light'" src="/images/favicon.svg" width="32" height="32">
                        <img v-if="store.theme == 'dark'" src="/images/favicon_dark.svg" width="32" height="32">
                    </div>
                    <div>
                        <h3 class="side-bar-text fw-bold m-0">Forte</h3>
                    </div>
                </div>
            </div>
        </router-link>
        <ul class="nav nav-pills flex-column">
            <li class="nav-item mb-2">
                <router-link to="/" class="nav-link side-bar-text fw-bold" aria-current="page">
                    <span class="fs-5 bi me-1"
                        :class="{ 'bi-house-door-fill': path == '/', 'bi-house-door': path != '/' }"></span>
                    <span class="fs-5">Home</span>
                </router-link>
            </li>
            <li class="nav-item mb-2">
                <router-link to="/artists" class="nav-link side-bar-text fw-bold" aria-current="page">
                    <span class="fs-5 bi me-1"
                        :class="{ 'bi-person-fill': path == '/artists', 'bi-person': path != '/artists' }"></span>
                    <span class="fs-5">Artists</span>
                </router-link>
            </li>
            <li class="nav-item mb-2">
                <router-link to="/albums" class="nav-link side-bar-text fw-bold" aria-current="page">
                    <span class="fs-5 bi me-1"
                        :class="{ 'bi-vinyl-fill': path == '/albums', 'bi-vinyl': path != '/albums' }"></span>
                    <span class="fs-5">Albums</span>
                </router-link>
            </li>
            <li class="nav-item mb-2">
                <router-link to="/playlists" class="nav-link side-bar-text fw-bold" aria-current="page">
                    <span class="fs-5 bi me-1"
                        :class="{ 'bi-cassette-fill': path == '/playlists', 'bi-cassette': path != '/playlists' }"></span>
                    <span class="fs-5">Playlists</span>
                </router-link>
            </li>
            <li class="nav-item">
                <router-link to="/profile" class="nav-link side-bar-text fw-bold" aria-current="page">
                    <span class="fs-5 bi bi-person-circle me-1"></span>
                    <span class="fs-5">Profile</span>
                </router-link>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { store } from '/js/store.js';
import { useRouter } from 'vue-router';

const router = useRouter();

const path = computed(() => {
    return router.currentRoute.value.path;
})
</script>