<template></template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../js/store';

const router = useRouter()

onMounted(async () => {
    let token = router.currentRoute.value.query.token;
    if (token) {
        let response = await ft.lastfm_auth(token);

        if (!response.hasOwnProperty('key')) {
            router.push('/profile')
            return
        }

        localStorage.setItem('lastfm_username', JSON.stringify(response.username));
        localStorage.setItem('lastfm_key', JSON.stringify(response.key));
        localStorage.setItem('scrobbling', JSON.stringify(true));
        store.scrobbling = true
        router.push('/profile')
    }
})
</script>