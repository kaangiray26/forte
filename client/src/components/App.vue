<template>
    <div class="complete-view d-flex flex-column vh-100 vw-100">
        <Toasts />
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
import { ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import ContentView from './ContentView.vue';
import Player from './Player.vue';
import Toasts from './Toasts.vue';

const thisNavBar = ref(null);
const thisContentView = ref(null);
const thisPlayer = ref(null);

async function keyPress(event) {
    if (event.target.tagName != 'INPUT' && event.key == 's') {
        event.preventDefault();
        thisPlayer.value.shuffle();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'r') {
        event.preventDefault();
        thisPlayer.value.repeat();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.code == 'Space') {
        event.preventDefault();
        ft.play();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'ArrowLeft') {
        event.preventDefault();
        ft.play_previous();
        return;
    }

    if (event.target.tagName != 'INPUT' && event.key == 'ArrowRight') {
        event.preventDefault();
        ft.play_next();
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

    if (event.target.tagName != 'INPUT' && event.ctrlKey && event.key == 'k') {
        event.preventDefault();
        thisNavBar.value.focus_search();
        return;
    }
}

onMounted(() => {
    window.focus();
    window.addEventListener('keydown', keyPress);
})
</script>