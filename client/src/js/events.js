// events.js

async function right_click(obj) {
    window.dispatchEvent(new CustomEvent('right_click', {
        detail: obj
    }));
}

async function playTrack(result) {
    window.dispatchEvent(new CustomEvent('playTrack', {
        detail: result
    }))
}

export { right_click, playTrack }