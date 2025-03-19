import {MovaAPI, iNav, iModal} from "./MovaAPI.js"
import {MovaUI} from "./assets/MovaUI.js"

const dev = false;

const test = () => {
    iModal.showModal({
        useInnerHTML: true,
        title: "Mova Anti Reverse Engineering",
        description: `
        IP: ${ip} <br>
        Name: ${iNav.student.firstName} <br>
        Account Username: ${iNav.dashHook.student.userName} <br>
        School: ${iNav.dashHook.student.primarySchoolEnrollment.school.name} <br>
        Grade: ${iNav.dashHook.student.gradeLevelData.chronologicalGradeLevel.id} <br>
        This data has been sent to our server.
        `,
        width : "610px",
        callback : iModal.closeModal,
    });
}

async function hash(input) {
    const EncoderInstance = new TextEncoder();
    const HashBuffer = await crypto.subtle.digest('SHA-512', EncoderInstance.encode(input));
    return Array.from(new Uint8Array(HashBuffer)).map(Value => Value.toString(16).padStart(2, '0')).join('');
}
function cleanJSON(jsonString) {
    return jsonString
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*([\]}])/g, '$1')
}

(async () => {
    if (location.pathname !== "/student/dashboard/home" || location.hostname !== atob('bG9naW4uaS1yZWFkeS5jb20=')) return;

    let Mova = {
        version: 2.1,
        farming: false,

        premiumUsers: [
            "a9935c835dbc66108f635ae05803a57d231d8ebea44b1173cfe47d8793b1daf62f7d39568d96918030a200eeb652e4aad15910faaa92b8002f316d6bed45b3ad"
        ]
    }

    let config;

    // start close reading hook
    iNav.closeReadingHook()
    
    if (!dev) {
        config = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://pastebin.com/raw/HSGFfAHE?mova=" + Date.now(),
                onload: function(response) {
                    resolve(JSON.parse(cleanJSON(response.responseText)));
                },
                onerror: function() {
                    alert("failed to contact server");
                    throw new Error("server error");
                }
            });
        });

        console.log("MOVA | Fetched Config, Handshake Awaiting...");

        await new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
            if (Array.prototype.with.toString() !== 'function with() { [native code] }') {
                clearInterval(checkInterval);
                console.log("MOVA | Handshake Accepted");
                resolve();
            }
            }, 100);
        });

        if (!config.online) {
            alert("Mova is currently offline or disabled. Please check back later.");
            return;
        }

        if (config.version !== Mova.version) {
            alert("You are using an outdated version of Mova. Please update to the latest version.");
            return;
        }

    } else {
        console.log("MOVA | Welcome, Developer!");
        // wait for DOM
        await new Promise((resolve) => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
        
        config = {
            version: Mova.version,
            online: true
        };
        config.premiumUsers = Mova.premiumUsers;
    }

    // wait for iNav to be fully loaded
    if (!iNav || !iNav.student || !iNav.student.id) {
        await new Promise(resolve => {
            const checkINav = setInterval(() => {
                if (iNav && iNav.student && iNav.student.id) {
                    clearInterval(checkINav);
                    resolve();
                }
            }, 100);
        });
    }
    // check if the user is premium
    const hashedId = await hash(iNav.student.id);
    if (config.premiumUsers.includes(hashedId)) {
        config.isPremium = true
    } else {
        // set premium to false and define the function to return the hashed ID
        config.isPremium = false

        window.getHash = async () => {
            console.log("MOVA | Requested Hash/Token")
            const hashedId = await hash(iNav.student.id)
            prompt("Mova Premium Alert\n-  Copy this token and send it to an admin:", hashedId)
            return hashedId
        }

        // create a way for users to get the hashed ID by typing "mova"
        let typedKeys = '';
        let keyInt = null;
        
        document.addEventListener('keydown', (e) => {
            typedKeys += e.key.toLowerCase();
            
            clearTimeout(keyInt);
            
            // allow a couple seconds for the user to type
            keyInt = setTimeout(() => {
                typedKeys = '';
            }, 2500);
            
            // check if the thingy has beeb typing
            if (typedKeys.includes('token')) {
                window.getHash();
                typedKeys = '';
                clearTimeout(keyInt);
            }
        });
    }

    console.log("MOVA | Checks passed, loading...")
    console.log(config)

    // create UI after the checks
    const UI = new MovaUI("mova", "dsc.gg/mova", ((config.isPremium ? "Premium v" : "Free v") + Mova.version.toString()), /*"Press M to toggle UI"*/ "m")
    // cache JSON.stringify
    const _stringify = JSON.stringify;

    Mova.Skipper = async (score)=>{
        const api = new MovaAPI({})
        const hook = api.getHook()
        const connector = hook.connector
        const stateStore = hook.connector.stateStore

        if (api.context.location.href.includes("TUTORIAL") || api.context.location.href.includes("PRACTICE")) {
            const int = setInterval(() => {
                if (api.context.document.getElementById("nav-forward")) {
                    if (hook.lessonApi.screen && hook.token) {
                        hook.lessonApi.screen.complete({ raw: 1, max: 1 }, hook.token);
                        hook.lessonApi.screen.enableNext(1, hook.token);
                    } else {
                        Object.values(api.context.document.getElementById("nav-forward"))[1].onClick()
                    }
                } else {
                    clearInterval(int)
                }
            },1)

            setTimeout(() => {
                clearInterval(int)
            }, 60000);
        } else if (document.getElementById('closereading_lesson')) {
            // close reading
            return await document.getElementById('closereading_lesson').contentWindow.__platform.component.complete(score, "Mova")
        } else {
            // main lessons
            if (!config.isPremium) {
                UI.showToast("This is a premium feature.", "red")
                return;
            }

            if (!(await UI.showConfirm("Have you farmed at LEAST 1 minutes on this lesson?"))) {
                return UI.showToast("Please farm aleast ONE minute before skipping", "orange")
            }
            
            // override the score
            JSON.stringify = function(body) {
                body = body

                try {
                    if (body.instructionLessonOutcome) {
                        body.instructionLessonOutcome.score = score;
                    }
                } catch {}
        
                return _stringify.apply(this, arguments);
            };

            UI.showToast("Skipping lesson...", "green", 5000)

            // skipper main interval
            const int = setInterval(() => {
                if (api.context.document.getElementById("nav-forward")) {
                    // set the score
                    hook.lessonApi.score = { raw: 1, max: 1 }
                    // then complete the question
                    hook.lessonApi.screen.complete(hook.lessonApi.score, hook.token);
                    hook.lessonApi.screen.enableNext(1, hook.token);
                } else {
                    clearInterval(int)
                    UI.showToast("Lesson skipped!.", "red")

                    // reset JSON.stringify after a bit
                    setTimeout(() => {
                        JSON.stringify = _stringify
                    }, 5000);
                }
            }, 1000);
        }
    }

    Mova.Farmer = async () => {
        const splashCard = document.getElementById("html5-splash-card");
        const lessonButton = document.getElementById("lesson-splash-continue-button-button");
        const nullify = (element) => {Object.values(element)[1].onClick = null} // haha get it!?

        // check if the splash is present
        if (!splashCard) {
            return UI.showToast("Navigate to the lesson loading screen.", "orange");
        }

        // stop farming
        if (Mova.farming) {
            const api = new MovaAPI({});
            const hook = api.getHook()
            const connector = hook.connector;
            const component = connector.component;

            // stop TOT
            await component.pause();
            Mova.farming = false;
            clearInterval(Mova.intervalId);

            UI.showToast("Gained " + Mova.gained.toString() + " minutes while farming", "pink");

            Mova.gained = 0;
            component.close();
            return;
        }

        // start farming

        if (!lessonButton) {
            return UI.showToast("Please wait for the lesson to load.", "yellow");
        }

        const api = new MovaAPI({});
        const hook = api.getHook()
        const connector = hook.connector;
        const component = connector.component;

        nullify(document.getElementById("lesson-splash-close-button"))
        nullify(lessonButton)
        nullify(document.getElementById("lesson-splash-objectives-button"))

        // start TOT
        await component.start()
        await component.resume()

        // enable farming and notify user
        Mova.farming = true;
        Mova.gained = 0
        UI.showToast("Started farming. You may exit the tab, but do not close it.", "pink");

        // set an interval to increment the gained variable every minute
        Mova.intervalId = setInterval(() => {
            Mova.gained += 1
            document.getElementById("coin-amount").innerText = Mova.gained.toString()
        }, 1000 * 60); // 1000 ms * 60 = 1 minute

        return;
    }

    UI.addButton("Lesson Skipper", async ()=>{
        if (!document.getElementById("html5Iframe")) return UI.showToast("Please load a lesson.", "red")
        return UI.showPrompt("What score would you like?", "100", (score) => {
            score = parseInt(score)
            if (!Number.isInteger(score) || score < 1 || score > 100) {
                return UI.showToast("Not a valid integer between 1 and 100")
            }
            Mova.Skipper(score)
        })
    })
    UI.addButton("Minute Farmer", Mova.Farmer)

    setInterval(() => {
        if (document.getElementById("html5Iframe") && !document.getElementById("html5Iframe").contentWindow.injected) {
            document.getElementById("html5Iframe").contentWindow.injected = true

            document.getElementById("html5Iframe").contentWindow.addEventListener('keydown', (e) => {
                if (e.key === "m" || e.key === "M") {
                    UI.UI.style.display = UI.UI.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }, 1000);

    console.log("MOVA | Loaded!");
    UI.showToast(`Welcome to Mova ${ config.isPremium ? "Premium" : "Free" }! (v${ Mova.version.toString() }) Press M to hide/show the UI.`, "green", 10000);
})();