import { createRouter, createWebHistory } from 'vue-router';

import Recommendations from "/components/Recommendations.vue";
import Search from "/components/Search.vue";
import Settings from "/components/Settings.vue";

import Artist from "/components/Artist.vue";
import Album from "/components/Album.vue";

const routes = [
    {
        path: "/",
        component: Recommendations,

    },
    {
        path: "/search/:query",
        component: Search
    },
    {
        path: "/settings",
        component: Settings
    },
    {
        path: "/artist/:id",
        component: Artist
    },
    {
        path: "/album/:id",
        component: Album
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router