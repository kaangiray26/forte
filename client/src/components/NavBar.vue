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
                        @keyup.enter="search">
                </div>
                <div>
                    <router-link to="/settings" class="hide-on-mobile">
                        <button class="btn btn-dark">Settings</button>
                    </router-link>
                    <router-link to="/settings" class="hide-on-desktop">
                        <button class="btn btn-dark bi bi-gear-wide-connected"></button>
                    </router-link>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'

const router = useRouter();
const search_field = ref(null);

async function focus_search() {
    search_field.value.focus();
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