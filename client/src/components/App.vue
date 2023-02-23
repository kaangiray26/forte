<template>
    <div class="vw-100 complete-view d-flex flex-column">
        <Messages />
        <Toasts />
        <Animation />
        <div class="content-view pb-4" style="flex: 1 1 auto;">
            <NavBar ref="thisNavBar" />
            <ContentView ref="thisContentView" />
        </div>
        <div class="player-view">
            <Player ref="thisPlayer" />
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { action } from '/js/events.js';
import NavBar from './NavBar.vue';
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
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.focus();
    window.addEventListener('keydown', keyPress);
})
</script>