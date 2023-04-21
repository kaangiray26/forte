import { createRouter, createWebHistory } from 'vue-router';

import Recommendations from "/components/Recommendations.vue";
import Search from "/components/Search.vue";

import AllArtists from "/components/Artists.vue";
import AllAlbums from "/components/Albums.vue";
import AllPlaylists from "/components/Playlists.vue";

import Artist from "/components/Artist.vue";
import Album from "/components/Album.vue";
import Playlist from "/components/Playlist.vue";
import Station from "/components/Station.vue";

import Profile from "/components/Profile.vue";
import Albums from "/components/profile_section/Albums.vue";
import Artists from "/components/profile_section/Artists.vue";
import Friends from "/components/profile_section/Friends.vue";
import History from "/components/profile_section/History.vue";
import Playlists from "/components/profile_section/Playlists.vue";
import Settings from "/components/profile_section/Settings.vue";
import Stations from "/components/profile_section/Stations.vue";
import Tracks from "/components/profile_section/Tracks.vue";

import User from "/components/User.vue";
import User_Albums from "/components/user_section/Albums.vue";
import User_Artists from "/components/user_section/Artists.vue";
import User_Friends from "/components/user_section/Friends.vue";
import User_History from "/components/user_section/History.vue";
import User_Playlists from "/components/user_section/Playlists.vue";
import User_Settings from "/components/user_section/Settings.vue";
import User_Tracks from "/components/user_section/Tracks.vue";

import GroupSessionLink from "/components/GroupSessionLink.vue"
import LastfmAuth from "/components/LastfmAuth.vue"

import TrackRedirect from "/components/TrackRedirect.vue"

import NotFound from "/components/NotFound.vue"
import Servers from "/components/Servers.vue"

const routes = [
    { path: '/:pathMatch(.*)*', component: NotFound },
    {
        path: "/",
        component: Recommendations,

    },
    {
        path: "/artists",
        component: AllArtists
    },
    {
        path: "/albums",
        component: AllAlbums
    },
    {
        path: "/playlists",
        component: AllPlaylists
    },
    {
        path: "/search/:query",
        component: Search
    },
    {
        path: "/search",
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
        path: "/track/:id",
        component: TrackRedirect
    },
    {
        path: "/playlist/:id",
        component: Playlist
    },
    {
        path: "/station/:id",
        component: Station
    },
    {
        path: "/groupsession/:id",
        component: GroupSessionLink
    },
    {
        path: "/auth/lastfm",
        component: LastfmAuth
    },
    {
        path: "/servers",
        component: Servers
    },
    {
        path: '/profile',
        component: Profile,
        children: [
            {
                path: '',
                component: Settings
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
                path: 'stations',
                component: Stations
            },
            {
                path: 'tracks',
                component: Tracks
            },
        ]
    },
    {
        path: "/user/:id",
        component: User,
        children: [
            {
                path: '',
                component: User_Settings
            },
            {
                path: 'albums',
                component: User_Albums
            },
            {
                path: 'artists',
                component: User_Artists
            },
            {
                path: 'friends',
                component: User_Friends
            },
            {
                path: 'history',
                component: User_History
            },
            {
                path: 'playlists',
                component: User_Playlists
            },
            {
                path: 'tracks',
                component: User_Tracks
            },
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router