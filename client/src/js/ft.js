// ft.js
// Forte Javascript Library

import { Howl } from 'howler';
import { store } from './store'

class Forte {
    constructor() {
        this.ready = null;
        this.token = null;
        this.server = null;
        this.username = null;

        this.track = null;
        this.player = new Howl({
            src: [null],
            format: ['flac'],
            preload: true,
            html5: true,
            volume: 1,
        });

        this.player.on('load', () => {
            this.track_loaded()
            this.listen_progress()
        })
        this.player.on('end', () => {
            this.track_finished()
        })
    }

    async init() {
        let token = localStorage.getItem('token');
        let server = localStorage.getItem('server');
        let username = localStorage.getItem('username');

        if (!token || !server || !username) {
            console.log("Not authorized.")
            this.ready = false;
            localStorage.setItem('init', 'false');
            return
        }

        this.token = token;
        this.server = server;
        this.username = username;

        let session = await this.session();

        if (session.hasOwnProperty('success')) {
            this.ready = true;
            localStorage.setItem('init', 'true');
            return
        }
    }

    async API(query) {
        if (!this.ready) return null;

        let response = await fetch(this.server + '/api' + query, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async add_friend(username) {
        let response = await fetch(this.server + '/api/friends/add', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async create_playlist(data) {
        let response = await fetch(this.server + '/api/profile/create_playlist', {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async get_all_albums(offset) {
        let response = await fetch(this.server + '/api/all/albums', {
            method: "GET",
            headers: {
                "offset": offset
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async upload_cover(data) {
        let response = await fetch(this.server + '/api/cover', {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        })
        return response;
    }

    async session() {
        try {
            let auth = btoa(this.username + ":" + this.token);
            let response = await fetch(this.server + '/api/session', {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + auth
                },
                credentials: "include"
            }).then((response) => {
                return response.json();
            });
            localStorage.setItem('offline', 'false');
            return response;
        } catch (error) {
            if (error.message.startsWith('NetworkError')) {
                localStorage.setItem('offline', 'true');
                return { "error": "Server is down." }
            }
        }
    }

    async connect(server, username, token) {
        let auth = btoa(username + ":" + token);
        let response = await fetch(server + '/api/auth', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        }).catch((error) => {
            return { "error": error.toString() }
        })

        if (response.hasOwnProperty('success')) {
            localStorage.setItem('server', server);
            localStorage.setItem('username', username);
            localStorage.setItem('token', token);
            localStorage.setItem('volume', '1');
            localStorage.setItem('init', 'true');
            return true
        }

        return false
    }

    async load_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.album = track.album;
        store.playing.artist = track.artist;
        store.playing.loaded = true;

        // mediaSession metadata
        navigator.mediaSession.metadata = new MediaMetadata({
            title: store.playing.title,
            artwork: [
                { src: store.playing.cover, sizes: '250x250', type: 'image/png' },
            ]
        });

        this.player.unload();
        this.player._src = [ft.server + '/api/stream/' + track.id];
        this.player.load();
        document.title = track.title;
    }

    async track_loaded() {
        // window.dispatchEvent(new Event('track_loaded'));

        store.playing.duration = this.player.duration();
        this.player.play();
        store.playing.is_playing = true;
    }

    async listen_progress() {
        this.player._sounds[0]._node.addEventListener('timeupdate', () => {
            store.playing.seek = ft.player.seek();
            store.playing.progress = (store.playing.seek / store.playing.duration) * 100;
        });
    }

    async track_finished() {
        let track = store.queue[store.queue_index].id;
        this.addTrackToHistory(track);

        // At the end of the queue
        if (store.queue_index + 1 == store.queue.length) {
            // Repeat queue
            if (store.playing.repeat == 1) {
                store.queue_index = 0;
                this.load_track(store.queue[0]);
                return;
            }
            // Repeat track
            if (store.playing.repeat == 2) {
                this.load_track(store.queue[store.queue_index]);
                return;
            }
            store.playing.is_playing = false;
            store.playing.seek = 0;
            store.playing.progress = 0;
            return;
        }

        // Somewhere in the queue
        // Repeat track
        if (store.playing.repeat == 2) {
            this.load_track(store.queue[store.queue_index]);
            return;
        }
        store.queue_index += 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async mute() {
        store.playing.muted = !store.playing.muted;
        ft.player.mute(store.playing.muted);
    }

    async play() {
        if (!store.playing.loaded) {
            return;
        }

        if (store.playing.is_playing) {
            this.player.pause();
            store.playing.is_playing = false;
            return;
        }

        this.player.play();
        store.playing.is_playing = true;
    }

    async play_previous() {
        if (!store.playing.loaded) {
            return;
        }

        // At the start of the queue
        if (store.queue_index == 0) {
            this.player.seek(0);
            return;
        }

        // Somewhere in the queue
        store.queue_index -= 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async play_next() {
        if (!store.playing.loaded) {
            return;
        }

        // At the end of the queue
        if (store.queue_index + 1 == store.queue.length) {
            return;
        }

        // Somewhere in the queue
        store.queue_index += 1;
        this.load_track(store.queue[store.queue_index]);
    }

    async addToQueueStart(tracks) {
        store.queue.unshift(...tracks);
    }

    async addToQueueNext(tracks) {
        store.queue.splice(1, 0, ...tracks);
    }

    async addToQueue(tracks) {
        store.queue.push(...tracks);
    }

    async addTrackToPlaylist(track_id, playlist_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/add_track`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track_id
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async addTrackToHistory() {
        console.log("Starting addTrackToHistory")
        let track = store.queue[store.queue_index].id;
        let response = await fetch(this.server + `/api/profile/history/add`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async playTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            store.queue_index = 0;
            this.load_track(response.track);
            this.addToQueueStart([response.track]);
        })
    }

    async playTrackNext(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueueNext([response.track]);
        })
    }

    async playAlbum(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            store.queue_index = 0;
            this.load_track(response.tracks[0]);
            this.addToQueueStart(response.tracks);
        })
    }

    async playAlbumNext(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.addToQueueNext(response.tracks);
        })
    }

    async playPlaylist(playlist_id) {
        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            store.queue_index = 0;
            this.load_track(response.tracks[0]);
            this.addToQueueStart(response.tracks);
        })
    }

    async playPlaylistNext(playlist_id) {
        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            this.addToQueueNext(response.tracks);
        })
    }

    async queueTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueue([response.track]);
        })
    }

    async queueAlbum(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.addToQueue(response.tracks);
        })
    }

    async queuePlaylist(playlist_id) {
        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            this.addToQueue(response.tracks);
        })
    }

    async downloadTrack(track_id) {
        if (!this.ready) return null;

        let response = await fetch(this.server + '/api/stream/' + track_id, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.blob();
        });
        return response;
    }

    async deletePlaylist(playlist_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async deleteTrackFromPlaylist(playlist_id, track_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete_track`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track_id
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async love(type, id) {
        let response = await fetch(this.server + `/api/${type}/${id}/love`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async unlove(type, id) {
        let response = await fetch(this.server + `/api/${type}/${id}/unlove`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async lyrics(artist_id, title) {
        let response = await fetch(this.server + '/api/lyrics', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "artist": artist_id,
                "title": title
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }
}

export { Forte }