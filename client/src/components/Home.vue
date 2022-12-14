<template>
    <div class="d-flex flex-column vh-100 vw-100 p-2">
        <ContentView />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import ContentView from './ContentView.vue';
</script>