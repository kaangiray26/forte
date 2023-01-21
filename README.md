![forte](client/src/public/images/favicon.svg)
# Forte
![](https://img.shields.io/badge/-OWN%20YOUR%20MUSIC-red)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/kaangiray26/forte)

**Self-hosted, music streaming platform**

## Features
* Add tracks and albums to your queue
* Listen to radio streams
* Mark your favorite tracks, albums, artists, playlists
* Create playlists
* Specialized context menus
* Desktop / Mobile Player
* Make fuzzy searches
* Add friends
* Playing controls
* Keyboard shortcuts
* Lyrics support

## Screenshots
![image_1](images/image_1.png)
[More screenshots](images/screenshots.md)

## Keyboard Shortcuts
* [**S**] Search
* [**L**] Show Lyrics
* [**Q**] Open Queue
* [**M**] Mute/Unmute
* [**Space**] Play/Pause
* [**Left Arrow**] Previous song
* [**Right Arrow**] Next song

## Server Setup
1. `git clone https://github.com/kaangiray26/forte.git`
2. `cd forte/server`
3. `npm install`
4. `npx greenlock init --config-dir ./greenlock.d --maintainer-email '<your email here>'`
5. `npx greenlock add --subject yourdomain.tld --altnames yourdomain.tld`
6. Change the library path and genius token in `server/config.json`
7. Install and start a postgresql database with a database named `forte` with a user named `forte` on `localhost:5432`
8. `sudo node server.js`