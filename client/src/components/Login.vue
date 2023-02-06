<template>
    <div ref="loginModalEl" class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">Authorization</h1>
                        <span class="fw-bold">You need to log in to use this service.</span>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="input-group flex-nowrap">
                        <span class="input-group-text bi bi-universal-access"></span>
                        <input ref="server" type="text" class="form-control" placeholder="Forte server"
                            aria-label="Server" aria-describedby="addon-wrapping">
                    </div>
                    <div class="input-group flex-nowrap">
                        <span class="input-group-text bi bi-person-circle"></span>
                        <input ref="username" type="text" class="form-control" placeholder="Username"
                            aria-label="Username" aria-describedby="addon-wrapping">
                    </div>
                    <div class="input-group flex-nowrap mb-2">
                        <span class="input-group-text bi bi-key-fill"></span>
                        <input ref="token" type="text" class="form-control" placeholder="Token" aria-label="Token"
                            aria-describedby="addon-wrapping" @keypress.enter="connect">
                    </div>
                    <div class="d-flex flex-fill justify-content-end align-items-center">
                        <div v-if="!fail"
                            class="d-flex flex-fill alert alert-danger login-alert appear p-2 m-0 me-2 align-items-center"
                            role="alert">
                            Login failed!
                        </div>
                        <div>
                            <button class="btn btn-dark" @click="connect">Connect</button>
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

    ft.connect(
        server.value.value, username.value.value, token.value.value
    ).then((logged) => {
        if (logged) {
            console.log("Logged in");
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

    let initialized = JSON.parse(localStorage.getItem('init'));
    if (!initialized) {
        loginModal.show();
    }
})
</script>