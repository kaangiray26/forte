<template>
    <div class="d-flex justify-content-center border">
        <div class="d-flex flex-column align-items-center text-dark p-2">
            <div>
                <h3>Group session loading...</h3>
            </div>
            <div class="spinner-border" role="status">
            </div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeMount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onBeforeMount(() => {
    if (router.currentRoute.value.params.hasOwnProperty('id')) {
        localStorage.setItem('group_session_id', JSON.stringify(router.currentRoute.value.params.id))
    }
    router.push("/");
});
</script>