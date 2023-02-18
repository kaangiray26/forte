import { createRouter, createWebHistory } from 'vue-router';
import Index from '/components/Index.vue';
import Login from '/components/Login.vue';
import Session from '/components/Session.vue';

const routes = [
    {
        path: "/",
        component: Session
    },
    {
        path: "/dashboard",
        component: Index,
    },
    {
        path: "/login",
        component: Login,
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router