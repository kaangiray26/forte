<template>
    <div class="card border-0 mx-4 shadow-lg" v-if="loaded">
        <div class="card-body">
            <div class="row g-4">
                <div class="col-12 col-sm-auto">
                    <div class="d-inline-flex position-relative">
                        <img class="playlist-img" :src="get_cover()" />
                        <div class="position-absolute bottom-0 right-0">
                        </div>
                    </div>
                </div>
                <div class="col">
                    <h1 class="album-title mb-4">{{ user.username }}</h1>
                    <hr />
                    <router-view />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const user = ref({});
const loaded = ref(false);

function get_cover() {
    if (user.value.cover) {
        return ft.server + '/' + user.value.cover;
    }
    return "/images/default_profile.svg";
}

async function get_user(id) {
    let data = await ft.API('/user/' + id);
    if (!data) return;

    user.value = data.user;
    loaded.value = true;
}

onMounted(() => {
    get_user(router.currentRoute.value.params.id);
})
</script>