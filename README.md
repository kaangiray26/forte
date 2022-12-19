![forte](client/src/public/images/favicon.svg)
# Forte
![](https://img.shields.io/badge/-OWN%20YOUR%20MUSIC-red)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/kaangiray26/forte)

**Self-hosted, music streaming platform**

## Server Setup
1. `git clone https://github.com/kaangiray26/forte.git`
2. `cd forte/server`
3. `npm install`
4. `npx greenlock init --config-dir ./greenlock.d --maintainer-email '<your email here>'`
5. `npx greenlock add --subject yourdomain.tld --altnames yourdomain.tld`
6. Change the library path in `server/config.json`
7. Install and start a postgresql database with a database named `forte` with a user named `forte` on `localhost:5432`
8. `sudo node start`

## Screenshots

![image_1](images/image_1.png)

![image_2](images/image_2.png)

![image_3](images/image_3.png)