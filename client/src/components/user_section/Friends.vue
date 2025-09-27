<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + username"
                class="nav-link fw-bold purple-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/history'"
                class="nav-link fw-bold purple-on-hover theme-color">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/tracks'" class="nav-link fw-bold purple-on-hover theme-color">Favorite
                Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/playlists'"
                class="nav-link fw-bold purple-on-hover theme-color">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/albums'"
                class="nav-link fw-bold purple-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/artists'"
                class="nav-link fw-bold purple-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + username + '/friends'"
                class="nav-link fw-bold theme-btn black-on-hover text-white">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-3">
        <div v-show="!friends.length" class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative">
                        <img class="img-fluid bg-light rounded " src="/images/empty.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="theme-color fw-bold text-break text-wrap p-2 ps-0">No friends added yet</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="friend in friends">
            <div class="card h-100 w-100 border-0" @contextmenu.prevent="right_click({ item: friend, event: $event })">
                <div class="p-3">
                    <div class="d-inline-flex position-relative" @click="openProfile(friend.username)">
                        <div class="d-inline-flex clickable-shadow rounded">
                            <img class="playlist-img rounded" :src="get_cover(friend.cover)" @error="placeholder" />
                        </div>
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color purple-on-hover p-2 ps-0"
                            @click="openProfile(friend.username)">{{ friend.username }}</h6>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { right_click } from '/js/events.js';

const router = useRouter();

// Federated
const domain = ref(null);

const username = ref(router.currentRoute.value.params.id);

const friends = ref([]);
const searchFinished = ref(true);

async function placeholder(obj) {
    obj.target.src = "/images/friend.svg";
}

function get_cover(cover) {
    if (!cover) {
        return "/images/friend.svg"
    }

    if (cover.startsWith('http')) {
        return cover;
    }

    return ft.server + '/' + cover;
}

async function openProfile(id) {
    router.push("/user/" + id);
}

async function get_friend(username) {
    console.log(username);
    // Check for federated
    if (username.includes('@')) {
        let domain = null;
        [username, domain] = username.split('@');

        let data = await ft.fAPI(domain, `/user/${username}/basic`);
        data.user.server = domain;
        data.user.username = data.user.title + '@' + domain;
        friends.value.push(data.user);
        return
    }

    let data = await ft.API(`/user/${username}/basic`);
    data.user.username = data.user.title;
    friends.value.push(data.user);
}

async function get_friends(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API(`/user/${id}/friends`);
    if (!data || !data.friends) return;

    data.friends.map(username => get_friend(username));

    searchFinished.value = true;
}

async function get_federated_friends(id) {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.fAPI(domain.value, `/user/${id}/friends`);
    if (!data || !data.friends) return;

    data.friends.map(username => get_friend(username));
    searchFinished.value = true;
}

async function setup() {
    let id = router.currentRoute.value.params.id;
    if (id.includes('@')) {
        [id, domain.value] = id.split('@');
        get_federated_friends(id);
        return
    }
    get_friends(id);
}

onMounted(() => {
    setup();
})
</script>