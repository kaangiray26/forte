<template>
    <div id="trackContextModal" class="modal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <ul id="trackMenu" class="dropdown-menu shadow show position-fixed"
                    :style="{ 'bottom': posY + 'px', 'right': posX + 'px' }">
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'playTrack')"><span
                                class="bi bi-play-fill me-1"></span>Play</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'playTrackNext')"><span
                                class="bi bi-fast-forward-fill me-1"></span>Play next</button>
                    </li>
                    <li v-show="!props.loved">
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'addToLoved')"><span
                                class="bi bi-star me-1"></span>Like</button>
                    </li>
                    <li v-show="props.loved">
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'removeFromLoved')"><span
                                class="bi bi-star-fill me-1"></span>Unlike</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'addTrackToQueue')"><span
                                class="bi bi-music-note-list me-1"></span>Add to queue</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'addTrackToPlaylist')"><span
                                class="bi bi-music-note-beamed me-1"></span>Add to playlist</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'openAlbumPage')"><span
                                class="bi bi-vinyl-fill me-1"></span>Album page</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'openArtistPage')"><span
                                class="bi bi-person-fill me-1"></span>Artist page</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'shareTrack')"><span
                                class="bi bi-share-fill me-1"></span>Share</button>
                    </li>
                    <li>
                        <button class="dropdown-item" type="button"
                            @click="emit('context-menu-event', 'downloadTrack')"><span
                                class="bi bi-download me-1"></span>Download</button>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';

let modal = null;
let menu = null;
const emit = defineEmits(['context-menu-event']);

const posX = ref(0);
const posY = ref(0);

const props = defineProps({
    loved: {
        type: Boolean,
        required: true
    }
})

async function calc_pos(x, y) {
    let mouse_x = x;
    let mouse_y = y;

    let context_x = menu.offsetWidth;
    let context_y = menu.offsetHeight;

    if (mouse_x + context_x >= window.innerWidth) {
        posX.value = window.innerWidth - mouse_x;
    } else {
        posX.value = window.innerWidth - mouse_x - context_x;
    }

    if (mouse_y + context_y >= window.innerHeight) {
        posY.value = window.innerHeight - mouse_y;
    } else {
        posY.value = window.innerHeight - mouse_y - context_y;
    }
}

async function _show(x, y) {
    await modal.show();
    calc_pos(x, y);
}

async function _hide() {
    modal.hide();
}

defineExpose({
    show: _show,
    hide: _hide
})

onMounted(() => {
    modal = new Modal(document.querySelector('#trackContextModal'));
    menu = document.querySelector('#trackMenu');
    menu.addEventListener('click', () => {
        modal.hide();
    })
})
</script>