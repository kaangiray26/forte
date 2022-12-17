<template>
    <ul class="dropdown-menu p-1 shadow-lg context-menu show">
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openArtistPage')"><span
                    class="bi bi-person-fill me-1"></span>Artist page</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'shareAlbum')"><span
                    class="bi bi-share-fill me-1"></span>Share</button>
        </li>
    </ul>
</template>

<script setup>
const emit = defineEmits(['context-menu-event']);
</script>