<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile/settings" class="nav-link search-link">Settings</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link search-link">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link search-link">Favorite Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists" class="nav-link search-link">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/albums" class="nav-link search-link">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/artists" class="nav-link search-link">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/stations" class="nav-link search-link">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link bg-dark search-link text-white">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="d-inline-flex mb-4">
        <div class="input-group flex-nowrap">
            <span class="input-group-text" id="addon-wrapping">@</span>
            <input ref="friend_name" type="text" class="form-control" placeholder="Username" aria-label="Username"
                aria-describedby="addon-wrapping" @keypress.enter="add_friend">
            <button class="btn btn-dark" @click="add_friend">Add Friend</button>
        </div>
    </div>
    <div class="row g-2">
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="friend in friends">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow" @click="openProfile(friend.username)">
                        <img class="playlist-img" :src="get_cover(friend.cover)" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable search-link p-2 ps-0"
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

const router = useRouter();

const friends = ref([]);
const friend_name = ref(null);
const searchFinished = ref(true);

function get_cover(cover) {
    if (cover) {
        return ft.server + '/' + cover;
    }
    return "/images/default_profile.svg"
}

async function openProfile(id) {
    router.push("/user/" + id);
}

async function add_friend() {
    let name = friend_name.value.value;
    if (!name.length) {
        return;
    }
    await ft.add_friend(name);
    get_friends();
}

async function get_friends() {
    if (!searchFinished.value) {
        return
    }
    searchFinished.value = false;

    let data = await ft.API('/friends');
    friends.value = data.friends;

    searchFinished.value = true;
}

onMounted(() => {
    get_friends();
})
</script>