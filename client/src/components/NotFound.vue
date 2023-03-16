<template>
    <div class="card rounded-0 border-0 mx-3">
        <div class="card-body px-3">
            <div class="row g-3 justify-content-center align-items-center">
                <div class="col-auto">
                    <div class="d-flex flex-column text-center theme-color">
                        <div class="d-flex justify-content-center mb-3">
                            <img v-if="store.theme == 'light'" src="/images/favicon.svg" width="64" height="64">
                            <img v-if="store.theme == 'dark'" src="/images/favicon_dark.svg" width="64" height="64">
                        </div>
                        <h1 class="album-title">Page not found</h1>
                        <h3 class="text-muted">We can't find the page you're looking for.</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { store } from '/js/store.js';
</script>