<template>
    <div ref="modalEl" class="modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content">
                <div class="modal-header justify-content-center mb-3">
                    <div class="d-flex align-items-center">
                        <div class="me-1">
                            <img src="/images/favicon.svg" width="32" height="32">
                        </div>
                        <div>
                            <h3 class="fw-bold m-0">Forte</h3>
                        </div>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="container">
                        <h1>Privacy Policy</h1>
                        <p>Last updated: May 16, 2023</p>
                        <p>This privacy policy describes how <a href="http://forte.buzl.uk">forte.buzl.uk</a>
                            (&quot;Forte&quot;, &quot;we&quot;, &quot;us&quot;) collects, protects and uses the personally
                            identifiable information you may provide through the Forte website or its API. The policy also
                            describes the choices available to you regarding our use of your personal information and how
                            you
                            can access and update this information. This policy does not apply to the practices of companies
                            that Forte does not own or control, or to individuals that Forte does not employ or manage.</p>
                        <h2 id="what-information-do-we-collect">What information do we collect?</h2>
                        <ul>
                            <li>
                                <p><strong>Basic account information</strong>: If you register on a Forte server, you may be
                                    asked to enter a username, and a password. You may also upload a profile picture. The
                                    username and the profile picture are always listed publicly. They are only stored in the
                                    Forte server you are registered to and are not sent to a third-party company or
                                    individual.
                                </p>
                            </li>
                            <li>
                                <p><strong>Favourite items, following and other public information</strong>: The list of
                                    tracks
                                    in your listening history is listed publicly. Other information that may get publicly
                                    listed
                                    are tracks, playlists, albums, artists and stations you like, as well as other accounts
                                    that
                                    you are friends with. When you create a playlist, its details are saved and processed
                                    only
                                    in the server you are registered to.</p>
                            </li>
                            <li>
                                <p><strong>Servers</strong>: All Forte servers are maintained by different individuals and
                                    please keep in mind that we don't have any legal right or obligation to order a Forte
                                    server
                                    to do anything. The operators of Forte servers may view your basic account information
                                    and
                                    your activities. Do not share any sensitive information over Forte.</p>
                            </li>
                            <li>
                                <p><strong>IPs and other metadata</strong>: The default Forte Server does not record your IP
                                    address. However, server logs may or may not include information about your session
                                    tokens
                                    and requests.</p>
                            </li>
                        </ul>
                        <h2 id="what-do-we-use-your-information-for">What do we use your information for?</h2>
                        <p>Any of the information we collect from you may be used in the following ways:</p>
                        <ul>
                            <li>To provide the core functionality of Forte. You can only interact with the server content
                                when
                                you are logged in. For example, you may follow other people, add items to your favourites
                                and
                                create playlists.</li>
                        </ul>
                        <h2 id="how-do-we-protect-your-information">How do we protect your information?</h2>
                        <p>We implement a variety of security measures to maintain the safety of your personal information
                            when
                            you enter, submit, or access your personal information. Among other things, your browser
                            session, as
                            well as the traffic between your applications and the API, are adviced to be secured with SSL,
                            and
                            your password is hashed using a strong one-way algorithm.</p>
                        <h2 id="what-is-our-data-retention-policy">What is our data retention policy?</h2>
                        <p>You may contact with your registered server to irreversibly delete your account at any time.</p>
                        <h2 id="do-we-use-cookies">Do we use cookies?</h2>
                        <p>The short answer is no. However Forte uses localStorage to save data on your browser that can
                            only be
                            read by the browser itself.</p>
                        <h2 id="do-we-disclose-any-information-to-outside-parties">Do we disclose any information to outside
                            parties?</h2>
                        <p>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable
                            information. Forte uses some external services like <a href="http://Last.fm">Last.fm</a> and
                            Genius.
                            These services may collect and store additional information about your usage on the website.
                            Please
                            check out their privacy policies for more information.</p>
                        <h2 id="site-usage-by-children">Site usage by children</h2>
                        <p>If this server is in the EU or the EEA: Our site, products and services are all directed to
                            people
                            who are at least 16 years old. If you are under the age of 16, per the requirements of the GDPR
                            (General Data Protection Regulation) do not use this site.</p>
                        <p>If this server is in the USA: Our site, products and services are all directed to people who are
                            at
                            least 13 years old. If you are under the age of 13, per the requirements of COPPA (Children's
                            Online
                            Privacy Protection Act) do not use this site.</p>
                        <p>Law requirements can be different if this server is in another jurisdiction.</p>
                        <p>This document is CC-BY-SA. Originally adapted from the <a
                                href="https://mastodon.social/privacy-policy">Mastodon.social privacy policy</a>.</p>
                        <h2 id="contact-us">Contact us</h2>
                        <p>If you have any questions about this Privacy Policy, You can contact us by email: <a
                                href="mailto:kaangiray26@protonmail.com">kaangiray26@protonmail.com</a></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from "bootstrap";

let modal = null;
const modalEl = ref(null);

onMounted(() => {
    modal = new Modal(modalEl.value);
    modal.show();
});
</script>