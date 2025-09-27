<template>
    <div ref="modalEl" class="modal account-edit-modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow">
                <div class="modal-header">
                    <h5 class="modal-title">Editing Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div v-if="account" class="modal-body">
                    <div class="d-flex flex-fill flex-column">
                        <div class="input-group flex-nowrap">
                            <span class="input-group-text bi bi-universal-access"></span>
                            <input ref="server" type="text" class="form-control" placeholder="Server" aria-label="Server"
                                aria-describedby="addon-wrapping" :value="account.server">
                        </div>
                        <div class="input-group flex-nowrap">
                            <span class="input-group-text bi bi-person-circle"></span>
                            <input ref="username" type="text" class="form-control" placeholder="Username"
                                aria-label="Username" aria-describedby="addon-wrapping" :value="account.username">
                        </div>
                        <div class="input-group flex-nowrap mb-3">
                            <span class="input-group-text bi bi-key-fill"></span>
                            <input ref="token" type="text" class="form-control" placeholder="Token" aria-label="Token"
                                aria-describedby="addon-wrapping" :value="account.token" @keypress.enter="save">
                        </div>
                        <div class="d-flex flex-column">
                            <button class="btn btn-dark" @click="save">Save</button>
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

let modal = null;
const modalEl = ref(null);
const account = ref(null);

const server = ref(null);
const username = ref(null);
const token = ref(null);

async function show() {
    modal.show();
}

async function hide() {
    modal.hide();
}

async function edit(obj) {
    account.value = obj;
}

async function save() {
    let new_account = {
        server: server.value.value,
        username: username.value.value,
        token: token.value.value,
    };

    // Save to local storage
    let accounts = JSON.parse(localStorage.getItem('accounts'));

    // Remove old account
    accounts = accounts.filter((acc) => acc.server != account.value.server && acc.username != account.value.username);

    // Add new account
    accounts.push(new_account);

    // Save to local storage
    localStorage.setItem('accounts', JSON.stringify(accounts));

    // Collapse accounts list
    document.querySelector('#savedAccounts').classList.remove('show');
    document.querySelector('.accordion-button').classList.add('collapsed');

    // Hide modal
    hide();
}

defineExpose({
    show,
    hide,
    edit,
})

onMounted(() => {
    modal = new Modal(modalEl.value);
});
</script>