'use strict';

import app from './js/index.js';
import db from "./js/db.js";
import greenlock from 'greenlock'
import greenlock_express from 'greenlock-express';

async function setup() {
    const g = greenlock.create({
        packageRoot: './',
        configDir: './greenlock.d',
        maintainerEmail: process.env.forte_email,
        cluster: false,
    })

    // Greenlock configuration
    await g.manager.defaults({
        agreeToTerms: true,
        subscriberEmail: process.env.forte_email
    })

    // Check site status
    let sites = await g.sites.get({
        servername: process.env.forte_server
    })

    // Add site if not exists
    if (!sites) {
        // Create site
        await g.sites.add({
            subject: process.env.forte_server,
            altnames: [process.env.forte_server]
        })
    }
    db.init(process.argv.slice(2));
}

async function start_greenlock_server() {
    console.log(`Server:    http://${process.env.forte_server}/`);
    // Start server
    greenlock_express
        .init({
            packageRoot: './',

            // where to look for configuration
            configDir: './greenlock.d',

            maintainerEmail: process.env.forte_email,

            // whether or not to run at cloudscale
            cluster: false
        })
        // Serves on 80 and 443
        // Get's SSL certificates magically!
        .serve(app);
}

async function start_public_server() {
    app.listen(process.env.port, '0.0.0.0', () => {
        db.init(process.argv.slice(2));
        console.log(`Server:    http://0.0.0.0:${process.env.port}/`);
    });
}

async function start_local_server() {
    app.listen(process.env.port, 'localhost', () => {
        db.init(process.argv.slice(2));
        console.log(`Server:    http://localhost:${process.env.port}/`);
    });
}

async function init() {
    console.log("\x1b[32m%s\x1b[0m", "..: Starting forte :..");
    console.log("\x1b[32m%s\x1b[0m", "..: Open the web player at https://forte.buzl.uk/ :..");
    switch (process.env.mode) {
        case 'public':
            await setup();
            start_public_server();
            break;

        case 'local':
            start_local_server();
            break;

        case 'greenlock':
            await setup();
            start_greenlock_server();
            break;

        default:
            start_local_server();
    }
}

// onMounted
init();