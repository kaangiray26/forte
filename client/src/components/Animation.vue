<template></template>

<script setup>
import { ref, onMounted } from "vue";
import JSConfetti from 'js-confetti'

const jsConfetti = new JSConfetti();
const reactions = ref({
    'love': '❤️',
    'hand': '🤘',
    'eyes': '👀',
    'ship': '🚀',
    'bomb': '💣',
    'puke': '🤮',
    'shit': '💩',
});

async function _show() {
    showAnimation.value = true;
}

async function _hide() {
    showAnimation.value = false;
}

async function addAnimation(r) {
    jsConfetti.addConfetti({
        emojis: [reactions.value[r]],
    });
}

defineExpose({
    show: _show,
    hide: _hide,
});

onMounted(() => {
    window.addEventListener('reaction', (ev) => {
        addAnimation(ev.detail);
    });
});
</script>