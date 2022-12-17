// events.js

async function right_click(obj) {
    window.dispatchEvent(new CustomEvent('right_click', {
        detail: obj
    }));
}

export { right_click }