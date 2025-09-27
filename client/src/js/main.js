import { createApp } from "vue";
import App from "/components/App.vue";
import router from "/router";
import { Forte } from "/js/ft.js";
import { action } from "/js/events.js";

// Import our custom CSS
import "/scss/styles.scss";
import "/assets/styles.css";
import "/assets/bootstrap-icons.css";

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js");
}

window.ft = new Forte();
window.ft.init().then(() => {
    navigator.mediaSession.playbackState = "none";

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("play", () => {
        action({
            func: async function op() {
                window.ft.play();
            },
            object: [null],
            operation: "play",
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("pause", () => {
        action({
            func: async function op() {
                window.ft.play();
            },
            object: [null],
            operation: "play",
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        action({
            func: async function op() {
                window.ft.play_next();
            },
            object: [null],
            operation: "playNext",
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        action({
            func: async function op() {
                window.ft.play_previous();
            },
            object: [null],
            operation: "playPrevious",
        });
    });

    console.log("Forte initialized.");
    createApp(App).use(router).mount("#app");
});
