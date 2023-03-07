<template>
    <div class="vw-100 complete-view d-flex flex-column">
        <Messages />
        <Toasts />
        <Animation />
        <div class="side-view d-flex">
            <div class="d-none d-sm-block d-flex flex-column flex-shrink-0">
                <SideBar />
            </div>
            <div class="content-view pb-4">
                <NavBar ref="thisNavBar" />
                <ContentView ref="thisContentView" />
            </div>
        </div>
        <div class="player-view">
            <Player ref="thisPlayer" />
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { action } from '/js/events.js';
import { store } from '/js/store.js';

import NavBar from './NavBar.vue';
import SideBar from './SideBar.vue';
import ContentView from './ContentView.vue';
import Player from './Player.vue';
import Toasts from './Toasts.vue';
import Messages from './Messages.vue';
import Animation from './Animation.vue';

const thisNavBar = ref(null);
const thisContentView = ref(null);
const thisPlayer = ref(null);

async function keyPress(event) {
    // Must be synchronized in groupSession: ok
    if (event.target.tagName != 'INPUT' && event.code == 'Space') {
        event.preventDefault();
        action({
            func: async function op() {
                ft.play();
            },
            object: null,
            operation: "play"
        });
        return;
    }

    // Must be synchronized in groupSession: ok
    if (event.target.tagName != 'INPUT' && event.key == 'ArrowLeft') {
        event.preventDefault();
        action({
            func: async function op() {
                ft.play_previous();
            },
            object: null,
            operation: "playPrevious"
        });
        return;
    }

    // Must be synchronized in groupSession: ok
    if (event.target.tagName != 'INPUT' && event.key == 'ArrowRight') {
        event.preventDefault();
        action({
            func: async function op() {
                ft.play_next();
            },
            object: null,
            operation: "playNext"
        });
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'm') {
        event.preventDefault();
        ft.mute();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'q') {
        event.preventDefault();
        thisPlayer.value.show_queue();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'l') {
        event.preventDefault();
        thisPlayer.value.show_lyrics();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'g') {
        event.preventDefault();
        thisPlayer.value.group_session();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.ctrlKey && event.key == 'k') {
        event.preventDefault();
        thisNavBar.value.focus_search();
        return;
    }
}

onBeforeMount(() => {
    // Theme
    let theme = JSON.parse(localStorage.getItem("theme"));
    if (!theme) {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.body.classList.toggle("dark-theme");
            store.theme = "dark";
        }
    } else {
        document.body.classList.toggle("dark-theme");
        store.theme = theme;
    }

    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.focus();
    window.addEventListener('keydown', keyPress);
})
</script>