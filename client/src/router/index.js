import { createRouter, createWebHistory } from 'vue-router';
import Recommendations from "/components/Recommendations.vue";
import Search from "/components/Search.vue";
import Settings from "/components/Settings.vue";

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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router