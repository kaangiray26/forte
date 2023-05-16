<template>
    <div ref="loginModalEl" class="modal" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                    <div class="row g-0 justify-content-center">
                        <div class="col-6">
                            <div class="d-flex justify-content-center mb-3">
                                <span class="fw-bold">You need to log in to use this service.</span>
                            </div>
                            <div class="d-flex justify-content-center">
                                <div class="d-flex flex-fill flex-column">
                                    <div class="input-group flex-nowrap">
                                        <span class="input-group-text bi bi-universal-access"></span>
                                        <input ref="server" type="text" class="form-control" placeholder="Forte server"
                                            aria-label="Server" aria-describedby="addon-wrapping" value="localhost">
                                    </div>
                                    <div class="input-group flex-nowrap">
                                        <span class="input-group-text bi bi-person-circle"></span>
                                        <input ref="username" type="text" class="form-control" placeholder="Username"
                                            aria-label="Username" aria-describedby="addon-wrapping">
                                    </div>
                                    <div class="input-group flex-nowrap mb-3">
                                        <span class="input-group-text bi bi-key-fill"></span>
                                        <input ref="token" type="text" class="form-control" placeholder="Token"
                                            aria-label="Token" aria-describedby="addon-wrapping" @keypress.enter="connect">
                                    </div>
                                    <div class="d-flex flex-column">
                                        <button class="btn btn-dark" @click="connect">Connect</button>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-fill mt-3">
                                <div class="accordion flex-fill" id="savedAccountsAccordion">
                                    <div class="accordion-item">
                                        <h2 class="accordion-header">
                                            <button class="accordion-button collapsed" type="button"
                                                data-bs-toggle="collapse" data-bs-target="#savedAccounts"
                                                aria-expanded="false" aria-controls="collapseTwo" @click="reload_accounts">
                                                Accounts
                                            </button>
                                        </h2>
                                        <div id="savedAccounts" class="accordion-collapse collapse"
                                            data-bs-parent="#savedAccountsAccordion">
                                            <div class="accordion-body">
                                                <ul class="list-group">
                                                    <li v-if="!saved_accounts.length"
                                                        class="list-group-item rounded d-flex p-1">
                                                        <div
                                                            class="d-flex w-100 justify-content-between align-items-center">
                                                            <span class="text-decoration-underline">No saved
                                                                accounts.</span>
                                                        </div>
                                                    </li>
                                                    <li v-for="account in saved_accounts"
                                                        class="list-group-item list-group-item-action clickable rounded d-flex p-1">
                                                        <div
                                                            class="d-flex w-100 justify-content-between align-items-center">
                                                            <span class="">{{ account.username + '@' +
                                                                account.server }}</span>
                                                            <div class="d-flex align-items-center">
                                                                <button class="btn btn-light border bi bi-arrow-right me-1"
                                                                    @click="login_account(account)"></button>
                                                                <button class="btn btn-light border bi bi-pencil-fill me-1"
                                                                    @click="edit_account(account)"></button>
                                                                <button class="btn btn-light border bi bi-x-lg"
                                                                    @click="remove_account(account)"></button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <hr class="text-dark" />
                            <div v-if="!fail">
                                <div class="d-flex flex-fill justify-content-end align-items-center mt-3">
                                    <div class="d-flex flex-fill alert alert-danger login-alert appear align-items-center"
                                        role="alert">
                                        Login failed!
                                    </div>
                                </div>
                            </div>
                            <div v-if="logging">
                                <div class="d-flex justify-content-center appear mt-3">
                                    <button class="btn btn-dark" type="button" disabled>
                                        <span class="spinner-border spinner-border-sm" role="status"
                                            aria-hidden="true"></span>
                                        Logging you in...
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AccountEdit ref="account_edit" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from "bootstrap"
import AccountEdit from './AccountEdit.vue';

let loginModal = null;
const loginModalEl = ref(null);
const account_edit = ref(null);

const fail = ref(true);
const logging = ref(false);

const server = ref(null);
const username = ref(null);
const token = ref(null);

const saved_accounts = ref([]);

async function reload_accounts() {
    saved_accounts.value = JSON.parse(localStorage.getItem('accounts'));
}

async function edit_account(account) {
    await account_edit.value.edit(account);
    account_edit.value.show();
}

async function remove_account(account) {
    let accounts = JSON.parse(localStorage.getItem('accounts'));
    if (!accounts) {
        accounts = [];
    }
    accounts = accounts.filter((acc) => acc.username != account.username || acc.server != account.server);
    localStorage.setItem('accounts', JSON.stringify(accounts));
    saved_accounts.value = accounts;
}

async function login_account(account) {
    // Visual feedback
    fail.value = true;
    logging.value = true;

    let address = account.server;
    if (!address.startsWith("http://") && !address.startsWith("https://")) {
        // Check servers branch
        let location = await ft.get_address(address);

        if (!location) {
            fail.value = false;
            return
        }

        // Replace address with the one in the file
        address = location
    }

    ft.connect(
        address, account.username, account.token
    ).then((logged) => {
        if (logged) {
            // Hide Login modal
            loginModal.hide();
            window.location.replace("/");
            return;
        };
        fail.value = false;
    });
}

async function connect() {
    if (!server.value.value.length) {
        server.value.focus();
        return
    }

    if (!token.value.value.length) {
        token.value.focus();
        return
    }

    // Visual feedback
    fail.value = true;
    logging.value = true;

    let address = server.value.value;
    // Check for federated host
    if (!address.startsWith("http://") && !address.startsWith("https://")) {
        // Check servers branch
        let location = await ft.get_address(address);

        if (!location) {
            fail.value = false;
            return
        }

        // Replace address with the one in the file
        address = location
    }

    ft.connect(
        address, username.value.value, token.value.value
    ).then((logged) => {
        if (logged) {
            // Save login to saved accounts
            let accounts = JSON.parse(localStorage.getItem('accounts'));
            if (!accounts) {
                accounts = [];
            }
            let exists = accounts.filter((account) => account.username == username.value.value && account.server == server.value.value);
            if (!exists.length) {
                accounts.push({
                    server: server.value.value,
                    username: username.value.value,
                    token: token.value.value
                });
                localStorage.setItem('accounts', JSON.stringify(accounts));
            }

            // Hide Login modal
            loginModal.hide();
            window.location.replace("/");
            return;
        };
        fail.value = false;
    });
}

onMounted(() => {
    loginModal = new Modal(loginModalEl.value, {
        keyboard: false
    });

    let offline = JSON.parse(localStorage.getItem('offline'));
    if (offline) {
        return
    }

    // Get saved accounts
    reload_accounts();

    let initialized = JSON.parse(localStorage.getItem('init'));
    if (!initialized) {
        loginModal.show();
    }
})
</script>