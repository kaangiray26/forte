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
}

async function start_public_server() {
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

async function start_local_server() {
    app.listen(3000, '0.0.0.0', () => {
        db.init(process.argv.slice(2))
        console.log(`Server:    http://localhost:3000/`)
    });
}

async function init() {
    switch (process.env.mode) {
        case 'public':
            await setup();
            start_public_server();
            break;

        case 'local':
            start_local_server();
            break;

        default:
            start_local_server();
    }
}

// onMounted
init();