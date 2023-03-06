<template>
    <nav class="card rounded-0 border-0">
        <div class="card-body py-3 mx-4 px-0">
            <div class="d-flex flex-column">
                <div class="d-inline-flex input-group flex-nowrap mb-3">
                    <input ref="search_field" type="text" class="form-control" placeholder="Search" aria-label="Search"
                        @input="search">
                </div>
                <div class="hide-on-desktop">
                    <ul class="nav nav-pills nav-justified">
                        <li class="nav-item">
                            <router-link to="/" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active bg-dark text-white': path == '/', 'text-dark': path != '/' }">
                                <span class="fs-5">Home</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/artists" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active bg-dark text-white': path == '/artists', 'text-dark': path != '/artists' }">
                                <span class="fs-5">Artists</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/albums" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active bg-dark text-white': path == '/albums', 'text-dark': path != '/albums' }">
                                <span class="fs-5">Albums</span>
                            </router-link>
                        </li>
                        <li class="nav-item">
                            <router-link to="/profile" class="nav-link fw-bold" aria-current="page"
                                :class="{ 'active bg-dark text-white': path == '/profile', 'text-dark': path != '/profile' }">
                                <span class="fs-5">Profile</span>
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router'

const router = useRouter();
const search_field = ref(null);

const path = computed(() => {
    return router.currentRoute.value.path;
})

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