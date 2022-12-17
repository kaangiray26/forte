<template>
    <router-view />
    <ContextMenu />
</template>

<script setup>
import { ref } from 'vue';
import ContextMenu from './ContextMenu.vue';
</script>