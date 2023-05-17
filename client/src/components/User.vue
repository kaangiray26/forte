<template>
    <div class="card rounded-0 border-0 m-3" v-show="loaded">
        <div class="card-body rounded px-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="d-flex position-relative">
                        <div class="ph rounded">
                            <img class="playlist-img rounded" :src="get_cover()" @error="placeholder" />
                        </div>
                        <div class="position-absolute bottom-0 right-0">
                        </div>
                    </div>
                </div>
                <div class="col">
                    <h1 class="theme-color album-title mb-4">{{ user.username }}</h1>
                    <div v-show="!is_self" class="pt-2">
                        <button v-show="friend" type="button" class="btn theme-btn black-on-hover text-white fw-bold"
                            @click="remove_friend">
                            <span class="bi bi-emoji-smile-fill me-2"></span>
                            <span>Friends</span>
                        </button>
                        <button v-show="!friend" type="button" class="btn theme-btn black-on-hover text-white fw-bold"
                            @click="add_friend">
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
const friend = ref(false);

const query_param = computed(() => {
    return router.currentRoute.value.params.id;
})

async function placeholder(obj) {
    obj.target.src = "/images/friend.svg";
}

function get_cover() {
    if (user.value.cover) {
        return ft.server + '/' + user.value.cover;
    }
    return "/images/friend.svg";
}

async function get_user(id) {
    let data = await ft.API('/user/' + id);
    if (!data || data.error) {
        // router.push('/404')
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
    if (!data || data.error) {
        return;
    }

    // Check for self
    is_self.value = (data.user.username == ft.username && data.server == ft.server);

    user.value = data.user;
    await check_friends();
    loaded.value = true;
    return
}

async function check_friends() {
    if (is_self.value) return;

    let data = await ft.API('/friends/' + router.currentRoute.value.params.id);
    if (!data) return;
    friend.value = data.friend;
}

async function add_friend(ev) {
    ev.target.parentElement.setAttribute("disabled", true);
    await ft.add_friend(router.currentRoute.value.params.id, domain.value);
    await check_friends();
    ev.target.parentElement.disabled = false;
}

async function remove_friend(ev) {
    ev.target.parentElement.setAttribute("disabled", true);
    await ft.remove_friend(router.currentRoute.value.params.id, domain.value);
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