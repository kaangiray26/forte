<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
    console.log("App mounted");
    let session = await fetch("/session")
        .then((response) => {
            return response.json();
        });

    if (!session.hasOwnProperty("username")) {
        router.push("/login")
        return;
    }

    sessionStorage.setItem("username", session.username);
    router.push("/dashboard")
})
</script>