'use strict';

import app from './js/index.js';
import greenlock from 'greenlock'
import greenlock_express from 'greenlock-express';

process.env.email = "kaangiray26@protonmail.com"
process.env.domain = "home.buzl.uk"

const g = greenlock.create({
    packageRoot: './',
    configDir: './greenlock.d',
    maintainerEmail: process.env.email,
    cluster: false
})

async function init() {
    // Greenlock configuration
    g.manager.defaults({
        agreeToTerms: true,
        subscriberEmail: process.env.email
    })

    // Check site status
    let sites = await g.sites.get({
        servername: process.env.domain
    })

    // Add site if not exists
    if (!sites) {
        // Create site
        await g.sites.add({
            subject: process.env.domain,
            altnames: [process.env.domain]
        })
    }

    // Start server
    greenlock_express
        .init({
            packageRoot: './',

            // where to look for configuration
            configDir: './greenlock.d',

            maintainerEmail: process.env.email,

            // whether or not to run at cloudscale
            cluster: false
        })
        // Serves on 80 and 443
        // Get's SSL certificates magically!
        .serve(app);
}

// onMounted
init();