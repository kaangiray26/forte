<template>
    <Login />
    <Offline />
    <ContextMenu />
    <router-view />
</template>

<script setup>
import ContextMenu from './ContextMenu.vue';
import Offline from './Offline.vue';
import Login from './Login.vue';
</script>