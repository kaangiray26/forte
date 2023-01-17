<template>
    <ul class="dropdown-menu shadow-lg context-menu show">
        <li v-show="!props.loved">
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'addToLoved')"><span
                    class="bi bi-star me-1"></span>Like</button>
        </li>
        <li v-show="props.loved">
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'removeFromLoved')"><span
                    class="bi bi-star-fill me-1"></span>Unlike</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'openStationPage')"><span
                    class="bi bi-broadcast me-1"></span>Station page</button>
        </li>
        <li>
            <button class="dropdown-item" type="button" @click="emit('context-menu-event', 'shareTrack')"><span
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