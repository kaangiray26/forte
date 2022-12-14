// api.js
const server = 'http://localhost:3000/api'

async function API(query) {
    let response = await fetch(server + query, {
        method: 'GET',
    }).then((response) => {
        return response.json();
    });
    return response;
}

async function playTrack(result) {
    window.dispatchEvent(new CustomEvent('playTrack', {
        detail: result
    }))
}

export { server, API, playTrack }