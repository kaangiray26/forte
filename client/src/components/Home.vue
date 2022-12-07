<template>
    <div class="d-flex flex-column vh-100 vw-100 p-2">
        <div class="row gx-0 justify-content-center">
            <div class="col-12 col-lg-6">
                <NavBar />
                <ContentView />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import ContentView from './ContentView.vue';
</script>