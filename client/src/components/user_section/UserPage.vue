<template>
    <ul class="nav nav-pills">
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/history'" class="nav-link search-link">Listening
                History</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/tracks'" class="nav-link search-link">Favorite Tracks</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/playlists'" class="nav-link search-link">Playlists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/albums'" class="nav-link search-link">Albums</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/artists'" class="nav-link search-link">Artists</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/stations'" class="nav-link search-link">Stations</router-link>
        </li>
        <li class="nav-item">
            <router-link :to="'/user/' + user_id + '/friends'" class="nav-link search-link">Friends</router-link>
        </li>
    </ul>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user_id = ref(0);

onMounted(() => {
    user_id.value = router.currentRoute.value.params.id;
})
</script>