<script setup>
import { onBeforeMount } from 'vue';
import { store } from '/js/store.js';
import { useRouter } from 'vue-router';

const router = useRouter();

onBeforeMount(() => {
    let track_id = router.currentRoute.value.params.id;
    store.selected_track_id = track_id;

    ft.API(`/track/${track_id}/basic`).then((response) => {
        router.push("/album/" + response.track.album);
    })
})
</script>