<template>
    <div v-show="showAnimation" class="animation vh-100 vw-100">
        <div v-for="i in 20">
            <div v-for="j in 20">
                <span :key="(i, j)" class="animated position-absolute"
                    :style="{ 'left': Math.random() * 100 + '%', 'top': Math.floor((Math.random() * height)) + 'px' }">{{
                        reaction }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import anime from 'animejs';

const animation = anime.timeline({
    targets: '.animated',
    autoplay: false,
    begin: _show,
    complete: _hide,
});

const showAnimation = ref(false);
const reaction = ref('');

const height = ref(window.innerHeight);

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
    reaction.value = reactions.value[r];
    animation.play();
}

defineExpose({
    show: _show,
    hide: _hide,
});

onMounted(() => {
    window.addEventListener('reaction', (ev) => {
        addAnimation(ev.detail);
    });

    animation.add({
        opacity: [0, .75],
        scale: [1, 5],
        duration: 1500,
        easing: 'easeInOutCubic',
    });

    animation.add({
        opacity: [.75, 0],
        duration: 200,
        easing: 'easeInOutCubic',
    });
});
</script>