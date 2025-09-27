// events.js
import { store } from '/js/store.js';

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

async function refresh_queue(obj) {
    window.dispatchEvent(new CustomEvent('queue', {
        detail: obj
    }));
}

async function reaction(obj) {
    window.dispatchEvent(new CustomEvent('reaction', {
        detail: obj
    }));
}

async function group_key(obj) {
    window.dispatchEvent(new CustomEvent('group_key', {
        detail: obj
    }));
}

async function notify_peer(obj) {
    if (store.peer_status == 'connected') {
        window.dispatchEvent(new CustomEvent('peer', {
            detail: obj
        }));
    }
}

async function notify_message(obj) {
    window.dispatchEvent(new CustomEvent('message', {
        detail: obj
    }));
}

async function lyrics(obj) {
    window.dispatchEvent(new CustomEvent('lyrics', {
        detail: obj
    }));
}

async function action(options) {
    store.func_stack.push(options.func);
    notify_peer({
        type: 'execute',
        object: options.object,
        operation: options.operation
    });
    if (store.peer_status != 'connected') {
        let func = store.func_stack.pop();
        func();
        return;
    }
}

export { right_click, notify, reaction, action, notify_peer, refresh_queue, group_key, notify_message, lyrics }