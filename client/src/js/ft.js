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
        this.session = null;

        this.track = null;
        this.player = new Howl({
            src: [null],
            format: ['flac', 'mp3', 'ogg', 'wav', 'aac', 'm4a', 'opus', 'webm'],
            preload: true,
            html5: true,
            volume: 1,
        });

        this.player.on('load', () => {
            this.track_loaded()
            this.listen_progress()
            this.track_quality()
        });

        this.player.on('end', () => {
            this.track_finished()
        });
    }

    async init() {
        let token = JSON.parse(localStorage.getItem('token'));
        let server = JSON.parse(localStorage.getItem('server'));
        let username = JSON.parse(localStorage.getItem('username'));
        let session = JSON.parse(localStorage.getItem('session'));

        // Set scrobbling
        if (JSON.parse(localStorage.getItem('scrobbling'))) {
            store.scrobbling = true;
        }

        // Check if all data is present
        if (!token || !server || !username) {
            this.ready = false;
            localStorage.setItem('init', JSON.stringify(false));
            return
        }

        this.token = token;
        this.server = server;
        this.username = username;

        // Check session
        if (session) {
            let response = await this.check_session(session);
            if (response.status == "success") {
                this.ready = true;
                this.session = session;
                localStorage.setItem('init', JSON.stringify(true));
                return
            }
        }

        // Create session
        await this.connect(this.server, this.username, this.token);
    }

    async API(query) {
        if (!this.ready) return null;

        let response = await fetch(this.server + '/api' + query + `?session=${this.session}`, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async federatedAPI(address, query) {
        if (!this.ready) return null;

        return await fetch(address + "/api" + query)
            .then((response) => {
                return response.json();
            })
            .catch((error) => {
                return { "error": "Couldn't find user on that server." }
            });
    }

    async add_friend(username) {
        let response = await fetch(this.server + '/api/friends/add' + `?session=${this.session}`, {
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

    async remove_friend(username) {
        let response = await fetch(this.server + '/api/friends/remove' + `?session=${this.session}`, {
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
        let response = await fetch(this.server + '/api/profile/create_playlist' + `?session=${this.session}`, {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async get_all_albums(offset) {
        let response = await fetch(this.server + '/api/all/albums' + `?session=${this.session}`, {
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
        let response = await fetch(this.server + '/api/cover' + `?session=${this.session}`, {
            method: "POST",
            body: data,
            credentials: "include"
        }).then((response) => {
            return response.json();
        })
        return response;
    }

    async check_session(session) {
        return await fetch(this.server + `/api/session/check?session=${session}`)
            .then((response) => {
                localStorage.setItem('offline', JSON.stringify(false));
                return response.json();
            })
            .catch(error => {
                if (error.message.startsWith('NetworkError')) {
                    localStorage.setItem('offline', JSON.stringify(true));
                    return { "status": "error", "message": "Server is down." }
                }
                return { "status": "error" }
            });
    }

    async get_session(server, username, token) {
        let auth = btoa(username + ":" + token);
        return await fetch(server + '/api/session', {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + auth
            }
        }).then((response) => {
            localStorage.setItem('offline', JSON.stringify(false));
            return response.json();
        }).catch((error) => {
            // Check if NetworkError
            if (error.message.startsWith('NetworkError')) {
                localStorage.setItem('offline', JSON.stringify(true));
                return { "status": "error", "message": "Server is down." }
            }
            return { "status": "error" }
        });
    }

    async connect(server, username, token) {
        let response = await this.get_session(server, username, token);
        if (response.status == 'success') {
            this.ready = true;
            this.session = response.session;

            localStorage.setItem('init', JSON.stringify(true));
            localStorage.setItem('session', JSON.stringify(response.session));
            localStorage.setItem('server', JSON.stringify(server));
            localStorage.setItem('username', JSON.stringify(username));
            localStorage.setItem('token', JSON.stringify(token));
            localStorage.setItem('volume', JSON.stringify('1'));
            localStorage.setItem('groupSession', JSON.stringify([]));
            localStorage.setItem('groupSessionID', JSON.stringify(''));
            return true
        }

        if (response.status == 'error') {
            this.ready = false;
            localStorage.setItem('init', JSON.stringify(false));
        }
        return false
    }

    get_cover(cover) {
        if (!cover) {
            return "/images/track.svg"
        }

        if (cover.startsWith("http")) {
            return cover;
        }

        return ft.server + '/' + cover;
    }

    async load_track(track) {
        store.playing.id = track.id;
        store.playing.type = track.type;
        store.playing.title = track.title;
        store.playing.cover = track.cover;
        store.playing.album = track.album;
        store.playing.artist = track.artist;
        store.playing.loaded = true;

        // Cover
        let cover = this.get_cover(store.playing.cover);

        // mediaSession metadata
        navigator.mediaSession.metadata = new MediaMetadata({
            title: store.playing.title,
            artwork: [
                { src: cover, sizes: '250x250', type: 'image/png' },
            ]
        });

        this.player.unload();
        this.player._src = [ft.server + '/api/stream/' + track.id + `?session=${this.session}`];
        this.player.load();
        document.title = track.title;
    }

    async track_loaded() {
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

    async track_quality() {
        fetch(this.server + `/api/stream/${store.playing.id}` + `?session=${this.session}`, {
            method: "HEAD",
            credentials: "include"
        }).then((response) => {
            let length = response.headers.get("content-length");
            let duration = store.playing.duration;
            let kbit = (length * 8) / 1000;

            store.playing.format = response.headers.get("content-type");;
            store.playing.bitrate = Math.round(kbit / duration);;

            if (store.playing.bitrate <= 160) {
                store.playing.quality = "LQ";
                return;
            }
            if (store.playing.bitrate <= 320) {
                store.playing.quality = "SQ";
                return;
            }
            if (store.playing.bitrate <= 1411) {
                store.playing.quality = "HQ";
                return;
            }
            store.playing.quality = "Hi-Res";
        })
    }

    async track_finished() {
        let queue = this.getCurrentQueue();
        let track = queue[store.queue_index].id;
        this.addTrackToHistory(track);
        this.scrobble(track);

        // At the end of the queue
        if (store.queue_index + 1 == queue.length) {
            // Repeat queue
            if (store.playing.repeat == 1) {
                store.queue_index = 0;
                this.load_track(queue[0]);
                return;
            }
            // Repeat track
            if (store.playing.repeat == 2) {
                this.load_track(queue[store.queue_index]);
                return;
            }
            // Radio
            this.API('/random/track').then((response) => {
                this.load_track(response.track);
                this.addToQueue([response.track]);
                store.queue_index += 1;
            })
            return;
        }

        // Somewhere in the queue
        // Repeat track
        if (store.playing.repeat == 2) {
            this.load_track(queue[store.queue_index]);
            return;
        }
        store.queue_index += 1;
        this.load_track(queue[store.queue_index]);
    }

    async mute() {
        store.playing.muted = !store.playing.muted;
        ft.player.mute(store.playing.muted);
    }

    async repeat() {
        store.playing.repeat = (store.playing.repeat + 1) % 3;
    }

    async play() {
        if (!store.playing.loaded) {
            return;
        }

        if (store.playing.is_playing) {
            // howler is inconsistent, using this instead
            this.player._sounds[0]._node.pause();
            //
            store.playing.is_playing = false;
            navigator.mediaSession.playbackState = "paused";
            return;
        }

        // howler is inconsistent, using this instead
        this.player._sounds[0]._node.play();
        //
        store.playing.is_playing = true;
        navigator.mediaSession.playbackState = "playing";
    }

    async play_previous() {
        if (!store.playing.loaded) {
            return;
        }

        // At the start of the queue
        if (store.queue_index == 0) {
            this.seek(0);
            return;
        }

        // Somewhere in the queue
        store.queue_index -= 1;
        let queue = this.getCurrentQueue();
        this.load_track(queue[store.queue_index]);
    }

    async play_next() {
        if (!store.playing.loaded) {
            return;
        }

        // Emit track finished
        this.track_finished();
    }

    async addToQueueStart(tracks) {
        let q = this.getCurrentQueue();
        q.unshift(...tracks);
        this.setCurrentQueue(q);
    }

    async addToQueueNext(tracks) {
        let q = this.getCurrentQueue();
        q.splice(store.queue_index + 1, 0, ...tracks);
        this.setCurrentQueue(q);
    }

    async addToQueue(tracks) {
        let q = this.getCurrentQueue();
        q.push(...tracks);
        this.setCurrentQueue(q);
    }

    async addTrackToPlaylist(track_id, playlist_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/add_track` + `?session=${this.session}`, {
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

    async addTrackToHistory(track) {
        let response = await fetch(this.server + `/api/profile/history/add` + `?session=${this.session}`, {
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

    async scrobble(track) {
        if (!store.scrobbling) {
            return;
        }

        let sk = JSON.parse(localStorage.getItem("lastfm_key"));
        if (!sk) {
            return;
        }

        let response = await fetch(this.server + '/api/lastfm/scrobble' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "track": track,
                "sk": JSON.parse(sk)
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        }
        );
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
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.load_track(tracks[0]);
            this.addToQueueStart(tracks);
        })
    }

    async playAlbumNext(album_id) {
        this.API(`/album/${album_id}/tracks`).then((response) => {
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.addToQueueNext(tracks);
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
            let tracks = response.tracks;
            tracks.sort((a, b) => a.track_position - b.track_position);
            tracks.sort((a, b) => a.disc_number - b.disc_number);
            this.addToQueue(tracks);
        })
    }

    async queuePlaylist(playlist_id) {
        this.API(`/playlist/${playlist_id}/tracks`).then((response) => {
            this.addToQueue(response.tracks);
        })
    }

    async removeQueueTrack(index) {
        let q = this.getCurrentQueue();
        q.splice(index, 1)
        this.setCurrentQueue(q);
    }

    async downloadTrack(track_id) {
        if (!this.ready) return null;

        let response = await fetch(this.server + '/api/stream/' + track_id + `?session=${this.session}`, {
            method: "GET",
            credentials: "include"
        }).then((response) => {
            return response.blob();
        });
        return response;
    }

    async deletePlaylist(playlist_id) {
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete` + `?session=${this.session}`, {
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
        let response = await fetch(this.server + `/api/playlist/${playlist_id}/delete_track` + `?session=${this.session}`, {
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
        let response = await fetch(this.server + `/api/${type}/${id}/love` + `?session=${this.session}`, {
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
        let response = await fetch(this.server + `/api/${type}/${id}/unlove` + `?session=${this.session}`, {
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
        let response = await fetch(this.server + '/api/lyrics' + `?session=${this.session}`, {
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

    async lastfm_artist_page(artist) {
        let response = await fetch(this.server + '/api/lastfm/artist' + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "artist": artist
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async radio() {
        // Disable radio in groupSession
        if (this.inGroupSession()) {
            window.dispatchEvent(new CustomEvent('notify', {
                detail: {
                    "title": "You can't use radio while in a group session."
                }
            }));
            return
        }

        store.playing.radio = !store.playing.radio;
        if (!store.playing.radio) {
            return
        }

        let queue = this.getCurrentQueue();
        if (queue.length == 0) {
            this.API('/random/track').then((response) => {
                this.load_track(response.track);
                this.addToQueue([response.track]);
            });
        }
    }

    // howler is inconsistent, using this instead
    async seek(time) {
        this.player._sounds[0]._node.currentTime = time;
    }

    getCurrentQueue() {
        let queue_key = (store.peer_status == 'connected') ? 'group_queue' : 'queue';
        return store[queue_key];
    }

    inGroupSession() {
        return store.peer_status == 'connected';
    }

    getStore() {
        return store;
    }

    setCurrentQueue(q) {
        let queue_key = (store.peer_status == 'connected') ? 'group_queue' : 'queue';
        store[queue_key] = q;
    }

    reset() {
        store.playing.is_playing = false;
        store.playing.loaded = false;
        store.playing.seek = 0;
        store.playing.progress = 0;
        this.player.unload();

    }

    async lastfm_auth(token) {
        let response = await fetch(this.server + `/api/lastfm/auth` + `?session=${this.session}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": token
            }),
            credentials: "include"
        }).then((response) => {
            return response.json();
        });
        return response;
    }

    async get_address(hostname) {
        return await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${hostname}.json`)
            .then(response => response.json())
            .then(data => {
                return data.address;
            })
            .catch(() => null);
    }
}

export { Forte }