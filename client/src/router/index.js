import { createRouter, createWebHistory } from 'vue-router';

import Recommendations from "/components/Recommendations.vue";
import Search from "/components/Search.vue";

import Artist from "/components/Artist.vue";
import Album from "/components/Album.vue";

import Profile from "/components/Profile.vue";
import Albums from "/components/profile_section/Albums.vue";
import Artists from "/components/profile_section/Artists.vue";
import Friends from "/components/profile_section/Friends.vue";
import History from "/components/profile_section/History.vue";
import Playlists from "/components/profile_section/Playlists.vue";
import ProfilePage from "/components/profile_section/ProfilePage.vue";
import Settings from "/components/profile_section/Settings.vue";
import Stations from "/components/profile_section/Stations.vue";
import Tracks from "/components/profile_section/Tracks.vue";

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
        path: "/artist/:id",
        component: Artist
    },
    {
        path: "/album/:id",
        component: Album
    },
    {
        path: '/profile',
        component: Profile,
        children: [
            {
                path: '',
                component: ProfilePage
            },
            {
                path: 'albums',
                component: Albums
            },
            {
                path: 'artists',
                component: Artists
            },
            {
                path: 'friends',
                component: Friends
            },
            {
                path: 'history',
                component: History
            },
            {
                path: 'playlists',
                component: Playlists
            },
            {
                path: 'settings',
                component: Settings
            },
            {
                path: 'stations',
                component: Stations
            },
            {
                path: 'tracks',
                component: Tracks
            },
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router