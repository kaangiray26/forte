<template>
    <nav class="card rounded-0 border-0">
        <div class="card-body pt-2 mx-2 px-0">
            <div class="d-flex flex-row align-items-center">
                <div class="me-2">
                    <router-link to="/">
                        <button class="btn btn-dark bi bi-music-note-beamed flex-nowrap"></button>
                    </router-link>
                </div>
                <div class="d-inline-flex input-group flex-nowrap me-2">
                    <input ref="search_field" type="text" class="form-control" placeholder="Search" aria-label="Search"
                        @input="search">
                </div>
                <div @contextmenu.prevent="reset_menu">
                    <router-link to="/profile" class="hide-on-mobile search-link">
                        <button class="btn btn-dark">Profile</button>
                    </router-link>
                    <router-link to="/profile" class="hide-on-desktop search-link">
                        <button class="btn btn-dark bi bi-person-circle"></button>
                    </router-link>
                </div>
            </div>
        </div>
    </nav>
    <Reset ref="resetModal" />
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'

import Reset from './Reset.vue';
const resetModal = ref(null);

const router = useRouter();
const search_field = ref(null);

async function focus_search() {
    search_field.value.focus();
}

async function reset_menu(ev) {
    ev.preventDefault();
    resetModal.value.show();
}

async function search(event) {
    event.preventDefault();
    let query = search_field.value.value;
    if (!query.length) {
        search_field.value.focus();
        return;
    }
    router.push('/search/' + query);
}

defineExpose({
    focus_search,
})
</script>