<template>
    <div ref="serversModalEl" class="modal" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content theme-bg">
                <div class="modal-header border-0 bg-dark text-white justify-content-center mb-3">
                    <button type="button" class="btn-close btn-close-white" aria-label="Close" @click="go_back"></button>
                </div>
                <div class="modal-body pt-0">
                    <div class="row gx-0">
                        <div class="col">
                            <ul class="list-group">
                                <li
                                    class="list-group-item rounded mb-1 theme-btn text-light d-flex justify-content-between">
                                    <div class="d-flex align-items-center">
                                        <span class="fw-bold">Servers</span>
                                    </div>
                                    <div>
                                        <button type="button"
                                            class="btn btn-dark theme-btn fw-bold black-on-hover d-flex align-items-center text-nowrap text-start"
                                            @click="get_servers">
                                            <span class="bi bi-arrow-clockwise me-1"></span>
                                            <span>Refresh</span>
                                        </button>
                                    </div>
                                </li>
                                <li class="list-group-item theme-list-item foreground rounded p-3"
                                    v-for="server in servers">
                                    <div class="d-flex justify-content-between theme-color">
                                        <div class="d-flex flex-column flex-fill text-break">
                                            <div class="d-flex align-items-center justify-content-between">
                                                <h5 class="fw-bold m-0">{{ server.name }}</h5>
                                                <div class="d-flex">
                                                    <button type="button"
                                                        class="btn btn-dark theme-btn fw-bold black-on-hover text-nowrap"
                                                        @click="open_server(server)">About</button>
                                                </div>
                                            </div>
                                            <div>
                                                <span class="badge me-2"
                                                    :class="{ 'text-bg-success': server.status == 'Online', 'text-bg-danger': server.status == 'Offline' }">{{
                                                        server.status }}</span>
                                                <span>Version <span class="purple-color fw-bold">{{
                                                    server.version }}</span></span>
                                            </div>
                                            <span class="text-decoration-underline">{{ server.address }}</span>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <div v-show="loading">
                                <div class="d-flex justify-content-center text-dark p-2">
                                    <button class="btn btn-dark" type="button" disabled>
                                        <span class="spinner-border spinner-border-sm" role="status"
                                            aria-hidden="true"></span>
                                        Fetching servers...
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Modal } from "bootstrap"
import { useRouter } from "vue-router";

const router = useRouter();

let serversModal = null;
const serversModalEl = ref(null);

const servers = ref([]);
const loading = ref(false);

async function go_back() {
    serversModal.hide();
    router.push("/profile");
    return
}

async function open_server(server) {
    window.open(`${server.address}/about`, "_blank");
}

async function get_servers() {
    if (loading.value) return;
    loading.value = true;

    servers.value = [];

    // Get tree url from GitHub API
    let url = await fetch("https://api.github.com/repos/kaangiray26/forte/git/trees/servers")
        .then(res => res.json())
        .then(data => data.tree)
        .then(data => data.filter(server => server.path == 'hostnames'))
        .then(data => data[0].url)
        .catch(() => null);
    if (!url) return null;

    let data = await fetch(url)
        .then(res => res.json())
        .then(data => data.tree);

    data.forEach(async (obj) => {
        await check_server(obj.path);
    });

    loading.value = false;
}

async function check_server(server) {
    let address = await fetch(`https://raw.githubusercontent.com/kaangiray26/forte/servers/hostnames/${server}`)
        .then(response => response.json())
        .then(data => {
            return data.address;
        })
        .catch(() => null);

    if (!address) {
        return;
    }

    // Check if server is alive
    let response = await fetch(`${address}/alive`)
        .then(response => response.json())
        .catch(() => null);

    // Server is not alive
    if (!response) {
        servers.value.push({
            name: server.split(".json")[0],
            address: address,
            version: "Unknown",
            status: "Offline"
        })
        return
    }

    // Server is alive
    servers.value.push({
        name: server.split(".json")[0],
        address: address,
        version: response.version,
        status: "Online"
    });
}

onMounted(() => {
    serversModal = new Modal(serversModalEl.value, {
        keyboard: false
    });
    serversModal.show();
    get_servers();
})
</script>