<template>
    <div aria-live="polite" aria-atomic="true" class="position-relative">
        <div ref="toast_container" class="toast-container top-0 end-0 p-4">
            <div :id="'toast_' + index" class="toast mb-2" role="alert" aria-live="assertive" aria-atomic="true"
                v-for="(title, index) in toasts">
                <div class="d-flex">
                    <div class="toast-body">
                        {{ title }}
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { Toast } from 'bootstrap';

const toast_container = ref(null);
const toasts = ref([]);

async function addToast(obj) {
    toasts.value.push(obj.title)
}

watch(toasts.value, async (newToasts, oldToasts) => {
    await nextTick();
    if (newToasts.length > 0) {
        let index = newToasts.length - 1;
        let toastEl = document.getElementById('toast_' + index);
        let toast = new Toast(toastEl, {
            autohide: true,
            delay: 2000
        });
        toast.show();
    }
})

onMounted(() => {
    window.addEventListener('notify', (ev) => {
        addToast(ev.detail);
    });
})
</script>