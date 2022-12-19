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
            volume: 0.5,
        });

        this.player.on('load', () => {
            this.track_loaded()
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
        })

        if (response.hasOwnProperty('success')) {
            localStorage.setItem('server', server);
            localStorage.setItem('username', username);
            localStorage.setItem('token', token);
            localStorage.setItem('volume', '0.5');
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

        this.player.unload();
        this.player._src = [ft.server + '/api/stream/' + track.id];
        this.player.load();
        document.title = track.title;
    }

    async track_loaded() {
        store.playing.duration = this.player.duration();
        this.player.play();
        store.playing.is_playing = true;
    }

    async track_finished() {
        // At the end of the queue
        if (store.queue_index + 1 == store.queue.length) {
            store.queue_index = 0;
            return;
        }

        // Somewhere in the queue
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

    async playTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
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
            this.load_track(response.tracks[0]);
            this.addToQueueStart(response.tracks);
        })
    }

    async playAlbumNext(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            this.addToQueueNext(response.tracks);
        })
    }

    async queueTrack(track_id) {
        this.API(`/track/${track_id}/basic`).then((response) => {
            this.addToQueue([response.track]);
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
}

export { Forte }