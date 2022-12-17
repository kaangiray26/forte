<template>
    <component ref="contextMenu" id="contextMenu" v-show="isContextMenuVisible" :is="contextMenus[currentSearchField]"
        :style="{'bottom':posY+'px', 'right':posX+'px'}" @context-menu-event="contextMenuEvent">
    </component>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { useRouter } from 'vue-router'
import { playTrack } from "/js/events.js";

import ArtistContextMenu from "./context_menu/ArtistContextMenu.vue";
import AlbumContextMenu from "./context_menu/AlbumContextMenu.vue";
import TrackContextMenu from "./context_menu/TrackContextMenu.vue";

const router = useRouter();

const posX = ref(0);
const posY = ref(0);
const selectedItem = ref(null);

const currentSearchField = ref("");
const isContextMenuVisible = ref(false);

const contextMenu = ref(null);
const contextMenus = {
    "artist": ArtistContextMenu,
    "album": AlbumContextMenu,
    "track": TrackContextMenu
};

async function _right_click(obj) {
    selectedItem.value = obj.item;
    currentSearchField.value = selectedItem.value.type;

    isContextMenuVisible.value = true;

    let mouse_x = obj.event.x;
    let mouse_y = obj.event.y;

    await nextTick();

    let context = document.getElementById('contextMenu');

    let context_x = context.offsetWidth;
    let context_y = context.offsetHeight;

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
    return;
}

async function contextMenuEvent(event) {
    isContextMenuVisible.value = false;

    // Open Page Events
    if (event == 'openTrackPage') {
        router.push(`/track/${selectedItem.value.id}`);
        return
    }
    if (event == 'openAlbumPage') {
        if (selectedItem.value.type == 'album') {
            router.push(`/album/${selectedItem.value.id}`);
            return
        }
        if (selectedItem.value.type == 'track') {
            ft.API(`/track/${selectedItem.value.id}`).then(response => {
                router.push(`/album/${response.album.id}`);
            })
        }
        return
    }
    if (event == 'openArtistPage') {
        if (selectedItem.value.type == 'artist') {
            router.push(`/artist/${selectedItem.value.id}`);
            return
        }
        if (selectedItem.value.type == 'album') {
            ft.API(`/album/${selectedItem.value.id}`).then(response => {
                router.push(`/artist/${response.artist.id}`);
            })
            return
        }
        if (selectedItem.value.type == 'track') {
            ft.API(`/track/${selectedItem.value.id}`).then(response => {
                router.push(`/artist/${response.artist.id}`);
            })
        }
        return
    }

    // Play Events
    if (event == 'playTrack') {
        ft.playTrack(selectedItem.value.id);
        return
    }

    if (event == 'playAlbum') {
        ft.playAlbum(selectedItem.value.id);
        return
    }

    // Add To Queue Events
    if (event == 'addTrackToQueue') {
        ft.queueTrack(selectedItem.value.id);
        return
    }

    if (event == 'addAlbumToQueue') {
        ft.queueAlbum(selectedItem.value.id);
        return
    }
}

async function _hide() {
    isContextMenuVisible.value = false;
}

defineExpose({
    hide: _hide,
    right_click: _right_click,
});

onMounted(() => {
    window.addEventListener('right_click', event => {
        event.detail.event.preventDefault();
        _right_click(event.detail);
    });
    window.addEventListener('click', event => {
        if (event.target.className != "dropdown-item") {
            _hide();
        }
    })
})
</script>