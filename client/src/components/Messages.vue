<template>
    <div aria-live="polite" aria-atomic="true">
        <div ref="toast_container" class="toast-container bottom-0 start-50 translate-middle-x px-2">
            <div :id="'message_' + index" class="toast mb-2" data-bs-dismiss="toast" role="alert" aria-live="assertive"
                aria-atomic="true" v-for="(toast, index) in toasts">
                <div class="d-flex flex-column">
                    <div class="d-flex justify-content-center">
                        <div class="toast-body d-flex flex-fill flex-column">
                            <div class="d-flex justify-content-center">
                                <h3 class="fw-bold text-break m-0">{{ toast.message }}</h3>
                            </div>
                        </div>
                    </div>
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
    toasts.value.push({
        "username": obj.username,
        "message": obj.message,
    })
}

watch(toasts.value, async (newToasts, oldToasts) => {
    await nextTick();
    if (newToasts.length > 0) {
        let index = newToasts.length - 1;
        let toastEl = document.getElementById('message_' + index);
        let toast = new Toast(toastEl, {
            autohide: false,
        });
        toast.show();
    }
})

onMounted(() => {
    window.addEventListener('message', (ev) => {
        addToast(ev.detail);
    });
})
</script>