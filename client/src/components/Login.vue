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
                    <div class="d-flex justify-content-center mb-3">
                        <span class="fw-bold">You need to log in to use this service.</span>
                    </div>
                    <div class="d-flex justify-content-center">
                        <div class="d-inline-flex flex-column">
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
                                <input ref="token" type="text" class="form-control" placeholder="Token" aria-label="Token"
                                    aria-describedby="addon-wrapping" @keypress.enter="connect">
                            </div>
                            <div class="d-flex flex-column">
                                <button class="btn btn-dark" @click="connect">Connect</button>
                            </div>
                            <div class="d-flex flex-fill justify-content-end align-items-center mt-3">
                                <div v-if="!fail"
                                    class="d-flex flex-fill alert alert-danger login-alert appear align-items-center"
                                    role="alert">
                                    Login failed!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from "bootstrap"

let loginModal = null;
const loginModalEl = ref(null);

const fail = ref(true);

const server = ref(null);
const username = ref(null);
const token = ref(null);

async function connect() {
    if (!server.value.value.length) {
        server.value.focus();
        return
    }

    if (!token.value.value.length) {
        token.value.focus();
        return
    }

    fail.value = true;
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

    let initialized = JSON.parse(localStorage.getItem('init'));
    if (!initialized) {
        loginModal.show();
    }
})
</script>