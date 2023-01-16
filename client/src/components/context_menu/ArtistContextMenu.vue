<template>
    <ul class="dropdown-menu p-1 shadow-lg context-menu show">
        <li v-show="!props.loved">
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'addToLoved')"><span
                    class="bi bi-star me-1"></span>Like</button>
        </li>
        <li v-show="props.loved">
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'removeFromLoved')"><span
                    class="bi bi-star-fill me-1"></span>Unlike</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openArtistPage')"><span
                    class="bi bi-person-fill me-1"></span>Artist page</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'shareArtist')"><span
                    class="bi bi-share-fill me-1"></span>Share</button>
        </li>
    </ul>
</template>

<script setup>
const emit = defineEmits(['context-menu-event']);

const props = defineProps({
    loved: {
        type: Boolean,
        required: true
    }
})
</script>