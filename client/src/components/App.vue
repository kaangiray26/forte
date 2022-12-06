<template>
    <div>
        {{ title }}
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const title = ref(null);

onMounted(() => {
    title.value = 'Hello world!';
});
</script>