<template>
    <TrackContextModal ref="trackContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <AlbumContextModal ref="albumContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <ArtistContextModal ref="artistContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <PlaylistContextModal ref="playlistContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <StationContextModal ref="stationContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />
    <UserContextModal ref="userContextModal" @context-menu-event="contextMenuEvent" :loved="selectedItemLoved" />

    <a ref="downloadLink" class="visually-hidden" href=""></a>
    <PlaylistSelection ref="playlistSelection" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { notify, action } from "/js/events.js";
import { useRouter } from 'vue-router'

import TrackContextModal from "./context_menu/TrackContextModal.vue";
import AlbumContextModal from "./context_menu/AlbumContextModal.vue";
import ArtistContextModal from "./context_menu/ArtistContextModal.vue";
import PlaylistContextModal from "./context_menu/PlaylistContextModal.vue";
import StationContextModal from "./context_menu/StationContextModal.vue";
import UserContextModal from "./context_menu/UserContextModal.vue";

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
const userContextModal = ref(null);

const playlistSelection = ref(null);

async function _right_click(obj) {
    selectedItem.value = obj.item;

    if (selectedItem.value.server) {
        federatedIsLoved();
    } else {
        isLoved();
    }

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
    if (selectedItem.value.type == 'user') {
        userContextModal.value.show(obj.event.x, obj.event.y);
        return;
    }
}

async function isLoved() {
    if (selectedItem.value.type == 'user') {
        ft.API(`/${selectedItem.value.type}/${selectedItem.value.title}/loved`).then((response) => {
            selectedItemLoved.value = response.loved;
        })
        return;
    }

    ft.API(`/${selectedItem.value.type}/${selectedItem.value.id}/loved`).then((response) => {
        selectedItemLoved.value = response.loved;
    })
}

async function federatedIsLoved() {
    if (selectedItem.value.type == 'user') {
        ft.API(`/${selectedItem.value.type}/${selectedItem.value.title}@${selectedItem.value.server}/loved`).then((response) => {
            selectedItemLoved.value = response.loved;
        })
        return;
    }

    ft.API(`/${selectedItem.value.type}/${selectedItem.value.id}@${selectedItem.value.server}/loved`).then((response) => {
        selectedItemLoved.value = response.loved;
    })
}

async function federatedContextMenuEvent(event) {
    // Open Page Events
    if (event == 'openPlaylistPage') {
        router.push(`/playlist/${selectedItem.value.id}@${selectedItem.value.server}`);
        return
    }

    if (event == 'openAlbumPage') {
        if (selectedItem.value.type == 'album') {
            router.push(`/album/${selectedItem.value.id}@${selectedItem.value.server}`);
            return
        }
        if (selectedItem.value.type == 'track') {
            ft.fAPI(selectedItem.value.server, `/track/${selectedItem.value.id}`).then(response => {
                router.push(`/album/${response.album.id}@${selectedItem.value.server}`);
            })
        }
        return
    }

    if (event == 'openArtistPage') {
        if (selectedItem.value.type == 'artist') {
            router.push(`/artist/${selectedItem.value.id}@${selectedItem.value.server}`);
            return
        }
        if (selectedItem.value.type == 'album') {
            ft.fAPI(selectedItem.value.server, `/album/${selectedItem.value.id}`).then(response => {
                router.push(`/artist/${response.artist.id}@${selectedItem.value.server}`);
            })
            return
        }
        if (selectedItem.value.type == 'track') {
            ft.fAPI(selectedItem.value.server, `/track/${selectedItem.value.id}`).then(response => {
                router.push(`/artist/${response.artist.id}@${selectedItem.value.server}`);
            })
        }
        return
    }

    if (event == 'openUserPage') {
        router.push(`/user/${selectedItem.value.title}@${selectedItem.value.server}`);
        return
    }

    if (event == 'openAuthorPage') {
        ft.fAPI(selectedItem.value.server, `/playlist/${selectedItem.value.id}/basic`).then(response => {
            router.push(`/user/${response.playlist.author}@${selectedItem.value.server}`);
        })
        return
    }

    // Friend Events
    if (event == 'addToFriends') {
        ft.add_friend(`${selectedItem.value.title}@${selectedItem.value.server}`, selectedItem.value.server).then(() => {
            notify({
                "title": "Added to friends.",
            })
        });
        return
    }

    if (event == 'removeFromFriends') {
        ft.remove_friend(`${selectedItem.value.title}@${selectedItem.value.server}`, selectedItem.value.server).then(() => {
            notify({
                "title": "Removed from friends.",
            })
        });
        return
    }

    // Love Events
    if (event == 'addToLoved') {
        ft.love(selectedItem.value.type, `${selectedItem.value.id}@${selectedItem.value.server}`, selectedItem.value.server).then(() => {
            notify({
                "title": "Added to favorites.",
            })
        });
        return
    }
    if (event == 'removeFromLoved') {
        ft.unlove(selectedItem.value.type, `${selectedItem.value.id}@${selectedItem.value.server}`, selectedItem.value.server).then(() => {
            notify({
                "title": "Removed from favorites.",
            })
        });
        return
    }

    // Play Events
    // Must be synchronized in groupSession: ok
    if (event == 'playTrack') {
        action({
            func: async function op() {
                ft.playTrack(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playTrack",
        })
        return
    }
    // Must be synchronized in groupSession: ok
    if (event == 'playAlbum') {
        action({
            func: async function op() {
                ft.playAlbum(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playAlbum",
        })
        return
    }
    // Must be synchronized in groupSession: ok
    if (event == 'playPlaylist') {
        action({
            func: async function op() {
                ft.playPlaylist(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playPlaylist",
        })
        return
    }

    // Add To Queue Events
    // Must be synchronized in groupSession: ok
    if (event == 'addTrackToQueue') {
        action({
            func: async function op() {
                ft.queueTrack(selectedItem.value.id, selectedItem.value.server).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "addTrackToQueue",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'addAlbumToQueue') {
        action({
            func: async function op() {
                ft.queueAlbum(selectedItem.value.id, selectedItem.value.server).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "addAlbumToQueue",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'addPlaylistToQueue') {
        action({
            func: async function op() {
                ft.queuePlaylist(selectedItem.value.id, selectedItem.value.server).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "addPlaylistToQueue",
        })
        return
    }

    // Add to Playlist Events
    if (event == 'addTrackToPlaylist') {
        playlistSelection.value.show(`${selectedItem.value.id}@${selectedItem.value.server}`);
        return
    }

    // Play Next Events
    // Must be synchronized in groupSession: ok
    if (event == 'playTrackNext') {
        action({
            func: async function op() {
                ft.playTrackNext(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playTrackNext",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'playAlbumNext') {
        action({
            func: async function op() {
                ft.playAlbumNext(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playAlbumNext",
        })
        return
    }
    // Must be synchronized in groupSession:
    if (event == 'playPlaylistNext') {
        action({
            func: async function op() {
                ft.playPlaylistNext(selectedItem.value.id, selectedItem.value.server);
            },
            object: [selectedItem.value.id, selectedItem.value.server],
            operation: "playPlaylistNext",
        })
        return
    }

    // Download Events
    if (event == 'downloadTrack') {
        let data = await ft.fAPI(selectedItem.value.server, "/track/" + selectedItem.value.id + "/basic");
        let response = await ft.downloadTrack(selectedItem.value.id, selectedItem.value.server);
        downloadLink.value.href = window.URL.createObjectURL(response);
        downloadLink.value.download = `${data.track.disc_number} - ${data.track.track_position} - ${data.track.title}.flac`;
        downloadLink.value.click();
        return
    }

    // Share Events
    if (event == 'shareArtist') {
        navigator.clipboard.writeText(`https://forte.buzl.uk/artist/${selectedItem.value.id}@${selectedItem.value.server}`).then(function () {
            notify({
                "title": "Copied to clipboard.",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'shareAlbum') {
        navigator.clipboard.writeText(`https://forte.buzl.uk/album/${selectedItem.value.id}@${selectedItem.value.server}`).then(function () {
            notify({
                "title": "Copied to clipboard.",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'shareTrack') {
        navigator.clipboard.writeText(`https://forte.buzl.uk/track/${selectedItem.value.id}@${selectedItem.value.server}`).then(function () {
            notify({
                "title": "Copied to clipboard",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'sharePlaylist') {
        navigator.clipboard.writeText(`https://forte.buzl.uk/playlist/${selectedItem.value.id}@${selectedItem.value.server}`).then(function () {
            notify({
                "title": "Copied to clipboard",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }

    if (event == 'shareUser') {
        navigator.clipboard.writeText(`https://forte.buzl.uk/user/${selectedItem.value.title}@${selectedItem.value.server}`).then(function () {
            notify({
                "title": "Copied to clipboard",
            })
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
        return
    }
}

async function contextMenuEvent(event) {
    // Federated
    if (selectedItem.value.server) {
        federatedContextMenuEvent(event);
        return;
    }

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

    if (event == 'openUserPage') {
        router.push(`/user/${selectedItem.value.title}`);
        return
    }

    if (event == 'openAuthorPage') {
        router.push(`/user/${selectedItem.value.author}`);
        return
    }

    // Friend Events
    if (event == 'addToFriends') {
        ft.add_friend(selectedItem.value.title).then(() => {
            notify({
                "title": "Added to friends.",
            })
        });
        return
    }

    if (event == 'removeFromFriends') {
        ft.remove_friend(selectedItem.value.title).then(() => {
            notify({
                "title": "Removed from friends.",
            })
        });
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
                "title": "Removed from favorites.",
            })
        });
        return
    }

    // Play Events
    // Must be synchronized in groupSession: ok
    if (event == 'playTrack') {
        action({
            func: async function op() {
                ft.playTrack(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playTrack",
        })
        return
    }
    // Must be synchronized in groupSession: ok
    if (event == 'playAlbum') {
        action({
            func: async function op() {
                ft.playAlbum(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playAlbum",
        })
        return
    }
    // Must be synchronized in groupSession: ok
    if (event == 'playPlaylist') {
        action({
            func: async function op() {
                ft.playPlaylist(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playPlaylist",
        })
        return
    }

    // Add To Queue Events
    // Must be synchronized in groupSession: ok
    if (event == 'addTrackToQueue') {
        action({
            func: async function op() {
                ft.queueTrack(selectedItem.value.id).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id],
            operation: "addTrackToQueue",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'addAlbumToQueue') {
        action({
            func: async function op() {
                ft.queueAlbum(selectedItem.value.id).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id],
            operation: "addAlbumToQueue",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'addPlaylistToQueue') {
        action({
            func: async function op() {
                ft.queuePlaylist(selectedItem.value.id).then(() => {
                    notify({
                        "title": "Added to the queue."
                    })
                })
            },
            object: [selectedItem.value.id],
            operation: "addPlaylistToQueue",
        })
        return
    }

    // Add to Playlist Events
    if (event == 'addTrackToPlaylist') {
        playlistSelection.value.show(selectedItem.value.id);
        return
    }

    // Play Next Events
    // Must be synchronized in groupSession: ok
    if (event == 'playTrackNext') {
        action({
            func: async function op() {
                ft.playTrackNext(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playTrackNext",
        })
        return
    }

    // Must be synchronized in groupSession: ok
    if (event == 'playAlbumNext') {
        action({
            func: async function op() {
                ft.playAlbumNext(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playAlbumNext",
        })
        return
    }
    // Must be synchronized in groupSession:
    if (event == 'playPlaylistNext') {
        action({
            func: async function op() {
                ft.playPlaylistNext(selectedItem.value.id);
            },
            object: [selectedItem.value.id],
            operation: "playPlaylistNext",
        })
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

    // Friend Events
    if (event == 'addFriend') {
        ft.addFriend(selectedItem.value.title).then(() => {
            notify({
                "title": "Added to friends.",
            })
        });
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

    if (event == 'shareUser') {
        navigator.clipboard.writeText("https://forte.buzl.uk/user/" + selectedItem.value.title).then(function () {
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