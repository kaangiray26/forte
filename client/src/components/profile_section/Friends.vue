<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link to="/profile" class="nav-link red-on-hover theme-color">Profile</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/history" class="nav-link red-on-hover theme-color">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/tracks" class="nav-link red-on-hover theme-color">Favorite Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/playlists" class="nav-link red-on-hover theme-color">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/albums" class="nav-link red-on-hover theme-color">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/artists" class="nav-link red-on-hover theme-color">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/stations" class="nav-link red-on-hover theme-color">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link to="/profile/friends" class="nav-link bg-dark search-link text-white">Friends</router-link>
        </li>
    </ul>
    <hr />
    <div class="row g-3">
        <div v-show="!friends.length" class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative">
                        <img class="playlist-img" src="/images/empty.svg" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="theme-color fw-bold text-break text-wrap p-2 ps-0">No friends added yet</h6>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2" v-for="friend in friends">
            <div class="card h-100 w-100 border-0">
                <div class="p-3">
                    <div class="d-inline-flex position-relative clickable-shadow" @click="openProfile(friend.username)">
                        <img class="img-profile img-thumbnail rounded" :src="get_cover(friend.cover)" width="250"
                            height="250" />
                    </div>
                    <div class="d-flex flex-fill">
                        <h6 class="fw-bold text-break text-wrap clickable theme-color red-on-hover p-2 ps-0"
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