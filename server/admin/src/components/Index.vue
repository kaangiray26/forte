<template>
    <div class="vh-100 vw-100 p-2">
        <div class="row gx-0 justify-content-center">
            <div class="col-11">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <a href="/">
                                <img src="/forte.svg" class="img-fluid bg-dark rounded" width="56" height="56">
                            </a>
                            <div>
                                <h5 class="card-title m-0">Forte Dashboard</h5>
                                <span id="welcome" class="text-muted">> Welcome back</span>
                            </div>
                            <div>
                                <button class="btn btn-dark" onclick="log_off()">Log off</button>
                            </div>
                        </div>
                        <ul id="user_group" class="list-group">
                            <li
                                class="d-flex justify-content-between align-items-center list-group-item bg-dark text-white">
                                <span>Users</span>
                                <button class="btn btn-light" data-bs-toggle="modal"
                                    data-bs-target="#addUserModal">Add</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div id="addUserModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add a new user</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="card shadow-lg">
                    <div class="card-body">
                        <div class="input-group flex-nowrap">
                            <span class="input-group-text" id="addon-wrapping">@</span>
                            <input id="username" type="text" class="form-control" placeholder="Username"
                                aria-label="Username" aria-describedby="addon-wrapping">
                            <button class="btn btn-dark" onclick="add_user()">Add</button>
                        </div>
                        <div id="user_add_alert" class="alert alert-primary invisible mt-2" role="alert"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

async function get_users() {
    let data = await fetch("/get_users", {
        method: "GET"
    }).then((response) => {
        return response.json();
    })

    let user_group = document.getElementById('user_group');

    if (!data.users.length) {
        user_group.innerHTML += '<li class="list-group-item list-group-item-action">No other users.</li>'
        return
    }

    data.users.forEach((user) => {
        user_group.innerHTML += `<li class="d-flex justify-content-between align-items-center list-group-item list-group-item-action"><span class="fw-bold">${user.username}</span><button class="btn btn-dark" onclick="remove_user('${user.username}')">Remove</button></li>`
    })
}

async function log_off() {
    sessionStorage.clear();
    fetch("/log_off", {
        method: "GET"
    }).then(() => {
        window.location.replace("/");
    })
}

async function add_user() {
    let username = document.getElementById('username');
    if (!username.value.length) {
        username.focus();
        return;
    }

    let response = await fetch("/add_user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username.value
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        let user_add_alert = document.getElementById('user_add_alert');
        user_add_alert.innerHTML += `<div class="d-flex flex-column"><span class="mb-2">The user has been created. Make sure to save the following token or you will not be able to see it again.</span><span>${response.success}</span></div>`
        user_add_alert.classList.remove('invisible');
    }
}

async function remove_user(username) {
    let response = await fetch("/remove_user", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty("success")) {
        window.location.reload();
    }
}

async function get_status() {
    let status = await fetch("/auth")
        .then((response) => {
            return response.json();
        });
    console.log(status);
}

onMounted(() => {
    document.querySelector('#username').addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            add_user();
        }
    })

    const user_modal = document.getElementById('addUserModal');
    user_modal.addEventListener('shown.bs.modal', (event) => {
        document.getElementById('username').focus();
    })
    user_modal.addEventListener('hidden.bs.modal', (event) => {
        window.location.reload();
    })
    document.getElementById('welcome').innerHTML += `<span class="fw-bold text-black"> ${sessionStorage.getItem('username')}</span>`;
    get_users();
})

</script>