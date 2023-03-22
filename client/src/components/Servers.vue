<template>
    <div ref="serversModalEl" class="modal" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false"
        tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content">
                <div class="modal-header justify-content-center mb-3">
                    <div class="d-flex align-items-center">
                        <div class="me-1">
                            <img src="/images/favicon.svg" width="32" height="32">
                        </div>
                        <div>
                            <h3 class="fw-bold m-0">Forte Servers</h3>
                        </div>
                    </div>
                </div>
                <div class="modal-body pt-0">
                    <div class="d-flex justify-content-center mb-3">
                        <button type="button" class="btn btn-dark" @click="go_back">Go back</button>
                    </div>
                    <div class="d-flex justify-content-center">
                        <ul class="list-group">
                            <li class="list-group-item list-group-item-action clickable" v-for="server in servers"
                                @click="open_server(server)">
                                <div class="d-flex justify-content-between">
                                    <div class="d-flex flex-column text-break">
                                        <h5 class="fw-bold">{{ server.name }}</h5>
                                        <span class="text-decoration-underline">{{ server.address }}</span>
                                        <span>Version <span class="purple-color fw-bold">{{ server.version }}</span></span>
                                    </div>
                                    <div>
                                        <span class="badge"
                                            :class="{ 'text-bg-success': server.status == 'Online', 'text-bg-danger': server.status == 'Offline' }">{{
                                                server.status }}</span>
                                    </div>
                                </div>
                            </li>
                        </ul>
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

async function go_back() {
    serversModal.hide();
    router.push("/profile");
    return
}

async function open_server(server) {
    window.open(`${server.address}/`, "_blank");
}

async function get_servers() {
    let data = await fetch("https://api.github.com/repos/kaangiray26/forte/git/trees/31db73e0506adbfaf4e5b14206d8244ae0d3d0b2")
        .then(res => res.json())
        .then(data => data.tree);

    data.forEach(async (obj) => {
        await check_server(obj.path);
    });
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