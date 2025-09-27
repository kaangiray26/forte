<template>
    <div id="qualityDisplay" class="modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content theme-bg theme-border">
                <div class="modal-header border-bottom-0 pb-0">
                    <h2 class="modal-title fs-5 theme-color fw-bold">Audio</h2>
                    <button type="button" class="btn-close theme-filter" data-bs-dismiss="modal"
                        aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <ul class="list-group foreground p-2">
                        <li class="list-group-item theme-list-item theme-color">
                            <span class="fw-bold">Quality: </span>
                            <span>{{ store.playing.quality }}</span>
                        </li>
                        <li class="list-group-item theme-list-item theme-color">
                            <span class="fw-bold">Bitrate: </span>
                            <span>{{ store.playing.bitrate }} kbps</span>
                        </li>
                        <li class="list-group-item theme-list-item theme-color">
                            <span class="fw-bold">Duration: </span>
                            <span>{{ store.playing.duration }} seconds</span>
                        </li>
                        <li class="list-group-item theme-list-item theme-color">
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