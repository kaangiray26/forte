<template>
    <div class="row gx-0 h-100 vw-100 justify-content-center align-items-center">
        <div class="col-12 col-lg-6">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-center">
                        <div class="d-flex flex-column justify-content-center align-items-center">
                            <img class="img-fluid rounded bg-dark mb-2" src="/forte.svg" width="56" height="56">
                            <h5 class="fw-bold">Forte Dashboard</h5>
                        </div>
                    </div>
                    <hr />
                    <div class="input-group flex-nowrap">
                        <span class="input-group-text bi bi-person-circle" id="addon-wrapping"></span>
                        <input ref="username" id="username" type="text" class="form-control" placeholder="Username"
                            aria-label="Username" aria-describedby="addon-wrapping">
                    </div>
                    <div class="input-group flex-nowrap mb-2">
                        <span class="input-group-text bi bi-key" id="addon-wrapping"></span>
                        <input ref="password" id="password" type="password" class="form-control" placeholder="Password"
                            aria-label="Password" aria-describedby="addon-wrapping" @keyup.enter="log_in">
                    </div>
                    <div class="d-flex flex-fill justify-content-center">
                        <button class="btn btn-dark" onclick="log_in()">Log in</button>
                    </div>
                </div>
            </div>
            <div v-show="alert" class="alert alert-danger shadow mt-2" role="alert">
                Incorrect username or password.
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter();

const username = ref(null);
const password = ref(null);
const alert = ref(false);

async function log_in() {
    if (!username.value.value.length) {
        username.focus();
        return;
    }

    if (!password.value.value.length) {
        password.focus();
        return;
    }

    alert.value = false;

    let response = await fetch("/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username.value.value,
            'password': password.value.value,
        })
    }).then((response) => {
        return response.json();
    });

    if (response.hasOwnProperty('success')) {
        sessionStorage.setItem('username', response.success);
        router.push("/");
        return
    }

    alert.value = true;
}
</script>