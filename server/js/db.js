// db.js
import { v5 as uuidv5 } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import path from "path";
import glob from 'glob'
import chokidar from "chokidar";
import { parseFile } from 'music-metadata';
import pgPromise from 'pg-promise';
import fs from 'fs';
import crypto from 'crypto';
import readlineSync from 'readline-sync';
import mime from 'mime-types';
import { exit } from 'process';
import { fileURLToPath } from 'url';
import * as openpgp from 'openpgp';

// Path to library
const library_path = '/library';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supported file extensions
const audio_extensions = ["mp3", "m4a", "ogg", "flac", "wav", "aac"];
const image_extensions = ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg"];

// Use environment settings to connect to database.
const pgp = pgPromise();

const db = pgp({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

// Column sets for pg-promise
const cs_artists = new pgp.helpers.ColumnSet(['title', 'cover', 'cover_path', 'path'], { table: 'artists' });
const cs_albums = new pgp.helpers.ColumnSet(['title', 'cover', 'cover_path', 'artist', 'nb_tracks', 'genre', 'year', 'date', 'path'], { table: 'albums' });
const cs_tracks = new pgp.helpers.ColumnSet(['title', 'cover', 'cover_path', 'artist', 'album', 'track_position', 'disc_number', 'path'], { table: 'tracks' });

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp}: ${message}\n`;

    fs.appendFile(path.join(__dirname, "../forte.log"), logLine, (err) => {
        if (err) {
            console.error(`Error writing to log file: ${err}`);
        }
    });
}

async function _init(args) {
    // Reset tables on request
    if (args.includes('--reset')) {
        let answer = readlineSync.question("Do you really want to reset? (y/n)");
        if (answer === 'y') {
            log("=> Resetting tables...");
            await db.none("DROP VIEW IF EXISTS fuzzy");
            await db.none("DROP TABLE IF EXISTS config, artists, albums, playlists, tracks, library, auth, users");
            fs.readdir(path.join(__dirname, "../uploads"), (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(__dirname, "../uploads", file), (err) => {
                        if (err) throw err;
                    });
                }
            });
            log("=> OK")
        }
    }

    // Create tables if they don't exist
    db.tx('creating_tables', t => {
        log("\n=> Checking tables...");
        return t.batch([
            // config
            t.none("CREATE TABLE IF NOT EXISTS config (id SERIAL PRIMARY KEY, name TEXT NOT NULL, value TEXT NOT NULL, UNIQUE(name))"),

            // challenges
            t.none("CREATE TABLE IF NOT EXISTS challenges (id SERIAL PRIMARY KEY, value TEXT NOT NULL, UNIQUE(value))"),

            // pgp keys
            t.none("CREATE TABLE IF NOT EXISTS pgp (id SERIAL PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, value TEXT NOT NULL, UNIQUE(name, type))"),

            // artists
            t.none("CREATE TABLE IF NOT EXISTS artists (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'artist', title TEXT NOT NULL, cover TEXT, cover_path TEXT, path TEXT NOT NULL, uuid TEXT, UNIQUE(title))"),

            // albums
            t.none("CREATE TABLE IF NOT EXISTS albums (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'album', title TEXT NOT NULL, cover TEXT, cover_path TEXT, artist SERIAL, nb_tracks SMALLINT, genre TEXT[], year SMALLINT, date DATE, path TEXT NOT NULL, uuid TEXT, UNIQUE(title, artist))"),

            // playlists
            t.none("CREATE TABLE IF NOT EXISTS playlists(id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'playlist', title TEXT NOT NULL, cover TEXT, author TEXT, tracks INTEGER[], uuid TEXT, UNIQUE(title, author))"),

            // tracks
            t.none("CREATE TABLE IF NOT EXISTS tracks (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'track', title TEXT NOT NULL, cover TEXT, cover_path TEXT, artist SERIAL, album SERIAL, track_position SMALLINT, disc_number SMALLINT, path TEXT NOT NULL, uuid TEXT, UNIQUE(title, artist, album))"),

            // library
            t.none("CREATE TABLE IF NOT EXISTS library (id SERIAL PRIMARY KEY, items VARCHAR[])"),

            // auth
            t.none("CREATE TABLE IF NOT EXISTS auth (id SERIAL PRIMARY KEY, username TEXT NOT NULL, hash TEXT NOT NULL, UNIQUE(username))"),

            // users
            t.none("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, type VARCHAR DEFAULT 'user', username TEXT NOT NULL, token TEXT NOT NULL, session TEXT DEFAULT 'null', cover TEXT, history INTEGER[10], fav_tracks INTEGER[], fav_albums INTEGER[], fav_artists INTEGER[], fav_playlists INTEGER[], fav_stations INTEGER[], friends VARCHAR[], lastfm TEXT, uuid TEXT, UNIQUE(username, token, session))"),

            // fuzzy
            t.none("CREATE OR REPLACE VIEW fuzzy AS SELECT artists.id id, artists.uuid uuid, artists.type type, artists.title title, artists.cover cover FROM artists UNION SELECT albums.id, albums.uuid, albums.type, albums.title, albums.cover FROM albums UNION SELECT tracks.id, tracks.uuid, tracks.type, tracks.title, tracks.cover FROM tracks UNION SELECT playlists.id, playlists.uuid, playlists.type, playlists.title, playlists.cover FROM playlists UNION SELECT users.id, users.uuid, users.type, users.username, users.cover FROM users;"),
        ])
    }).then(() => {
        db.manyOrNone("SELECT * from config")
            .then(async function (data) {
                if (!data.length) {
                    log("=> No config found. Creating a new one...");
                    await db.none("INSERT INTO library(items) VALUES ($1)", [[]])
                    await db.none("INSERT INTO config(name, value) VALUES ('password', 'a04fe4e390a7c7d5d4583f85d24e164d')")
                    await db.none("INSERT INTO config(name, value) VALUES ('genius_token', '-EZLIW0uQaobG3HjE2yJzdl7DPuaIkXXDGX7l8KJm4jv2S4feDYZMUoIRuZOmoO5')")
                    await db.none("INSERT INTO config(name, value) VALUES ('lastfm_api_key', '1ff0a732f00d53529d764cf4ce9270e5')")
                    await db.none("INSERT INTO config(name, value) VALUES ('lastfm_api_secret', '10853915c49c53886b4c87fa0e27f663')")

                    // Create PGP keys if they don't exist
                    let passphrase = crypto.randomBytes(16).toString("hex");
                    let { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
                        userIDs: [{ name: 'Forte', email: 'kaangiray26@protonmail.com' }],
                        passphrase: passphrase,
                        format: 'armored'
                    });

                    // Convert to Base64 and save to the database
                    await db.none("INSERT INTO pgp(name, type, value) VALUES ('forte', 'passphrase', $1)", [passphrase]);
                    await db.none("INSERT INTO pgp(name, type, value) VALUES ('forte', 'public', $1)", [publicKey]);
                    await db.none("INSERT INTO pgp(name, type, value) VALUES ('forte', 'private', $1)", [privateKey]);
                    await db.none("INSERT INTO pgp(name, type, value) VALUES ('forte', 'revocation', $1)", [revocationCertificate]);
                }
                log("=> OK")

                // Get public key from the GitHub repo
                let key = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${process.env.hostname}.json`)
                    .then(response => response.json())
                    .then(data => {
                        return data.public_key;
                    })
                    .catch(() => null);

                if (!key) {
                    log("==> Public Key is not present in the GitHub repo, you won't be able to communicate with federated servers. Please check https://github.com/kaangiray26/forte/tree/servers");
                    return;
                }

                // Get public key from the database
                let publicKey = await db.oneOrNone("SELECT value FROM pgp WHERE type = 'public'");

                // Check if the public keys match
                if (key == publicKey.value) {
                    log("==> Public Key confirmed.");
                } else {
                    log("==> Public Key mismatch!");
                }

                refresh_library()
            })
    }).catch(error => {
        log("An error occured.\n")
        log(error)
        exit(1)
    })
}

async function refresh_library() {
    // Check the library
    await check_library();

    // Update covers in the background
    update_covers();

    // Update uuids in the background
    update_uuids();

    // Watch the library
    let watcher = chokidar.watch(library_path, {
        ignoreInitial: true
    })

    watcher.on('addDir', item => add_watched_dir(item))
    watcher.on('add', item => add_watched_item(item))

    watcher.on('unlink', item => remove_watched_item(item))
    watcher.on('unlinkDir', item => remove_watched_dir(item))
}

async function update_uuids() {
    // Get artists and albums without cover
    let items = await db.manyOrNone("SELECT id, type, title, '0' as artist from artists WHERE uuid is NULL UNION ALL SELECT id, type, title, artist from albums WHERE uuid is NULL UNION ALL SELECT id, type, title, artist from tracks WHERE uuid is NULL");

    // Quota limit
    let batchSize = 50;
    let delay = 5000;

    // Get Last.fm API key
    let lastfm_api_key = await db.one("SELECT value from config WHERE name='lastfm_api_key'");
    lastfm_api_key = lastfm_api_key.value;

    // Create UUIDs from Last.fm URLs
    for (let i = 0; i < items.length; i += batchSize) {
        let batch = items.slice(i, i + batchSize);
        let promises = batch.map((item) => get_uuid_for(item, lastfm_api_key));
        let resolves = await Promise.all(promises);

        // Update metadata in the database
        db.tx(async t => {
            for (let j = 0; j < resolves.length; j++) {
                let item = resolves[j];
                if (item.type == "artist" && item.uuid) {
                    await t.none("UPDATE artists SET uuid=$1, title=$2 WHERE id=$3", [item.uuid, item.title, item.id]);
                    continue;
                }
                if (item.type == "album" && item.uuid) {
                    await t.none("UPDATE albums SET uuid=$1, title=$2 WHERE id=$3", [item.uuid, item.title, item.id]);
                    continue;
                }
                if (item.type == "track" && item.uuid) {
                    await t.none("UPDATE tracks SET uuid=$1, title=$2 WHERE id=$3", [item.uuid, item.title, item.id]);
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve, delay));
    }

}

async function update_covers() {
    // Get artists and albums without cover
    let items = await db.manyOrNone("SELECT id, type, title, '0' as artist from artists WHERE cover is NULL UNION SELECT id, type, title, artist from albums WHERE cover is NULL");

    // Quota limit
    let batchSize = 50;
    let delay = 5000;

    // Get Covers from Deezer
    for (let i = 0; i < items.length; i += batchSize) {
        let batch = items.slice(i, i + batchSize);
        let promises = batch.map((item) => get_cover_for(item));
        let resolves = await Promise.all(promises);

        // Update metadata in the database
        db.tx(async t => {
            for (let j = 0; j < resolves.length; j++) {
                let item = resolves[j];
                if (item.type == "artist" && item.cover) {
                    await t.none("UPDATE artists SET cover=$1 WHERE id=$2", [item.cover, item.id]);
                    continue;
                }
                if (item.type == "album" && item.cover) {
                    await t.none("UPDATE albums SET cover=$1 WHERE id=$2", [item.cover, item.id]);
                    await t.none("UPDATE tracks SET cover=$1 WHERE album=$2", [item.cover, item.id]);
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

async function get_cover_for(obj) {
    return new Promise(async (resolve, reject) => {
        switch (obj.type) {
            case "artist":
                let artist = await get_artist_cover(obj.id, obj.title);
                resolve(artist);
                break;
            case "album":
                let album = await get_album_cover(obj.id, obj.title, obj.artist);
                resolve(album);
                break;
        }
    })
}

async function get_uuid_for(obj, lastfm_api_key) {
    return new Promise(async (resolve, reject) => {
        switch (obj.type) {
            case "artist":
                let artist = await get_artist_uuid(obj.id, obj.title, lastfm_api_key);
                resolve(artist);
                break;
            case "album":
                let album = await get_album_uuid(obj.id, obj.title, obj.artist, lastfm_api_key);
                resolve(album);
                break;
            case "track":
                let track = await get_track_uuid(obj.id, obj.title, obj.artist, lastfm_api_key);
                resolve(track);
                break;
        }
    })
}

async function get_artist_cover(id, title) {
    return new Promise(async (resolve, reject) => {
        fetch('https://api.deezer.com/search/artist?' + new URLSearchParams({
            q: title,
            limit: 1,
            output: 'json'
        })
            .then(response => response.json())
            .then(response => {
                if (!response.total) {
                    resolve({ id: id, type: "artist", cover: null });
                    return
                }
                resolve({ id: id, type: "artist", cover: response.data[0].picture_medium });
                return
            })
            .catch(error => {
                resolve({ id: id, type: "artist", cover: null });
            });
    });
}

async function get_album_cover(id, title, artist_id) {
    return new Promise(async (resolve, reject) => {
        let artist = await db.oneOrNone("SELECT title FROM artists WHERE id=$1", [artist_id]);
        if (!artist) {
            resolve({ id: id, type: "album", cover: null });
            return
        }
        fetch('https://api.deezer.com/search/album?' + new URLSearchParams({
            q: artist.title + " " + title,
            limit: 1,
            output: 'json'
        })
            .then(response => response.json())
            .then(response => {
                if (!response.total) {
                    resolve({ id: id, type: "album", cover: null });
                    return
                }
                resolve({ id: id, type: "album", cover: response.data[0].cover_medium });
                return
            })
            .catch(error => {
                resolve({ id: id, type: "album", cover: null });
            });
    });
}

async function get_artist_uuid(id, title, lastfm_api_key) {
    return new Promise(async (resolve, reject) => {
        fetch('https://ws.audioscrobbler.com/2.0/?' + new URLSearchParams({
            method: 'artist.getcorrection',
            artist: title,
            api_key: lastfm_api_key,
            format: 'json'
        }), {
            headers: {
                'User-Agent': 'Forte/3.1 ( kaangiray26@protonmail.com )'
            }
        })
            .then(response => response.json())
            .then(response => {
                if (!response.corrections.hasOwnProperty("correction")) {
                    resolve({ id: id, type: "artist", title: null, uuid: null, reason: 2 });
                    return
                }
                resolve({ id: id, type: "artist", title: response.corrections.correction.artist.name || title, uuid: uuidv5(response.corrections.correction.artist.url, uuidv5.URL) });
                return
            })
            .catch(error => {
                resolve({ id: id, type: "artist", title: null, uuid: null, reason: 3 });
            });
    });
}

async function get_album_uuid(id, title, artist_id, lastfm_api_key) {
    return new Promise(async (resolve, reject) => {
        let artist = await db.oneOrNone("SELECT title FROM artists WHERE id=$1", [artist_id]);
        if (!artist) {
            resolve({ id: id, type: "album", uuid: null, reason: 1 });
            return
        }
        fetch('https://ws.audioscrobbler.com/2.0/?' + new URLSearchParams({
            method: 'album.getcorrection',
            artist: artist.title,
            album: title,
            api_key: lastfm_api_key,
            format: 'json'
        }), {
            headers: {
                'User-Agent': 'Forte/3.1 ( kaangiray26@protonmail.com )'
            }
        })
            .then(response => response.json())
            .then(response => {
                if (!response.corrections.hasOwnProperty("correction")) {
                    resolve({ id: id, type: "album", title: null, uuid: null, reason: 2 });
                    return
                }
                resolve({ id: id, type: "album", title: response.corrections.correction.album.name || title, uuid: uuidv5(response.corrections.correction.album.url, uuidv5.URL) });
                return
            })
            .catch(error => {
                resolve({ id: id, type: "album", title: null, uuid: null, reason: 3 });
            });
    });
}

async function get_track_uuid(id, title, artist_id, lastfm_api_key) {
    return new Promise(async (resolve, reject) => {
        let artist = await db.oneOrNone("SELECT title FROM artists WHERE id=$1", [artist_id]);
        if (!artist) {
            resolve({ id: id, type: "track", uuid: null, reason: 1 });
            return
        }
        fetch('https://ws.audioscrobbler.com/2.0/?' + new URLSearchParams({
            method: 'track.getcorrection',
            artist: artist.title,
            track: title,
            api_key: lastfm_api_key,
            format: 'json'
        }), {
            headers: {
                'User-Agent': 'Forte/3.1 ( kaangiray26@protonmail.com )'
            }
        })
            .then(response => response.json())
            .then(response => {
                if (!response.corrections.hasOwnProperty("correction")) {
                    resolve({ id: id, type: "track", title: null, uuid: null, reason: 2 });
                    return
                }
                resolve({ id: id, type: "track", title: response.corrections.correction.track.name || title, uuid: uuidv5(response.corrections.correction.track.url, uuidv5.URL) });
                return
            })
            .catch(error => {
                resolve({ id: id, type: "track", title: null, uuid: null, reason: 3 });
            });
    });
}

async function check_library() {
    // Check if the library is empty
    let items = await glob("**/*", {
        cwd: library_path,
        absolute: true,
    });

    if (!items.length) {
        log("=> The library is empty.");
        return;
    }

    // Check if the old library exists
    let library = await db.oneOrNone("SELECT items from library");

    // Update the library
    db.none("UPDATE library SET items = $1", [items]);

    // If the library is empty, add all the folders
    if (!library.items.length) {
        log("=> The library is empty. Adding all the items...");
        items.map(item => add_item(item));
        return;
    }

    // Get added items
    let added_items = items.filter(item => !library.items.includes(item));

    // Get newly added directories
    let new_dirs = added_items.filter(item => fs.lstatSync(item).isDirectory());
    new_dirs.map(dir => add_artist_album(dir));

    // Get newly added tracks and covers
    let new_tracks_covers = added_items.filter(item => (!new_dirs.some(dir => item.startsWith(dir))));
    new_tracks_covers.map(item => add_track_cover(item));

    // Get removed items
    let removed_items = library.items.filter(item => !items.includes(item));
    removed_items.map(item => remove_item(item));
}

async function add_watched_dir(item) {
    await db.none("UPDATE library SET items = items || ARRAY[$1]::VARCHAR[] WHERE not(items @> ARRAY[$1]::VARCHAR[])", [item]);

    // Check the type of the item
    let relative = path.relative(library_path, item);
    let depth = relative.split(path.sep).length;

    if (depth == 2) {
        handle_album(item);
        return
    }

    if (depth == 1) {
        handle_artist(item);
        return
    }
}

async function add_watched_item(item) {
    await db.none("UPDATE library SET items = items || ARRAY[$1]::VARCHAR[] WHERE not(items @> ARRAY[$1]::VARCHAR[])", [item]);

    // Check the type of the item
    if (audio_extensions.some(ext => item.endsWith(ext))) {
        add_track(item);
        return
    }

    // Check if the item is a cover
    if (image_extensions.some(ext => item.endsWith(ext))) {
        add_cover(item);
        return
    }
}

async function add_track_cover(item) {
    // Check the type of the item
    if (audio_extensions.some(ext => item.endsWith(ext))) {
        add_track(item);
        return
    }

    // Check if the item is a cover
    if (image_extensions.some(ext => item.endsWith(ext))) {
        add_cover(item);
        return
    }
}

async function remove_watched_dir(item) {
    // Check the type of the directory
    let relative = path.relative(library_path, item);
    let seps = relative.split(path.sep);

    // Check if the item is an album directory
    if (seps.length == 2) {
        remove_album(item);
        return
    }

    // Check if the item is an artist directory
    if (seps.length == 1) {
        remove_artist(item)
        return
    }
}

async function remove_watched_item(item) {
    // Check if the item is a cover
    if (mime.lookup(item) && mime.lookup(item).startsWith('image')) {
        remove_cover(item);
        return
    }

    // Check if the item is a track
    if (mime.lookup(item) && mime.lookup(item).startsWith('audio')) {
        remove_track(item);
        return
    }
}

async function remove_item(item) {
    // Check if the item is a cover
    if (mime.lookup(item) && mime.lookup(item).startsWith('image')) {
        remove_cover(item);
        return
    }

    // Check if the item is a track
    if (mime.lookup(item) && mime.lookup(item).startsWith('audio')) {
        remove_track(item);
        return
    }

    // Check the type of the directory
    let relative = path.relative(library_path, item);
    let seps = relative.split(path.sep);

    // Check if the item is an album directory
    if (seps.length == 2) {
        remove_album(item);
        return
    }

    // Check if the item is an artist directory
    if (seps.length == 1) {
        remove_artist(item)
        return
    }
}

async function remove_album(item) {
    // Get the album
    let album = await db.oneOrNone("DELETE FROM albums WHERE path = $1 RETURNING id", item);

    if (!album) {
        log("=> Warning: " + item);
        log("=> The album is already possibly removed, skipping...");
        return;
    }

    // Remove the tracks
    await db.none("DELETE FROM tracks WHERE album = $1", album.id);

    log("=> Removed album: " + item);
}

async function remove_artist(item) {
    // Get the artist
    let artist = await db.oneOrNone("DELETE FROM artists WHERE path = $1 RETURNING id", item);

    if (!artist) {
        log("=> Error: " + item);
        log("=> The artist is already possibly removed, skipping...");
        return;
    }

    // Remove the albums
    await db.any("DELETE FROM albums WHERE artist = $1", artist.id);

    // Remove the tracks
    await db.none("DELETE FROM tracks WHERE artist = $1", artist.id);

    log("=> Removed artist: " + item);
}

async function add_cover(cover) {
    let relative = path.relative(library_path, cover);
    let seps = relative.split(path.sep);

    // Check if the cover is for an album or an artist
    if (seps.length == 2) {
        add_artist_cover(cover);
        return
    }

    if (seps.length == 3) {
        add_album_cover(cover);
        return
    }
}

async function add_artist_cover(cover) {
    let dir = path.dirname(cover);

    // Copy the cover to the uploads folder
    let cover_id = crypto.randomBytes(16).toString("hex");
    fs.copyFileSync(cover, path.join(__dirname, "../uploads", cover_id));

    // Get the artist
    let artist = await db.oneOrNone("SELECT id from artists WHERE path = $1", dir);
    if (!artist) {
        log("=> Error: " + cover);
        log("=> The artist for the cover is unknown, skipping...");
        return
    }

    // Add the cover to the artist
    await db.none("UPDATE artists SET cover = $1, cover_path = $2 WHERE id = $3", [cover_id, cover, artist.id]);

    log("=> Added cover: " + cover);
}

async function add_album_cover(cover) {
    let dir = path.dirname(cover);

    // Copy the cover to the uploads folder
    let cover_id = crypto.randomBytes(16).toString("hex");
    fs.copyFileSync(cover, path.join(__dirname, "../uploads", cover_id));

    // Get the album
    let album = await db.oneOrNone("SELECT id from albums WHERE path = $1", dir);
    if (!album) {
        log("=> Error: " + cover);
        log("=> The album for the cover is unknown, skipping...");
        return
    }

    // Add the cover to the album
    await db.none("UPDATE albums SET cover = $1, cover_path = $2 WHERE id = $3", [cover_id, cover, album.id]);

    // Add the cover to the tracks
    await db.none("UPDATE tracks SET cover = $1, cover_path = $2 WHERE album = $3", [cover_id, cover, album.id]);

    log("=> Added cover: " + cover);
}

async function add_track(track,
    metadata = {
        common: {
            album: null,
            artist: null,
            genre: null,
            year: null,
            data: null,
        }
    }) {


    // Get metadata
    metadata = await get_metadata(track);

    // Get the artist
    let artist = await db.oneOrNone("SELECT id from artists WHERE path = $1", metadata.common.artist_path);

    // Get the album
    let album = await db.oneOrNone("SELECT id from albums WHERE path = $1", metadata.common.album_path);

    // If the artist or album doesn't exist, raise an error
    if (!artist || !album) {
        log("=> Warning: " + track);
        log("=> The album or artist for the track is unknown, skipping...");
        return
    }

    // Add the track to the database
    await db.none("INSERT INTO tracks (title, cover, cover_path, artist, album, track_position, disc_number, path) SELECT $1, cover, cover_path, $2, $3, $4, $5, $6 FROM albums WHERE id = $3 ON CONFLICT (title, artist, album) DO NOTHING", [metadata.common.title, artist.id, album.id, metadata.common.track.no, metadata.common.disk.no, track])

    // Add the track to the album
    await db.none("UPDATE albums SET nb_tracks = nb_tracks + 1 WHERE id = $1", album.id);

    log("=> Added track: " + track);
}

async function add_artist_album(item) {
    // Check the type of the item
    let relative = path.relative(library_path, item);
    let depth = relative.split(path.sep).length;

    if (depth == 2) {
        handle_album(item);
    }
}

async function remove_track(item) {
    // Remove the track from the database
    let track = await db.oneOrNone("DELETE FROM tracks WHERE path = $1 RETURNING album", item);

    if (!track) {
        log("=> Warning: " + item);
        log("=> The track is already possibly removed, skipping...");
        return
    }

    // Remove the track from the album
    await db.none("UPDATE albums SET nb_tracks = nb_tracks - 1 WHERE id = $1", track.album);

    log("=> Removed track: " + item);
}

async function remove_artist_cover(cover) {
    // Get cover id
    let artist = await db.oneOrNone("SELECT cover FROM artists WHERE cover_path = $1", cover);
    if (artist) {
        // Remove the cover from the uploads folder
        fs.unlinkSync(path.join(__dirname, "../uploads", artist.cover));
    }

    // Update the artist cover
    await db.none("UPDATE artists SET cover = NULL, cover_path = NULL WHERE cover_path = $1", cover);

    log("=> Removed cover: " + cover);
}

async function remove_album_cover(cover) {
    // Get cover id
    let album = await db.oneOrNone("SELECT cover FROM albums WHERE cover_path = $1", cover);
    if (album) {
        // Remove the cover from the uploads folder
        fs.unlinkSync(path.join(__dirname, "../uploads", album.cover));
    }

    // Update the album cover
    await db.none("UPDATE albums SET cover = NULL, cover_path = NULL WHERE cover_path = $1", cover);

    // Update the tracks cover
    await db.none("UPDATE tracks SET cover = NULL, cover_path = NULL WHERE cover_path = $1", cover);

    log("=> Removed cover: " + cover);
}

async function remove_cover(cover) {
    let relative = path.relative(library_path, cover);
    let seps = relative.split(path.sep);

    // Check if the cover is for an album or an artist
    if (seps.length == 2) {
        remove_artist_cover(cover);
        return
    }

    if (seps.length == 3) {
        remove_album_cover(cover);
        return
    }
}

async function add_item(item) {
    // Check if the item is a directory
    let is_dir = fs.lstatSync(item).isDirectory()
    if (is_dir) {
        // Check the type of the item
        let relative = path.relative(library_path, item);
        let depth = relative.split(path.sep).length;

        if (depth == 2) {
            handle_album(item);
        }
    }
}

async function handle_artist(item, artist_name = null) {
    // Get the artist name
    if (!artist_name) {
        artist_name = path.basename(item);
    }

    // Get the artist cover
    let covers = await glob("cover.*", {
        cwd: item,
        absolute: true,
    })

    let cover = null;
    if (covers) {
        cover = covers[0];
    }

    // Copy the cover to the uploads folder
    let cover_id = null;
    if (cover) {
        cover_id = crypto.randomBytes(16).toString("hex");
        fs.copyFileSync(cover, path.join(__dirname, "../uploads", cover_id));
    }

    // Add the artist to the database
    log("=> Added artist: " + artist_name);
    return await db.one(pgp.helpers.insert({
        "title": artist_name,
        "cover": cover_id,
        "cover_path": cover,
        "path": item,
    }, cs_artists) + " ON CONFLICT (title) DO UPDATE SET id = artists.id RETURNING id");
}

async function handle_album(item,
    metadata = {
        common: {
            album: null,
            artist: null,
            genre: null,
            year: null,
            data: null,
        }
    }) {

    // Get number of tracks
    let tracks = await glob(`**/*.{${audio_extensions.join()}}`, {
        cwd: item,
        absolute: true,
    });

    // Get metadata
    if (tracks.length) {
        metadata = await get_metadata(tracks[0]);
    } else {
        // Get the album name
        metadata.common.album = path.basename(item);
    }

    // Get the artist ID
    let artist = await handle_artist(path.dirname(item), metadata.common.artist);

    // Get the album cover
    let covers = await glob("cover.*", {
        cwd: item,
        absolute: true,
    });

    let cover = null;
    if (covers) {
        cover = covers[0];
    }

    // Copy the cover to the uploads folder
    let cover_id = null;
    if (cover) {
        cover_id = crypto.randomBytes(16).toString("hex");
        fs.copyFileSync(cover, path.join(__dirname, "../uploads", cover_id));
    }

    // Add the album to the database
    log("=> Added album: " + metadata.common.album);
    let album = await db.one(pgp.helpers.insert({
        "title": metadata.common.album,
        "cover": cover_id,
        "cover_path": cover,
        "artist": artist.id,
        "nb_tracks": tracks.length,
        "genre": metadata.common.genre,
        "year": metadata.common.year,
        "date": format_date(metadata.common.date),
        "path": item
    }, cs_albums) + " ON CONFLICT (title, artist) DO UPDATE SET id = albums.id RETURNING id");

    // Add the tracks to the database
    tracks.map((track) => handle_track(track, artist.id, album.id, cover_id, cover));
}

async function handle_track(track, artist_id, album_id, cover_id, cover) {
    // Get metadata
    let metadata = await get_metadata(track);

    // Add the track to the database
    await db.none(pgp.helpers.insert({
        "title": metadata.common.title,
        "cover": cover_id,
        "cover_path": cover,
        "artist": artist_id,
        "album": album_id,
        "track_position": metadata.common.track.no,
        "disc_number": metadata.common.disk.no,
        "path": track,
    }, cs_tracks) + ' ON CONFLICT (title, artist, album) DO NOTHING');
    log("=> Added track: " + metadata.common.title);
}

async function get_metadata(track, metadata = null) {
    // Get metadata
    try {
        metadata = await parseFile(track);
    } catch (error) {
        log("=> Error parsing metadata for: " + track);

        metadata = {
            common: {
                title: null,
                artist: null,
                album: null,
                genre: null,
                year: null,
                date: null,
                track: {
                    no: null,
                },
                disk: {
                    no: null,
                }
            }
        }
    }

    // Fix fields
    let relative = path.relative(library_path, track);
    let seps = relative.split(path.sep);

    // Fix title
    if (!metadata.common.title) {
        metadata.common.title = path.basename(track).split("-")[1].trim().split(".").slice(0, -1).join(".");
    }

    // Fix genre
    if (!metadata.common.genre) {
        metadata.common.genre = [];
    }

    // Check if under CD directory
    if (seps.some((sep) => sep.startsWith("CD"))) {
        // Fix album
        if (!metadata.common.album) {
            metadata.common.album = path.dirname(path.dirname(track));
        }

        // Fix artist
        if (!metadata.common.artist) {
            metadata.common.artist = path.dirname(path.dirname(path.dirname(track)));
        }

        // Add album path
        metadata.common.album_path = path.dirname(path.dirname(track));

        // Add artist path
        metadata.common.artist_path = path.dirname(path.dirname(path.dirname(track)));

        // Fix track_position and disc_number
        if (!metadata.common.track.no || !metadata.common.disk.no) {
            // Get the track position
            let track_position = path.basename(track).split("-")[0].trim();
            if (track_position) {
                metadata.common.track.no = parseInt(track_position);
            }

            // Get the disc number
            let disc_number = path.dirname(track).slice(-1);
            if (disc_number) {
                metadata.common.disk.no = parseInt(disc_number);
            }
        }

    } else {
        // Fix album
        if (!metadata.common.album) {
            metadata.common.album = path.dirname(track);
        }

        // Fix artist
        if (!metadata.common.artist) {
            metadata.common.artist = path.dirname(path.dirname(track));
        }

        // Add album path
        metadata.common.album_path = path.dirname(track);

        // Add artist path
        metadata.common.artist_path = path.dirname(path.dirname(track));

        // Fix track_position and disc_number
        if (!metadata.common.track.no || !metadata.common.disk.no) {
            // Get the track position
            let track_position = path.basename(track).split("-")[0].trim().slice(-2);
            if (track_position) {
                metadata.common.track.no = parseInt(track_position);
            }

            // Get the disc number
            metadata.common.disk.no = 1;
            let trimmed = path.basename(track).split("-")[0].trim();
            if (trimmed.length == 3) {
                metadata.common.disk.no = parseInt(trimmed[0]);
            }
        }
    }
    return metadata;
}

function format_date(dt) {
    if (new RegExp('^[0-9]{4}$').test(dt)) {
        return dt + "-01-01"
    }
    return dt
}

// API Methods

async function _is_authenticated(args) {
    if (!args.hasOwnProperty('session')) {
        return false
    }
    let user = await db.oneOrNone("SELECT * from users WHERE session = $1", [args.session]);
    if (!user) {
        return false;
    }
    return true;
}

async function _is_federated(args) {
    if (!['session'].every(key => args.hasOwnProperty(key))) {
        return false;
    }

    let challenge = await db.oneOrNone("SELECT * from challenges WHERE value = $1", [args.session]);
    if (!challenge) {
        return false;
    }
    return true;

}

async function _search(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    // Search for UUID
    if (uuidValidate(query)) {
        db.any("SELECT * FROM fuzzy WHERE uuid = $1", [query])
            .then(function (data) {
                res.status(200)
                    .json({ "data": data })
            })
        return;
    }

    // Fuzzy search
    db.any("SELECT * FROM fuzzy WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_artist(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM artists WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_album(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM albums WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _search_track(req, res, next) {
    let query = req.params.query;
    if (!query) {
        res.status(400).json({ "error": "Query parameter not given." });
        return;
    }

    db.any("SELECT * FROM tracks WHERE (title % $1) AND similarity(title, $1) > 0.2 ORDER BY similarity(title, $1) DESC LIMIT 5", [query])
        .then(function (data) {
            res.status(200)
                .json({ "data": data })
        })
}

async function _stream(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.oneOrNone("SELECT path FROM tracks WHERE id = $1", [id])
        .then(function (data) {
            res.status(200)
                .sendFile(data.path)
        })
}

async function _stream_head(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.oneOrNone("SELECT path FROM tracks WHERE id = $1", [id])
        .then(function (data) {
            res.status(200)
                .sendFile(data.path, { headers: { 'Content-Type': true, 'Content-Length': true } })
        })
}

async function _get_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    // Check for uuid
    let column = "id";
    if (id.length == 36) {
        column = "uuid";
    }

    db.task(async t => {
        try {
            let artist = await t.oneOrNone(`SELECT * FROM artists WHERE ${column} = $1`, [id]);

            if (!artist) {
                res.status(404).json({ "error": "Artist not found." });
                return;
            }

            let albums = await t.manyOrNone("SELECT * FROM albums wHERE artist = $1", [artist.id]);
            res.status(200)
                .send(JSON.stringify({
                    "artist": artist,
                    "albums": albums
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_artists(req, res, next) {
    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let artists = await t.manyOrNone("SELECT id, uuid, type, title, cover FROM artists ORDER BY title ASC LIMIT 24 OFFSET $1", [req.params.offset]);
            res.status(200)
                .json({
                    "artists": artists
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_albums(req, res, next) {
    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let albums = await t.manyOrNone("SELECT id, uuid, type, title, cover FROM albums ORDER BY title ASC LIMIT 24 OFFSET $1", [req.params.offset]);
            res.status(200)
                .json({
                    "albums": albums
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_config(req, res, next) {
    db.task(async t => {
        let config = await t.manyOrNone("SELECT * FROM config WHERE name != 'password'");
        res.status(200)
            .json({
                "config": config,
            })
    })
}

async function _get_status(req, res, next) {
    db.task(async t => {
        let total_artists = await db.oneOrNone("SELECT COUNT(*) FROM artists");
        let total_albums = await db.oneOrNone("SELECT COUNT(*) FROM albums");
        let total_tracks = await db.oneOrNone("SELECT COUNT(*) FROM tracks");
        let uuid_completion = await db.oneOrNone("SELECT COUNT(*) FROM (SELECT id FROM artists WHERE uuid IS NOT NULL UNION ALL SELECT id FROM albums WHERE uuid IS NOT NULL UNION ALL SELECT id FROM tracks WHERE uuid IS NOT NULL) t");
        let cover_completion = await db.oneOrNone("SELECT COUNT(*) FROM (SELECT id FROM artists WHERE cover IS NOT NULL UNION ALL SELECT id FROM albums WHERE cover IS NOT NULL) t");
        res.status(200)
            .json({
                "status": {
                    "total_artists": total_artists.count,
                    "total_albums": total_albums.count,
                    "total_tracks": total_tracks.count,
                    "cover_completion": cover_completion.count,
                    "uuid_completion": uuid_completion.count,
                }
            })
    })
}

async function _federated_api(req, res, next) {
    if (!['domain', 'challenge', 'query'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Parameters are not given correctly."
            });
        return;
    }

    // Get server address
    let address = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${req.body.domain}.json`)
        .then(response => response.json())
        .then(data => {
            return data.address;
        })
        .catch(() => null);

    // If server address is not found, return error
    if (!address) {
        res.status(400).json({ "error": "Server not found." });
        return;
    }

    // Check if challenge is given
    if (req.body.challenge) {
        // Send request to the server with the federation header
        let data = await fetch(address + '/api' + req.body.query + `?session=${req.body.challenge}`, {
            headers: {
                'federated': 'true'
            }
        })
            .then(response => response.json())
            .catch(() => {
                return { "error": "Federated server has failed to return a response." }
            });

        data.server = address;
        data.challenge = req.body.challenge;
        res.status(200).send(data);
        return
    }

    // Otherwise, ask the server for identity challenge
    let challenge = await fetch(`${address}/f/challenge/${process.env.hostname}`)
        .then(response => response.json())
        .then(data => {
            return data.challenge;
        })
        .catch(() => null);

    // If challenge is not found, return error
    if (!challenge) {
        res.status(400).json({ "error": "Challenge not found." });
        return;
    }

    // Get private key
    let passphrase = await db.oneOrNone("SELECT value FROM pgp WHERE type = 'passphrase'");
    let privateKeyArmored = await db.oneOrNone("SELECT value FROM pgp WHERE type = 'private'");
    if (!passphrase || !privateKeyArmored) {
        res.status(400).json({ "error": "Keys are not found." });
        return;
    }

    let privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
            armoredKey: privateKeyArmored.value
        }),
        passphrase: passphrase.value
    });

    // Read the message
    let message = await openpgp.readMessage({
        armoredMessage: challenge
    });

    // Decrypt the message
    let { data: session, signatures } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
    });

    // Send request to the server with the federation header
    let data = await fetch(address + '/api' + req.body.query + `?session=${session}`, {
        headers: {
            'federated': 'true'
        }
    })
        .then(response => response.json())
        .catch(() => {
            return { "error": "Federated server has failed to return a response." }
        });

    data.server = address;
    data.challenge = session;
    res.status(200).send(data);
}

async function _get_federation_challenge(req, res, next) {
    let domain = req.params.domain;
    if (!domain) {
        res.status(400).json({ "error": "Domain parameter not given." });
        return;
    }

    // Get public key
    let key = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${domain}.json`)
        .then(response => response.json())
        .then(data => {
            return data.public_key;
        })
        .catch(() => null);

    if (!key) {
        res.status(400).json({ "error": "Domain not registered." });
        return;
    }

    let publicKey = await openpgp.readKey({ armoredKey: key });

    // Generate new challenge
    let challenge = crypto.randomBytes(32).toString('hex');

    // Save challenge to database
    await db.none("INSERT INTO challenges (value) VALUES ($1)", [challenge]);

    // Create encrypted message
    let encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: challenge }),
        encryptionKeys: publicKey
    })

    res.status(200)
        .json({
            "challenge": encrypted
        })
}

async function _get_pgp_keys(req, res, next) {
    db.task(async t => {
        let keys = await db.manyOrNone("SELECT * FROM pgp");
        res.status(200)
            .json({
                "keys": keys
            })
    })
}

async function _update_config(req, res, next) {
    if (!['name', 'value'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "name and value are not given."
            });
        return;
    }

    db.task(async t => {
        try {
            await t.none("UPDATE config SET value = $1 WHERE name = $2", [req.body.value, req.body.name]).then(data => data);
            res.status(200)
                .json({
                    "success": "Config updated."
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    // Check for uuid
    let column = "id";
    if (id.length == 36) {
        column = "uuid";
    }

    db.task(async t => {
        try {
            let album = await t.oneOrNone(`SELECT * FROM albums WHERE ${column} = $1`, [id]);

            if (!album) {
                res.status(404).json({ "error": "Album not found." });
                return;
            }

            let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [album.artist]);
            let tracks = await t.manyOrNone("SELECT * FROM tracks wHERE album = $1", [album.id]);
            res.status(200)
                .send(JSON.stringify({
                    "album": album,
                    "artist": artist,
                    "tracks": tracks
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_album_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE album = $1", [id]);
            res.status(200)
                .send(JSON.stringify({
                    "tracks": tracks
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id]);

            if (!track) {
                res.status(404).json({ "error": "Track not found." });
                return;
            }

            let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [track.artist]);
            let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [track.album]);
            res.status(200)
                .send(JSON.stringify({
                    "track": track,
                    "artist": artist,
                    "album": album
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_track_basic(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    // Check for uuid
    let column = "id";
    if (id.length == 36) {
        column = "uuid";
    }

    db.task(async t => {
        try {
            let track = await t.oneOrNone(`SELECT * FROM tracks WHERE ${column} = $1`, [id]);
            res.status(200)
                .send(JSON.stringify({
                    "track": track
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_track_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_tracks)", [req.query.session, id]);
            if (!loved) {
                res.status(200).json({
                    "loved": false
                })
                return;
            }
            res.status(200).json({
                "loved": true
            })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_artist_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_artists)", [req.query.session, id]);
            if (!loved) {
                res.status(200).json({
                    "loved": false
                })
                return;
            }
            res.status(200).json({
                "loved": true
            })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_album_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_albums)", [req.query.session, id]);
            if (!loved) {
                res.status(200).json({
                    "loved": false
                })
                return;
            }
            res.status(200).json({
                "loved": true
            })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_playlist_loved(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let loved = await t.oneOrNone("SELECT true FROM users WHERE session = $1 AND $2 = ANY(fav_playlists)", [req.query.session, id]);
            if (!loved) {
                res.status(200).json({
                    "loved": false
                })
                return;
            }
            res.status(200).json({
                "loved": true
            })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _admin_login(req, res, next) {
    if (!['username', 'password'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Not authorized."
            }));
        return;
    }
    let username = req.body.username;
    if (username != "forte") {
        res.status(400)
            .json({
                "error": "Not authorized."
            });
        return;
    }

    let hash = crypto.createHash('md5').update(req.body.password).digest("hex")

    db.task(async t => {
        let user = await t.oneOrNone("SELECT value FROM config WHERE name = 'password' AND value = $1", [hash]);
        if (!user) {
            res.status(400)
                .send(JSON.stringify({
                    "error": "Not authorized."
                }));
            return;
        }
        req.session.user = username;
        res.status(200)
            .send(JSON.stringify({
                "success": username
            }));
    })
}

async function _admin_session(req, res, next) {
    if (!req.session.hasOwnProperty('user')) {
        res.status(400).json({
            "error": "Not authorized."
        })
        return;
    }
    res.status(200).json({
        "username": req.session.user
    })
}

async function _get_users(req, res, next) {
    db.task(async t => {
        let users = await t.manyOrNone("SELECT username, cover FROM users");
        res.status(200)
            .send(JSON.stringify({
                "users": users
            }));
    })
}

async function _add_history(req, res, next) {
    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400).json({
            "error": "Track not given."
        });
        return;
    }
    db.task(async t => {
        try {
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
            if (!track) {
                res.status(400).json({
                    "error": "Track not found."
                });
                return;
            }
            await t.oneOrNone("UPDATE users SET history = array_prepend($1, history[0:9]) WHERE session = $2", [req.body.track, req.query.session]);
            res.status(200)
                .json({
                    "success": "History updated."
                });
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_history(req, res, next) {
    db.task(async t => {
        let user = await t.oneOrNone("SELECT history FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({
                "error": "User not found."
            });
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [user.history]);
        res.status(200).json({
            "tracks": tracks
        });
    })
}

async function _get_user_history(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        let user = await t.oneOrNone("SELECT history FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({
                "error": "User not found."
            });
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [user.history]);
        res.status(200).json({
            "tracks": tracks
        });
    })
}

async function _add_user(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Username not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE username = $1", [req.body.username]);
        if (user) {
            res.send(JSON.stringify({
                "error": "Username exists."
            }))
            return
        }

        let token = crypto.randomBytes(16).toString('hex');
        await db.oneOrNone("INSERT INTO users(username, token) VALUES ($1, $2)", [req.body.username, token])
        res.status(200)
            .send(JSON.stringify({
                "success": token
            }))
    })
}

async function _remove_user(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Username not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400)
                .send(JSON.stringify({
                    "error": "Username not found."
                }));
            return;
        }

        await db.none("DELETE FROM users WHERE username = $1", [req.body.username])
        res.status(200)
            .send(JSON.stringify({
                "success": ""
            }))
    })
}

async function _session(req, res, next) {
    if (!['authorization'].every(key => req.headers.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Basic authorization not given."
            }));
        return;
    }
    log(req.session.id, "Session request.");
    let data = req.headers.authorization.split("Basic ")[1];
    let buff = Buffer.from(data, "base64").toString("ascii").split(':');

    db.task(async t => {
        let user = await t.oneOrNone("UPDATE users SET session = $1 WHERE username = $2 AND token = $3 RETURNING id", [req.session.id, buff[0], buff[1]]);
        if (!user) {
            res.status(400).json({
                "status": "error",
                "message": "User not found."
            });
            return;
        }
        res.status(200)
            .send(JSON.stringify({
                "status": "success",
                "message": "Session created.",
                "session": req.session.id
            }))
    })
}

async function _get_profile(req, res, next) {
    db.task(async t => {
        let profile = await t.oneOrNone("SELECT username, cover FROM users WHERE session = $1", [req.query.session]);
        if (!profile) {
            res.status(400)
                .json({
                    "error": "User session not up to date."
                });
            return;
        }
        res.status(200)
            .json({
                "profile": profile
            })
    })
}

async function _get_user(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username, cover FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return
        }
        res.status(200).json({
            "user": user
        })
    })
}

async function _get_federated_user(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username, cover FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return
        }
        res.status(200).json({
            "user": user
        })
    })
}

async function _upload_cover(req, res, next) {
    db.task(async t => {
        await t.none("UPDATE users SET cover = $1 WHERE session = $2", [req.file.filename, req.query.session]);
        res.status(200)
            .json({
                "cover": req.file.filename
            })
    })
}

async function _update_artist(req, res, next) {
    if (!['id', 'cover', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    db.task(async t => {
        try {
            await t.none("UPDATE artists SET cover = $1, title = $2 WHERE id = $3", [req.body.cover, req.body.title, req.body.id]);
            res.status(200)
                .json({
                    "success": "Artist updated."
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _update_album(req, res, next) {
    if (!['id', 'cover', 'title', 'date', 'year', 'genre'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    log(req.body.genre)

    db.task(async t => {
        try {
            await t.none("UPDATE albums SET cover = $1, title = $2, date = $3, year = $4, genre = ARRAY[$5] WHERE id = $6", [req.body.cover, req.body.title, req.body.date, req.body.year, req.body.genre, req.body.id]);
            await t.none("UPDATE tracks SET cover = $1 WHERE album = $2", [req.body.cover, req.body.id]);
            res.status(200)
                .json({
                    "success": "Album updated."
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _update_track(req, res, next) {
    if (!['id', 'cover', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Metadata not given."
            });
        return;
    }

    db.task(async t => {
        try {
            await t.none("UPDATE tracks SET cover = $1, title = $2 WHERE id = $3", [req.body.cover, req.body.title, req.body.id])
            res.status(200)
                .json({
                    "success": "Track updated."
                })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }

    })
}

async function _get_all_albums(req, res, next) {
    let offset = parseInt(req.headers.offset);
    db.task(async t => {
        let albums = await t.manyOrNone("SELECT * FROM albums ORDER BY random() LIMIT 24");
        res.status(200)
            .json({
                "albums": albums
            })
    })
}

async function _get_random_track(req, res, next) {
    db.task(async t => {
        let track = await t.oneOrNone("SELECT * FROM tracks ORDER BY random() LIMIT 1");
        res.status(200)
            .json({
                "track": track
            })
    })
}

async function _get_random_tracks(req, res, next) {
    db.task(async t => {
        let tracks = await t.manyOrNone("SELECT * FROM tracks ORDER BY random() LIMIT 24");
        res.status(200)
            .json({
                "tracks": tracks
            })
    })
}

async function _get_friends(req, res, next) {
    db.task(async t => {
        let data = await t.oneOrNone("SELECT friends FROM users WHERE session = $1", [req.query.session]);
        let friends = await t.manyOrNone("SELECT id, username, cover FROM users WHERE username = ANY($1)", [data.friends]);
        res.status(200).json({
            "friends": friends
        })
    })
}

async function _check_friends(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT friends FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return
        }

        if (!user.friends) {
            res.status(200).json({
                "friend": false
            })
            return
        }

        let friend = user.friends.includes(id);
        res.status(200).json({
            "friend": friend
        })
    })
}

async function _get_user_friends(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let data = await t.oneOrNone("SELECT friends FROM users WHERE username = $1", [id]);
        let friends = await t.manyOrNone("SELECT id, username, cover FROM users WHERE username = ANY($1)", [data.friends]);
        res.status(200).json({
            "friends": friends
        })
    })
}

async function _add_friend(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Username not given."
            });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT id FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        await t.none("UPDATE users SET friends = array_append(friends, $1) WHERE session = $2", [req.body.username, req.query.session]);
        res.status(200).json({ "success": "Friend addded." })
    })
}

async function _remove_friend(req, res, next) {
    if (!['username'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .json({
                "error": "Username not given."
            });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT id FROM users WHERE username = $1", [req.body.username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        await t.none("UPDATE users SET friends = array_remove(friends, $1) WHERE session = $2", [req.body.username, req.query.session]);
        res.status(200).json({ "success": "Friend removed." })
    })
}

async function _get_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }
    db.task(async t => {
        try {
            let playlist = await t.oneOrNone("SELECT * from playlists WHERE id = $1", [id]);
            if (!playlist) {
                res.status(400).json({ "error": "Playlist not found." })
                return;
            }
            let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [playlist.tracks]);
            res.status(200).json({ "playlist": playlist, "tracks": tracks })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return
        }
    })
}

async function _get_profile_playlists(req, res, next) {
    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        let playlists = await t.manyOrNone("SELECT * FROM playlists WHERE author = $1", [user.username]);
        res.status(200).json({ "playlists": playlists })
    })
}

async function _get_profile_tracks(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_tracks FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_tracks) {
            res.status(200).json({ "tracks": [], "total": 0 })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_tracks, offset]);
        res.status(200).json({ "tracks": tracks, "total": user.fav_tracks.length })
    })
}

async function _get_user_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_tracks FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_tracks) {
            res.status(200).json({ "tracks": [], "total": 0 })
            return;
        }
        let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_tracks, offset]);
        res.status(200).json({ "tracks": tracks, "total": user.fav_tracks.length })
    })
}

async function _get_user_albums(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_albums FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_albums) {
            res.status(200).json({ "albums": [], "total": 0 })
            return;
        }
        let albums = await t.manyOrNone("SELECT * FROM albums WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_albums, offset]);
        res.status(200).json({ "albums": albums, "total": user.fav_albums.length })
    })
}

async function _get_user_artists(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    let offset = req.params.offset;
    if (!offset) {
        res.status(400).json({ "error": "Offset parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT fav_artists FROM users WHERE username = $1", [id]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_artists) {
            res.status(200).json({ "artists": [], "total": 0 })
            return;
        }
        let artists = await t.manyOrNone("SELECT * FROM artists WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_artists, offset]);
        res.status(200).json({ "artists": artists, "total": user.fav_artists.length })
    })
}

async function _get_user_playlists(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        let playlists = await t.manyOrNone("SELECT * FROM playlists WHERE author = $1", [id]);
        res.status(200).json({ "playlists": playlists })
    })
}

async function _get_profile_albums(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_albums FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_albums) {
            res.status(200).json({ "albums": [], "total": 0 })
            return;
        }
        let albums = await t.manyOrNone("SELECT * FROM albums WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_albums, offset]);
        res.status(200).json({ "albums": albums, "total": user.fav_albums.length })
    })
}

async function _get_profile_artists(req, res, next) {
    db.task(async t => {
        let offset = req.params.offset;
        if (!offset) {
            res.status(400).json({ "error": "Offset parameter not given." });
            return;
        }
        let user = await t.oneOrNone("SELECT fav_artists FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }
        if (!user.fav_artists) {
            res.status(200).json({ "artists": [], "total": 0 })
            return;
        }
        let artists = await t.manyOrNone("SELECT * FROM artists WHERE id = ANY($1) ORDER BY array_position($1, id) DESC LIMIT 24 OFFSET $2", [user.fav_artists, offset]);
        res.status(200).json({ "artists": artists, "total": user.fav_artists.length })
    })
}

async function _create_playlist(req, res, next) {
    let body = JSON.parse(JSON.stringify(req.body));
    let cover = req.file ? req.file.filename : null;

    if (!['title'].every(key => body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Playlist name not given."
            }));
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
        if (!user) {
            res.status(400).json({ "error": "User not found." })
            return;
        }

        let playlist = await t.oneOrNone("SELECT id FROM playlists WHERE title = $1 AND author = $2", [body.title, user.username]);
        if (playlist) {
            res.status(400).json({ "error": "Playlist exists." })
            return;
        }

        let response = await t.oneOrNone("INSERT INTO playlists (title, cover, author) VALUES ($1, $2, $3) RETURNING id", [body.title, cover, user.username]);
        res.status(200).json({ "playlist_id": response.id })
    })
}

async function _add_track_to_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Track not given."
            }));
        return;
    }

    db.task(async t => {
        try {
            // Checking if the track exists
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
            if (!track) {
                res.status(400).json({ "error": "Track not found." })
                return;
            }

            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Add to playlist
            await t.none("UPDATE playlists SET tracks = array_append(tracks, $1) WHERE id = $2 AND author = $3", [req.body.track, id, user.username]);
            res.status(200).json({ "success": "Track addded." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _delete_track_to_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    if (!['track'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Track not given."
            }));
        return;
    }

    db.task(async t => {
        try {
            // Checking if the track exists
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track]);
            if (!track) {
                res.status(400).json({ "error": "Track not found." })
                return;
            }

            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Add to playlist
            await t.none("UPDATE playlists SET tracks = array_remove(tracks, $1) WHERE id = $2 AND author = $3", [req.body.track, id, user.username]);
            res.status(200).json({ "success": "Track removed." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _get_playlist_tracks(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            let playlist = await t.oneOrNone("SELECT * from playlists WHERE id = $1", [id]);
            if (!playlist) {
                res.status(400).json({ "error": "Playlist not found." })
                return;
            }
            let tracks = await t.manyOrNone("SELECT * FROM tracks WHERE id = ANY($1) ORDER BY array_position($1, id)", [playlist.tracks]);
            res.status(200)
                .send(JSON.stringify({
                    "tracks": tracks
                }))
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _delete_playlist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Delete playlist
            await t.none("DELETE FROM playlists WHERE id = $1 AND author = $2", [id, user.username])
            res.status(200).json({ "success": "Playlist deleted." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _love_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get track
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id])
            if (!track) {
                res.status(400).json({ "error": "Track not found." })
                return;
            }

            // Add track to loved
            await t.none("UPDATE users SET fav_tracks = array_append(fav_tracks, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Track added to loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _unlove_track(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get track
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [id])
            if (!track) {
                res.status(400).json({ "error": "Track not found." })
                return;
            }

            // Add track to loved
            await t.none("UPDATE users SET fav_tracks = array_remove(fav_tracks, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Track removed from loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _love_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get artist
            let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [id]);
            if (!artist) {
                res.status(400).json({ "error": "Artist not found." })
                return;
            }

            // Add artist to loved
            await t.none("UPDATE users SET fav_artists = array_append(fav_artists, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Artist added to loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _unlove_artist(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get artist
            let artist = await t.oneOrNone("SELECT * FROM artists WHERE id = $1", [id]);
            if (!artist) {
                res.status(400).json({ "error": "Artist not found." })
                return;
            }

            // Remove artist from loved
            await t.none("UPDATE users SET fav_artists = array_remove(fav_artists, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Artist removed from loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _love_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get album
            let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [id]);
            if (!album) {
                res.status(400).json({ "error": "Album not found." })
                return;
            }

            // Add album to loved
            await t.none("UPDATE users SET fav_albums = array_append(fav_albums, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Album added to loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _unlove_album(req, res, next) {
    let id = req.params.id;
    if (!id) {
        res.status(400).json({ "error": "ID parameter not given." });
        return;
    }

    db.task(async t => {
        try {
            // Get user
            let user = await t.oneOrNone("SELECT username FROM users WHERE session = $1", [req.query.session]);
            if (!user) {
                res.status(400).json({ "error": "User not found." })
                return;
            }

            // Get album
            let album = await t.oneOrNone("SELECT * FROM albums WHERE id = $1", [id])
            if (!album) {
                res.status(400).json({ "error": "Album not found." })
                return;
            }

            // Remove album from loved
            await t.none("UPDATE users SET fav_albums = array_remove(fav_albums, $1) WHERE username = $2", [id, user.username]);
            res.status(200).json({ "success": "Album removed from loved." })
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
            return;
        }
    })
}

async function _get_lyrics(req, res, next) {
    if (!['artist', 'title'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        // Get artist
        let artist = await t.oneOrNone("SELECT title FROM artists WHERE id = $1", [req.body.artist]);
        if (!artist) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        let genius_token = await t.one("SELECT value FROM config WHERE name = 'genius_token'");
        let data = await fetch('https://api.genius.com/search/?' + new URLSearchParams({
            q: artist.title + ' ' + req.body.title
        }), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + genius_token.value
            }
        }).then((res) => res.json());


        if (!data.response.hits.length) {
            res.status(400).json({ "error": "No lyrics found." });
            return
        }

        let lyric = await fetch(data.response.hits[0].result.url, {
            method: 'GET',
        }).then((res) => res.text());

        res.status(200).json({ "lyrics": lyric })
    })
}

async function _lastfm_auth(req, res, next) {
    if (!['token'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        let lastfm_api = await t.many("SELECT value FROM config WHERE name = 'lastfm_api_key' OR name = 'lastfm_api_secret'");
        let signature = crypto.createHash('md5').update(
            "api_key" + lastfm_api[0].value + "methodauth.getSessiontoken" + req.body.token + lastfm_api[1].value,
        ).digest("hex");

        let response = await fetch("https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({
            method: 'auth.getSession',
            format: 'json',
            token: req.body.token,
            api_key: lastfm_api[0].value,
            api_sig: signature
        }), {
            method: 'GET',
        }).then((res) => res.json());

        if (response.hasOwnProperty('session')) {
            await t.none("UPDATE users SET lastfm = $1 WHERE session = $2", [response.session.name, req.query.session]);
            res.status(200).json({
                "key": response.session.key,
                "username": response.session.name
            });
            return
        }

        res.status(400).json({ "error": "Unauthorized" });
    })
}

async function _get_lastfm_auth(req, res, next) {
    db.task(async t => {
        let lastfm = await t.oneOrNone("SELECT value FROM config WHERE name = 'lastfm_api_key'");
        if (!lastfm.value) {
            res.status(400).json({ "error": "Last.fm API key isn't set." })
            return;
        }

        res.status(200).json({ "api_key": lastfm.value });
    })
}

async function _get_lastfm_artist(req, res, next) {
    if (!['artist'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        let lastfm_api = await t.one("SELECT value FROM config WHERE name = 'lastfm_api_key'");
        let response = await fetch('https://ws.audioscrobbler.com/2.0/?' + new URLSearchParams({
            method: 'artist.getcorrection',
            artist: req.body.artist,
            api_key: lastfm_api.value,
            format: 'json'
        }))
            .then(response => response.json());

        if (!response.corrections.hasOwnProperty('correction')) {
            res.status(400).json({ "error": "Artist not found." })
            return;
        }

        res.status(200).json({ "url": response.corrections.correction.artist.url });
    })
}

async function _lastfm_scrobble(req, res, next) {
    if (!['track', 'sk'].every(key => req.body.hasOwnProperty(key))) {
        res.status(400)
            .send(JSON.stringify({
                "error": "Parameters not given correctly."
            }));
        return;
    }

    db.task(async t => {
        try {
            let track = await t.oneOrNone("SELECT * FROM tracks WHERE id = $1", [req.body.track])
            if (!track) {
                res.status(400).json({ "error": "Track not found." })
                return;
            }

            let artist = await t.oneOrNone("SELECT title FROM artists WHERE id = $1", [track.artist]);
            if (!artist) {
                res.status(400).json({ "error": "Artist not found." })
                return;
            }

            let lastfm_api = await t.many("SELECT value FROM config WHERE name = 'lastfm_api_key' OR name = 'lastfm_api_secret'");
            let params = {
                method: 'track.scrobble',
                artist: artist.title,
                track: track.title,
                timestamp: Math.floor(Date.now() / 1000),
                api_key: lastfm_api[0].value,
                sk: req.body.sk,
            }

            let sig = get_api_sig(params, lastfm_api[1].value);
            params['api_sig'] = sig;
            params['format'] = 'json';

            let response = await fetch("https://ws.audioscrobbler.com/2.0/", {
                method: 'POST',
                body: new URLSearchParams(params)
            }).then((res) => {
                return res.json()
            });

            if (response.scrobbles['@attr'].accepted) {
                res.status(200).json({ "success": "Scrobbled" });
                return
            }

            res.status(400).json({ "error": "Scrobble failed." });
        } catch (e) {
            res.status(500).json({ "error": "Internal server error." });
        }
    })
}

async function _get_lastfm_profile(req, res, next) {
    let username = req.params.username;
    if (!username) {
        res.status(400).json({ "error": "Username parameter not given." });
        return;
    }

    db.task(async t => {
        let user = await t.oneOrNone("SELECT lastfm FROM users WHERE username = $1", [username]);
        if (!user) {
            res.status(400).json({ "error": "User not found." });
            return;
        }

        res.status(200).json({ "lastfm": user.lastfm });
    })
}

function get_api_sig(obj, sig) {
    let keys = Object.keys(obj);
    keys.sort();
    let str = '';
    for (let i = 0; i < keys.length; i++) {
        str += keys[i] + obj[keys[i]];
    }
    str += sig;
    return crypto.createHash('md5').update(str).digest("hex");
}

// Exported functions
const exports = {
    add_friend: _add_friend,
    add_history: _add_history,
    add_track_to_playlist: _add_track_to_playlist,
    add_user: _add_user,
    admin_login: _admin_login,
    admin_session: _admin_session,
    check_friends: _check_friends,
    create_playlist: _create_playlist,
    delete_playlist: _delete_playlist,
    delete_track_to_playlist: _delete_track_to_playlist,
    get_album: _get_album,
    get_album_loved: _get_album_loved,
    get_album_tracks: _get_album_tracks,
    get_albums: _get_albums,
    get_all_albums: _get_all_albums,
    get_artist: _get_artist,
    get_artist_loved: _get_artist_loved,
    get_artists: _get_artists,
    get_config: _get_config,
    federated_api: _federated_api,
    get_status: _get_status,
    get_pgp_keys: _get_pgp_keys,
    get_federation_challenge: _get_federation_challenge,
    get_friends: _get_friends,
    get_history: _get_history,
    get_lastfm_artist: _get_lastfm_artist,
    get_lastfm_auth: _get_lastfm_auth,
    get_lastfm_profile: _get_lastfm_profile,
    get_lyrics: _get_lyrics,
    get_playlist: _get_playlist,
    get_playlist_loved: _get_playlist_loved,
    get_playlist_tracks: _get_playlist_tracks,
    get_profile: _get_profile,
    get_profile_albums: _get_profile_albums,
    get_profile_artists: _get_profile_artists,
    get_profile_playlists: _get_profile_playlists,
    get_profile_tracks: _get_profile_tracks,
    get_random_track: _get_random_track,
    get_random_tracks: _get_random_tracks,
    get_track: _get_track,
    get_track_basic: _get_track_basic,
    get_track_loved: _get_track_loved,
    get_user: _get_user,
    get_federated_user: _get_federated_user,
    get_user_albums: _get_user_albums,
    get_user_artists: _get_user_artists,
    get_user_friends: _get_user_friends,
    get_user_history: _get_user_history,
    get_user_playlists: _get_user_playlists,
    get_user_tracks: _get_user_tracks,
    get_users: _get_users,
    init: _init,
    is_authenticated: _is_authenticated,
    is_federated: _is_federated,
    lastfm_auth: _lastfm_auth,
    lastfm_scrobble: _lastfm_scrobble,
    love_album: _love_album,
    love_artist: _love_artist,
    love_track: _love_track,
    remove_friend: _remove_friend,
    remove_user: _remove_user,
    search: _search,
    search_album: _search_album,
    search_artist: _search_artist,
    search_track: _search_track,
    session: _session,
    stream: _stream,
    stream_head: _stream_head,
    unlove_album: _unlove_album,
    unlove_artist: _unlove_artist,
    unlove_track: _unlove_track,
    update_album: _update_album,
    update_artist: _update_artist,
    update_config: _update_config,
    update_track: _update_track,
    upload_cover: _upload_cover,
}

export default exports