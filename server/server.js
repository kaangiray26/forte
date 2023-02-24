'use strict';

import app from './js/index.js';
import greenlock from 'greenlock'
import greenlock_express from 'greenlock-express';

console.log({
    "EMAIL": process.env.forte_email,
    "SERVER": process.env.forte_server,
})

const g = greenlock.create({
    packageRoot: './',
    configDir: './greenlock.d',
    maintainerEmail: process.env.forte_email,
    cluster: false
})

async function init() {
    // Greenlock configuration
    g.manager.defaults({
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

// onMounted
init();