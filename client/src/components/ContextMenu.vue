<template>
    <component ref="contextMenu" id="contextMenu" v-show="isContextMenuVisible" :is="contextMenus[currentSearchField]"
        :style="{'bottom':posY+'px', 'right':posX+'px'}" @context-menu-event="contextMenuEvent">
    </component>
    <a ref="downloadLink" class="visually-hidden" href=""></a>
    <PlaylistSelection ref="playlistSelection" />
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import { notify } from "/js/events.js";
import { useRouter } from 'vue-router'

import ArtistContextMenu from "./context_menu/ArtistContextMenu.vue";
import AlbumContextMenu from "./context_menu/AlbumContextMenu.vue";
import TrackContextMenu from "./context_menu/TrackContextMenu.vue";
import PlaylistSelection from "./PlaylistSelection.vue";

const router = useRouter();

const posX = ref(0);
const posY = ref(0);
const selectedItem = ref(null);

const currentSearchField = ref("");
const isContextMenuVisible = ref(false);

const downloadLink = ref(null);

const contextMenu = ref(null);
const contextMenus = {
    "artist": ArtistContextMenu,
    "album": AlbumContextMenu,
    "track": TrackContextMenu
};

const playlistSelection = ref(null);

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
        ft.queueTrack(selectedItem.value.id).then(() => {
            notify({
                "title": "Added to the queue.",
            })
        });
        return
    }

    if (event == 'addAlbumToQueue') {
        ft.queueAlbum(selectedItem.value.id).then(() => {
            notify({
                "title": "Added to the queue.",
            })
        });
        return
    }

    // Add to Playlist Events
    if (event == 'addTrackToPlaylist') {
        playlistSelection.value.show(selectedItem.value.id);
        return
    }

    // Play Next Events
    if (event == 'playTrackNext') {
        ft.playTrackNext(selectedItem.value.id);
        return
    }

    if (event == 'playAlbumNext') {
        ft.playAlbumNext(selectedItem.value.id);
        return
    }

    // Download Events
    if (event == 'downloadTrack') {
        let data = await ft.API("/track/" + selectedItem.value.id + "/basic");
        let response = await ft.downloadTrack(selectedItem.value.id);
        downloadLink.value.href = window.URL.createObjectURL(response);
        downloadLink.value.download = `${data.track.disc_number} - ${data.track.track_position} - ${data.track.title}.flac`;
        downloadLink.value.click();
        return
    }

    // Share Events
    if (event == 'shareArtist') {
        navigator.clipboard.writeText("https://forte.buzl.uk/artist/" + selectedItem.value.id).then(function () {
            notify({
                "title": "Copied to clipboard.",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'shareAlbum') {
        navigator.clipboard.writeText("https://forte.buzl.uk/album/" + selectedItem.value.id).then(function () {
            notify({
                "title": "Copied to clipboard.",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'shareTrack') {
        navigator.clipboard.writeText("https://forte.buzl.uk/track/" + selectedItem.value.id).then(function () {
            notify({
                "title": "Copied to clipboard",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
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