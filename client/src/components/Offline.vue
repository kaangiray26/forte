<template>
    <div ref="modalEl" class="modal fade p-2" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h1 class="modal-title fs-5" id="staticBackdropLabel">Offline</h1>
                        <span class="fw-bold">The server is down at the moment.</span>
                    </div>
                </div>
                <div class="modal-body d-flex flex-column">
                    <span class="mb-2">You can wait for a while but you can also reload or reset the connection.</span>
                    <button class="btn btn-dark mb-2" @click="reload">Reload</button>
                    <button class="btn btn-danger" @click="reset">Reset</button>
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

async function reload() {
    console.log("Reloading...");
    window.location.reload();
}

async function reset() {
    console.log("Resetting...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/");
}

onMounted(() => {
    modal = new Modal(modalEl.value, {
        keyboard: false
    });

    let offline = JSON.parse(localStorage.getItem('offline'));
    if (offline) {
        modal.show();
    }
})
</script>