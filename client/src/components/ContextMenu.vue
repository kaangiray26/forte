<template>
    <TrackContextModal ref="trackContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <AlbumContextModal ref="albumContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <ArtistContextModal ref="artistContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <PlaylistContextModal ref="playlistContextModal" @context-menu-event="contextMenuEvent"
        :loved="selectedItemLoved" />
    <StationContextModal ref="stationContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />

    <a ref="downloadLink" class="visually-hidden" href=""></a>
    <PlaylistSelection ref="playlistSelection" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { notify } from "/js/events.js";
import { useRouter } from 'vue-router'

import TrackContextModal from "./context_menu/TrackContextModal.vue";
import AlbumContextModal from "./context_menu/AlbumContextModal.vue";
import ArtistContextModal from "./context_menu/ArtistContextModal.vue";
import PlaylistContextModal from "./context_menu/PlaylistContextModal.vue";
import StationContextModal from "./context_menu/StationContextModal.vue";

import PlaylistSelection from "./PlaylistSelection.vue";

const router = useRouter();

const selectedItem = ref(null);
const selectedItemLoved = ref(false);

const downloadLink = ref(null);

const trackContextModal = ref(null);
const albumContextModal = ref(null);
const artistContextModal = ref(null);
const playlistContextModal = ref(null);
const stationContextModal = ref(null);

const playlistSelection = ref(null);

async function _right_click(obj) {
    selectedItem.value = obj.item;
    isLoved();

    if (selectedItem.value.type == 'track') {
        trackContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
    if (selectedItem.value.type == 'album') {
        albumContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
    if (selectedItem.value.type == 'artist') {
        artistContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
    if (selectedItem.value.type == 'playlist') {
        playlistContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
    if (selectedItem.value.type == 'station') {
        stationContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
}

async function isLoved() {
    ft.API(`/${selectedItem.value.type}/${selectedItem.value.id}/loved`).then((response) => {
        selectedItemLoved.value = response.loved;
    })
}

async function contextMenuEvent(event) {
    // Open Page Events
    if (event == 'openPlaylistPage') {
        router.push(`/playlist/${selectedItem.value.id}`);
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
    if (event == 'openAuthorPage') {
        router.push(`/user/${selectedItem.value.author}`);
        return
    }

    // Love Events
    if (event == 'addToLoved') {
        ft.love(selectedItem.value.type, selectedItem.value.id).then(() => {
            notify({
                "title": "Added to favorites.",
            })
        });
        return
    }
    if (event == 'removeFromLoved') {
        ft.unlove(selectedItem.value.type, selectedItem.value.id).then(() => {
            notify({
                "title": "Remoed from favorites.",
            })
        });
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
    if (event == 'playPlaylist') {
        ft.playPlaylist(selectedItem.value.id);
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

    if (event == 'addPlaylistToQueue') {
        ft.queuePlaylist(selectedItem.value.id).then(() => {
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
    if (event == 'playPlaylistNext') {
        ft.playPlaylistNext(selectedItem.value.id);
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

    if (event == 'sharePlaylist') {
        navigator.clipboard.writeText("https://forte.buzl.uk/playlist/" + selectedItem.value.id).then(function () {
            notify({
                "title": "Copied to clipboard",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }
}

defineExpose({
    right_click: _right_click,
});

onMounted(() => {
    window.addEventListener('right_click', event => {
        event.detail.event.preventDefault();
        _right_click(event.detail);
    });
})
</script>