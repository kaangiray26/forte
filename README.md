<!-- TOP -->
<div align="center">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/kaangiray26/forte?style=flat-square">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/kaangiray26/forte?style=flat-square">
    <img alt="License" src="https://img.shields.io/github/license/kaangiray26/forte.svg?style=flat-square">
    <img alt="Website" src="https://img.shields.io/website?down_color=red&down_message=offline&style=flat-square&up_color=success&up_message=online&url=https%3A%2F%2Fforte.buzl.uk">
</div>

<br>
<div align="center">
    <a href="https://github.com/kaangiray26/forte">
        <img src="client/src/public/images/favicon.svg" alt="Forte Logo" width="80" height="80">
    </a>
    <h1 align="center">Forte</h1>
    <img alt="Quote" src="https://img.shields.io/badge/OWN%20YOUR%20MUSIC-blue?style=flat-square">
    <p align="center">
        Self-hosted, music streaming platform
        <br />
        <a href="https://forte.buzl.uk/"><strong>Open the Web Player »</strong></a>
        <br />
        <br />
        <a href="https://github.com/kaangiray26/forte/issues">Report Bug</a>
        ·
        <a href="https://github.com/kaangiray26/forte/issues">Request Feature</a>
    </p>
</div>


<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About the project</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#built-with">Built with</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#keyboard-shortcuts">Keyboard Shortcuts</a></li>
    <li><a href="#logging-in">Logging in</a></li>
    <li>
        <a href="#creating-your-own-server">Creating your own server</a>
        <ul>
            <li><a href="#using-locally">Using locally</a></li>
            <li><a href="#using-publicly">Using publicly</a></li>
      </ul>
    </li>
    <li><a href="#forte-dashboard"></a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>
<br/>

![image_1](images/image_1.png)
[More screenshots](images/screenshots.md)

## About the project
forte is a self-hosted music platform. You can either **connect to a forte server** or **create your own server** for your friends & family. However, it is also very convenient to use forte on your local machine as a **stand-alone music player**. Follow this guide to learn how to connect and how to build your own forte server.

## Features
* [x] Add tracks and albums to your queue
* [x] Mark your favorite tracks, albums, artists, playlists
* [x] Endless listening with radio feature
* [x] Create playlists
* [x] Desktop / Mobile Player
* [x] Listen to TuneIn stations
* [x] Specialized context menus
* [x] Make fuzzy searches
* [x] Add friends
* [x] Playing controls
* [x] Keyboard shortcuts
* [x] Lyrics support
* [x] MediaSession API
* [x] Progressive Web App
* [x] Group Sessions
* [x] Admin dashboard
* [x] User profiles
* [x] Last.fm Scrobbling

## Built with
* ![Vue.js](https://img.shields.io/badge/Vue.js-d3d4d5?style=flat-square&logo=vuedotjs&logoColor=4FC08D)
* ![Node.js](https://img.shields.io/badge/Node.js-d3d4d5?style=flat-square&logo=nodedotjs&logoColor=339933)
* ![Express.js](https://img.shields.io/badge/Express-d3d4d5?style=flat-square&logo=express&logoColor=000000)
* ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-d3d4d5?style=flat-square&logo=postgresql&logoColor=4169E1)
* ![Bootstrap](https://img.shields.io/badge/Bootstrap-d3d4d5?style=flat-square&logo=bootstrap&logoColor=7952B3)
* ![PeerJS](https://img.shields.io/badge/PeerJS-d3d4d5?style=flat-square)
* ![howler.js](https://img.shields.io/badge/howler.js-d3d4d5?style=flat-square)
* ![hammer.js](https://img.shields.io/badge/hammer.js-d3d4d5?style=flat-square)
* ![Anime.js](https://img.shields.io/badge/Anime.js-d3d4d5?style=flat-square)
* ![Greenlock](https://img.shields.io/badge/Greenlock%20Express-d3d4d5?style=flat-square)

## Documentation
* Click [here](docs/api_documentation.md) for the API documentation.

## Usage
If you know a forte server and just want to connect to use the service, go to https://forte.buzl.uk. The webpage is hosted with GitHub pages and uses the latest forte version. Therefore, this is the **recommended way** to access forte services.

If you want to use forte on your mobile device, we suggest using the [PWA](https://en.wikipedia.org/wiki/Progressive_web_application) version of the application. You can access the PWA version by going to https://forte.buzl.uk on your mobile device and clicking on the `Add to Home Screen` button.

**However, Forte works best with the Chrome browser on your mobile device.**

## Keyboard Shortcuts
![Search](https://img.shields.io/badge/Ctrl%2BK-Search-blue)

![Left Arrow](https://img.shields.io/badge/%E2%86%90-Previous-blue)
![Space](https://img.shields.io/badge/Space-Play%2FPause-blue)
![Right Arrow](https://img.shields.io/badge/%E2%86%92-Next-blue)

![Group Session](https://img.shields.io/badge/G-Group%20Session-blue)
![Lyrics](https://img.shields.io/badge/L-Lyrics-blue)
![Mute](https://img.shields.io/badge/M-Mute-blue)
![Queue](https://img.shields.io/badge/Q-Queue-blue)

## Logging in
Once you go to the website, you will be prompted with this dialog:

![image_4](images/image_4.png)

Here's an explanation for the fields:
```
Forte server: The public address of the forte server.
Username    : The username given to you by the server.
Token       : The token given to you by the server.
```

If you are wondering about how to create accounts, this will be explained in the `Creating your own server` section.

Here's an example for the authorization:

![image_5](images/image_5.png)

If you log in successfully, you will see the homepage of the application, where some track recommendations can be found. Now you can use the application and listen to some music.

Once you log in, your authorization parameters will be saved on the local session of your browser. However, if you ever want to reset these information, you can right click on the `Profile` button on the top right of the screen, you will see an option to `Reset`. This will clear the local storage along with your session storage.

## Creating your own server
To build and host your own server you need a decent computer as we will be dealing with multiple users and streaming audio files to them. In the remaining of this section, we will be going over the steps of building the server. However, we won't be focusing on installing the PostgreSQL server.

Before you go through the following steps, you need a PostgreSQL server with a database named `forte`, a user named `forte`, working on `localhost:5432`.

Follow these steps to install the forte server on your machine.
```
git clone https://github.com/kaangiray26/forte.git
```
```
cd forte/server
```
```
npm install
```

### Using locally
```
node local.js
```

### Using publicly
```
npx greenlock init --config-dir ./greenlock.d --maintainer-email '<your email here>'
```
```
npx greenlock add --subject yourdomain.tld --altnames yourdomain.tld
```
```
sudo node server.js
```

## Forte dashboard
You can access the forte dashboard by going to `http://localhost:3000`. The default login credentials are: `forte` and `alternative`. While in dashboard, don't forget to change the `library_path` and `genius_token` fields in the `Config` tab. Also, please change the default password from the `Password` tab.

## License
Distributed under the GPL-3.0 License. See `LICENSE` for more information.

## Contact
Kaan Giray Buzluk - [@kaangiray26](https://twitter.com/kaangiray26) - kaangiray26 (at) protonmail.com

Project Link: [https://github.com/kaangiray26/forte](https://github.com/kaangiray26/forte)

## Acknowledgements
Check out the following list of resources that I've used to build **forte**.

* [Img Shields](https://shields.io)
* [PeerJS](https://peerjs.com/)
* [Howler.js](https://howlerjs.com/)
* [Hammer.js](https://hammerjs.github.io)
* [Greenlock Express](https://www.npmjs.com/package/greenlock-express)
* [Bootstrap](https://getbootstrap.com/)
* [Bootstrap Icons](https://icons.getbootstrap.com/)
* [Anime.js](https://animejs.com/)