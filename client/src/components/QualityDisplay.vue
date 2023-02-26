<template>
    <div id="qualityDisplay" class="modal fade p-2" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header d-flex flex-column">
                    <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
                    <h2 class="modal-title fw-bolder">Audio</h2>
                </div>
                <div class="modal-body">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <span class="fw-bold">Quality: </span>
                            <span>{{ store.playing.quality }}</span>
                        </li>
                        <li class="list-group-item">
                            <span class="fw-bold">Bitrate: </span>
                            <span>{{ store.playing.bitrate }} kbps</span>
                        </li>
                        <li class="list-group-item">
                            <span class="fw-bold">Duration: </span>
                            <span>{{ store.playing.duration }} seconds</span>
                        </li>
                        <li class="list-group-item">
                            <span class="fw-bold">Audio Format: </span>
                            <span>{{ store.playing.format }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import { store } from '/js/store.js';

const modal = ref(null);

function _show() {
    modal.value.show();
}

function _hide() {
    modal.value.hide();
}

defineExpose({
    show: _show,
    hide: _hide
});

onMounted(() => {
    modal.value = new Modal(document.querySelector('#qualityDisplay'));
});
</script>