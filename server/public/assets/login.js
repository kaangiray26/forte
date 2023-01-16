// login.js

async function log_in() {
    var username = document.getElementById('username');
    if (!username.value.length) {
        username.focus();
        return;
    }

    var password = document.getElementById('password');
    if (!password.value.length) {
        password.focus();
        return;
    }

    document.getElementById('login_alert').classList.add("visually-hidden");

    let response = await fetch("/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': username.value,
            'password': password.value,
        })
    }).then((response) => {
        return response.json();
    })

    if (response.hasOwnProperty('success')) {
        sessionStorage.setItem('username', response.success);
        window.location.replace("/");
        return
    }

    document.getElementById('login_alert').classList.remove("visually-hidden");
}

// onMounted
document.querySelector('#password').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        log_in();
    }
})