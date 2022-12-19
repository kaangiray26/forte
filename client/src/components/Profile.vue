<template>
    <div class="card border-0 mx-4 shadow-lg" v-if="loaded">
        <div class="card-body">
            <div class="row g-4">
                <div class="col-12 col-sm-auto">
                    <div class="d-inline-flex position-relative">
                        <img class="img-profile rounded placeholder-img" :src="get_cover()" width="250" height="250" />
                        <div class="position-absolute bottom-0 right-0">
                            <button class="btn btn-light bi bi-pencil-square shadow m-2" type="button"
                                style="opacity: 0.90;" @click="change_cover">
                            </button>
                        </div>
                        <input ref="cover_upload" type="file" class="visually-hidden" @change="handle_cover" />
                    </div>
                </div>
                <div class="col">
                    <h1 class="album-title mb-4">{{ profile.username }}</h1>
                    <hr />
                    <router-view />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const profile = ref({});
const cover_upload = ref(null);
const loaded = ref(false);

function get_cover() {
    return ft.server + '/' + profile.value.cover;
}

async function get_profile() {
    let data = await ft.API('/profile');
    profile.value = data.profile;
    loaded.value = true;
}

async function handle_cover() {
    let file = cover_upload.value.files[0];

    if (!file || !file.type.startsWith('image/')) {
        return;
    }

    let formData = new FormData();
    formData.append("cover", file);
    let response = await ft.upload_cover(formData);

    if (response.hasOwnProperty('cover')) {
        profile.value.cover = response.cover;
    }
}

async function change_cover() {
    cover_upload.value.click();
}

onMounted(() => {
    get_profile();
})
</script>