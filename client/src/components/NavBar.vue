<template>
    <nav class="card mx-3 mt-3 rounded-0 border-0 hide-on-mobile">
        <div class="card-body p-3">
            <div class="d-flex flex-column">
                <div class="d-inline-flex input-group flex-nowrap">
                    <input ref="search_field" type="text" class="form-control search-card-input" placeholder="Search"
                        aria-label="Search" @input="search" @keyup.enter="search_now">
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'

const router = useRouter();
const search_field = ref(null);

function debounce(func, timeout = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

async function focus_search() {
    search_field.value.focus();
}

async function search_now() {
    let query = search_field.value.value;
    if (!query.length) {
        search_field.value.focus();
        return;
    }
    router.push('/search/' + query);
}

const search = debounce(async (event) => {
    event.preventDefault();
    let query = search_field.value.value;
    if (!query.length) {
        search_field.value.focus();
        return;
    }
    router.push('/search/' + query);
});

defineExpose({
    focus_search,
})
</script>