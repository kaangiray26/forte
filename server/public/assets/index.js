// index.js

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

// onMounted
const user_modal = document.getElementById('addUserModal');
user_modal.addEventListener('shown.bs.modal', (event) => {
    document.getElementById('username').focus();
})
user_modal.addEventListener('hidden.bs.modal', (event) => {
    window.location.reload();
})
document.getElementById('welcome').innerHTML += `<span class="fw-bold text-black"> ${sessionStorage.getItem('username')}</span>`;
get_users();