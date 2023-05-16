<template>
    <div ref="modalEl" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Log out</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you really want to log out?
                    </p>
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-success fw-bold" @click="reset">Confirm</button>
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

async function reset() {
    // Clear localStorage
    ["init", "offline", "session", "server", "username", "token", "volume", "groupSession", "groupSessionID"].map(key => {
        localStorage.removeItem(key);
    });

    sessionStorage.clear();
    window.location.replace("/");
}

async function show() {
    modal.show();
}

async function hide() {
    modal.hide();
}

defineExpose({
    show,
    hide
})

onMounted(() => {
    modal = new Modal(modalEl.value);
});
</script>