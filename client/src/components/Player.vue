<template>
    <div class="card text-bg-dark rounded-0">
        <div class="card-body">
            <div class="d-flex justify-content-between">
                <div class="d-flex flex-row">
                    <img class="img-fluid img-thumbnail" />
                    <div class="d-flex flex-column">
                        <span class="fw-bold">Song</span>
                        <span>Artist</span>
                    </div>
                </div>
                <div class="d-flex flex-column flex-fill">
                    <div class="d-flex justify-content-center mb-2">
                        <div class="btn-group" role="group" aria-label="Basic example">
                            <button type="button" class="btn btn-outline-light bi bi-skip-start"></button>
                            <button type="button" class="btn btn-outline-light bi" :class="playButton"></button>
                            <button type="button" class="btn btn-outline-light bi bi-skip-end"></button>
                        </div>
                    </div>
                    <div class="progress flex-fill" @click="seekProgress($event)">
                        <div class="progress-bar bg-dark progress-bar-striped progress-bar-animated" aria-valuenow="0"
                            aria-valuemin="0" aria-valuemax="100" :style="{ 'width': position + '%' }">
                            <span class="visually-hidden"></span>
                        </div>
                    </div>
                </div>
                <div>
                    Extra options
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const playButton = ref('bi-play');
</script>