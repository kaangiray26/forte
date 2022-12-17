<template>
    <div class="complete-view d-flex flex-column vh-100 vw-100">
        <div class="content-view pb-4" style="flex: 1 1 auto;">
            <NavBar />
            <ContentView />
        </div>
        <div class="player-view">
            <Player />
        </div>
    </div>
</template>

<script setup>
import NavBar from './NavBar.vue';
import ContentView from './ContentView.vue';
import Player from './Player.vue';
</script>