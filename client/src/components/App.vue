<template>
    <div class="complete-view d-flex flex-column vh-100 vw-100">
        <div class="content-view pb-4" style="flex: 1 1 auto;">
            <NavBar />
            <router-view />
        </div>
        <div class="player-view">
            <Player />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import Player from './Player.vue';
</script>