<template>
    <div v-show="error">
        <div class="d-flex justify-content-center p-2">
            <div class="d-flex flex-column fw-bold theme-color">
                <hr>
                <span>{{ error_message }}</span>
                <hr>
            </div>
        </div>
    </div>
    <div class="card rounded-0 border-0 mx-3" v-if="loaded">
        <div class="card-body px-3">
            <div class="row g-3">
                <div class="col-12 col-sm-auto">
                    <div class="d-inline-flex position-relative">
                        <img class="img-profile img-thumbnail" :src="get_cover()" width="250" height="250" />
                        <div class="position-absolute bottom-0 right-0">
                        </div>
                    </div>
                </div>
                <div class="col">
                    <h1 class="album-title theme-color">{{ user.username }}</h1>
                    <div v-show="!is_self" class="pt-2">
                        <button v-show="friend" type="button"
                            class="btn btn-dark theme-btn black-on-hover fw-bold text-nowrap" @click="remove_friend">
                            <span class="bi bi-emoji-smile-fill me-2"></span>
                            <span>Friends</span>
                        </button>
                        <button v-show="!friend" type="button"
                            class="btn btn-dark theme-btn black-on-hover fw-bold text-nowrap" @click="add_friend">
                            <span class="bi bi-emoji-frown-fill me-2"></span>
                            <span>Add Friend</span>
                        </button>
                    </div>
                    <hr />
                    <router-view />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Federated
const domain = ref(null);

const is_self = ref(false);

const user = ref({});
const loaded = ref(false);
const error = ref(false);
const error_message = ref("");
const friend = ref(false);

const query_param = computed(() => {
    return router.currentRoute.value.params.id;
})

function get_cover() {
    if (user.value.cover) {
        return ft.server + '/' + user.value.cover;
    }
    return "/images/default_profile.svg";
}

async function get_user(id) {
    let data = await ft.API('/user/' + id);
    if (!data || data.error) {
        router.push('/404')
        return;
    }
    // Check for self
    is_self.value = (data.user.username == ft.username);

    user.value = data.user;
    await check_friends();
    loaded.value = true;
}

async function get_federated_user(id) {
    let data = await ft.fAPI(domain.value, '/user/' + id);

    console.log(data);
    if (!data || data.error) {
        return;
    }

    // Check for self
    is_self.value = (data.user.username == ft.username && data.server == ft.server);

    user.value = data.user;
    await check_federated_friends();
    loaded.value = true;
    return
}

async function check_friends() {
    if (is_self.value) return;

    let data = await ft.API('/friends/' + user.value.username);
    if (!data) return;
    friend.value = data.friend;
}

async function check_federated_friends() {
    if (is_self.value) return;

    let data = await ft.fAPI(domain.value, '/friends/' + user.value.username);
    if (!data) return;
    friend.value = data.friend;
    return
}

async function add_friend(ev) {
    ev.target.parentElement.setAttribute("disabled", true);
    await ft.add_friend(user.value.username);
    await check_friends();
    ev.target.parentElement.disabled = false;
}

async function remove_friend(ev) {
    ev.target.parentElement.setAttribute("disabled", true);
    await ft.remove_friend(user.value.username);
    await check_friends();
    ev.target.parentElement.disabled = false;
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_federated_user(id);
        return
    }
    get_user(id);
}

watch(query_param, () => {
    if (!router.currentRoute.value.params.id) return;
    setup();
})

onBeforeMount(() => {
    setup();
})
</script>