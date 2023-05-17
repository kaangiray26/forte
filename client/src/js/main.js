import { createApp } from 'vue'
import App from '/components/App.vue'
import router from '/router'
import { Forte } from '/js/ft.js'
import { action } from '/js/events.js'

// Import our custom CSS
import '/scss/styles.scss'
import '/assets/styles.css'
import '/assets/bootstrap-icons.css'

if ('serviceWorker' in navigator) {
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
            operation: "play"
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("pause", () => {
        action({
            func: async function op() {
                window.ft.play();
            },
            object: [null],
            operation: "play"
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        action({
            func: async function op() {
                window.ft.play_next();
            },
            object: [null],
            operation: "playNext"
        });
    });

    // Must be synchronized in groupSession:
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        action({
            func: async function op() {
                window.ft.play_previous();
            },
            object: [null],
            operation: "playPrevious"
        });
    });

    console.log("Forte initialized.");
    createApp(App).use(router).mount('#app');
});

console.log(`

                    .........::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~~~
                    .........::::::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~~~~~~
                   ..........::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^~~~~~^
                 ...........::::::::::::::::::^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                ...........:::::::^^:^^^^^^^:^:^^^~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              ...........::::::^:^^^^^~!!777!~~~!!7Y5YYJ?!~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
           ..............:::.:^^^^^~7?YPPBB##BGGBGB##&&&##BPY7~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.......................::::::::^~!?YPGBB#####&&&&&&&&&&&&&&&&&BPJ!~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.....................:::::^::^.^!YGBB###########B##&&&&&&&&&&&&&&#GJ~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
..................:::..:^^^^!^:~YGBBB#########BGPGB#&&&&&&&&&&&&&&&&BJ~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
................::::::::^::7J5YY5BB#######BGPP5YJJY55PGGB###&&&&&&&&&&B?~^^^^^^^^^^^^^^^^^^^^^^^::^^
...............::::::::::^7YJGGB######BGP5YJJJJ??????????JJYY5GB#&&&&&&&P!^^^^^^^^::::::::::::::::::
...........:..::::::::::^!YJGBB#####BG5JJ????????????7777777???JY5G&&&&&&#Y~^^^^^^^:::::::::::::::::
.............::.::::::::75PB######BG5J??????7??77??77777777777777??YG&&&&&&G!^^^^^^^^:::::::::::::::
.............:......:::!5G#######BPY?????7777777777777777777777777???5#&&&&&B?~~~^7J^^::::::::::::::
.............::::...::~5G######BGY??????77777777777777777777777777?77?JG&&&&&&Y!!?5J^^::::::::::::::
.............::....::^JG######B5J???????7?777777777777777777777777??????P&&&@&&&GY?Y7^::::::::::::::
.................::::!PB#####G5J??????????77777777777777!!!!!!777???????J5&&@@@&&B##J^^^::::::::::::
:...7^.......!7.....!BGB####B5J?????????JJJ???7777777!!!!!!!!!!777????JJJJB&@@@&BGBGJ?!~:::..:...::.
YJ!!?7!????J?JY7~^^^!BBPGB##PYJJYY55PPGGGBBBBGP5J?7777!!!777?JYYY5555YYYYJG@@@@B#&GPP5J~............
55557!777??JJJJJJJ?7JPPGBGPBGBBBBBB#&&&&&#######BGPYJJJJJYPB#######BBBGGBBB##&##@#YJY??~7JJ77!^~~^::
5YY5Y7!?J?7???7???7!555Y5GGPP###BBBB#&&&&#BBBBBBB###BGPPB##&&&&###BBBBBBBB#&##&@&#B5J75PGBGPGGBBGPYJ
YYYYJJ?YY?7?JJJJJ?7?P55JJBGY?5#BB#BB&&&&&&BBBBBB#B#B5?7?P##&&&&&BBBBB##GGGG##&@&@&G##PP5PPPGPPPGGGP5
JJ???JJJ~   .....^!^YPYJGBPY?JBB##BB##&&&&&&#######BJ777J##&&&&&#######BGGG##&@&&&&GPGYYYY~YY5555PPP
?777!~~!~.      :~.:YPB5G5YJJ?YB#BB##&&&&&&&##B####5?7777P#&&&@&&#####B#BGB&&&#&@&@&J!!!!!!!!!!!7777
...            :~.:755#BYY5YJ??G####&&&&&&&###B###PJ?777?JG&&@@@&B#B#BBGB##&@@B5#BBP?!!!!7!7!!7!7!!!
             .~7:!7!5P##P?JJJJ??5B#&&&&&&&&&&&&#BPJJ??77?JYP#&&@@#&&###BBG5#@@@BYGJ7!!77777777777777
              !^~^^~GB#&#5??JJ???J5GB######BBGPP5YJJ??777?JJYY5PPGGGPP5Y?7?&@@@@G5BY!!!!!!!777!!!777
             :~!J~~?P##&&BBB5J?????????77?????JJJJJJJ77777?J??7??77!!!7777J@@@@@@#PP?!!7?77!!77?77?7
             ::7?7!!P#&&&&#&#J?????J???7????????????J??777???77777777???77P@@@@@@@&P?7777!!!!!!!7777
             .7?~^!!YB&&&&&&&5???7???????7JJJJ???777777777777?JJ777?7777!J@@@@@@@@@&77!7!777~~!!77!!
             :.:!^^~JP#&&&&&&&Y???77??777?PBB5YYYJJJJJ??JJJJG#GY?777777!J&@@&#@@@@@@J7~!!!!!~7!!!~!~
             . :?J7?7JP#&&&&&&#Y???77??777?JPG5J?7?7!77!77?5B5?777777775&@@&#P&@@@@@P7?!!~~!!!?!!7?7
              .^77.^JJJPB&&&&&&&PJ??????77777J5YYJJ7!7!7JJYY?777!7777J#@@@@#Y5B@@@@&Y!!7!!!!!!!!!!77
              .^.:  :7!?G#&&&&&&&B5J????J???????JJJJJJJJJ?777777777YB@@@@#&P7Y&@@@@P77!!!!77777J777?
            ...:.!^.^Y~JGB&&&&&&&@#P5JJ??J??????77777777777777777Y#@@@@@&&P75&@@@@G7!!!~!~~!!~!7!!77
                 :7~7?^5GGGB#&&&&&&#P5YYJJJ????????7777777??77?JB@@@@@@&&GYB&@@@&&?!!!!~~~!!!!!~~~~~
              .:   .::!PGGPPPGB#&@@&B5YYYYJJJ???7777!!!!!777?JP@@@@@@@@&#&&@@@&YPB77!~~!!!!7??7777??
 .             .  :!?5GGGPGPPPPPPB###BPYJJJJJJJJ???777777?7??P&@@@@@@@@@@@@@#YJ?YP!~!!77!!???7!~~!!~
         ..:^!7?Y5PGGGGGGGGGGPPPPP5PPGGGGP55YJJ????????????J5#@@@@@@@@&&&#PJ??5JY?~!!!!!~~!!!777777?
::^~^!77?J5Y5GGGGGGGGGGGGGPGPGGGGPPPPPPPPGGGBGGPP555Y5555PGB#&&&&&&##B5??7~!JY??Y??77?JJ?77?J5555YYJ
JJ755Y5GPPPGPGGGGGGGGBBGGGGPPGPGGPPPPPPPPP5PPPGGGBGGGGGGGGPGPPPPPPP5GBBGP7??7!?7!!7JJ??JJJJ????77777
P5PPGPPGGGGBGGBGGBBGGGGGGGGGGPGPPPPPPPPPGPPPPPP5PP5PP5P5P55P5PPPPPGBB###BBBGP5GPJJYYYYJ?7777???????J
PPGBBGGGBGGGBGGBBGBBGGGGGGGGGGGGGPPPPPPPPPGPPGPPGPPPPPPPPPPPPPGGGGB###BGB#B#&####BBGYJ??7????77!!~!!
PPPGGBGPGBGGBBGBBGGBGGBBBGGGGGGPPGPPPPPPPGPPPPPGPGGPGPPPPPGPGGBBBBBBBGGB#BB##B##B#####BGJ7!~!?777?YJ
PGGGGGGGB#GGGBGGGBGGBBGGBBBBBGGPPGPPPPPGGGGPGPGGPGPPGPGPPGGBGBBBBBGGGBBBBB#BB#B##B##B##B#BG5?JYY????
PPGGBGPBBBBGGBBGGBGGGBGGBBGBBBBBGGGGGGPPPPPPPPGGPGGPGGPGGGGGGGGGPGBBBGGBBBB#BB#BB#BB##&##BB#GP?777J5
`)