<template>
    <ul class="dropdown-menu shadow-lg context-menu show">
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'playTrack')"><span
                    class="bi bi-play-fill me-1"></span>Play</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'playTrackNext')"><span
                    class="bi bi-fast-forward-fill me-1"></span>Play next</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'addTrackToQueue')"><span
                    class="bi bi-music-note-list me-1"></span>Add to queue</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openTrackPage')"><span
                    class="bi bi-music-note-beamed me-1"></span>Show Track in Album</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openAlbumPage')"><span
                    class="bi bi-vinyl-fill me-1"></span>Album page</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openArtistPage')"><span
                    class="bi bi-person-fill me-1"></span>Artist page</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'shareTrack')"><span
                    class="bi bi-share-fill me-1"></span>Share</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'downloadTrack')"><span
                    class="bi bi-download me-1"></span>Download</button>
        </li>
    </ul>
</template>

<script setup>
const emit = defineEmits(['context-menu-event']);
</script>