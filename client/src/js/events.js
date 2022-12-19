// events.js

async function right_click(obj) {
    window.dispatchEvent(new CustomEvent('right_click', {
        detail: obj
    }));
}

async function notify(obj) {
    window.dispatchEvent(new CustomEvent('notify', {
        detail: obj
    }));
}

export { right_click, notify }