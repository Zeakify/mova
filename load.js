(async function () {
    if (location.pathname !== "/student/dashboard/home" || location.hostname !== atob('bG9naW4uaS1yZWFkeS5jb20=')) return;
    
    console.log("MOVA-BOOTSTRAPPER | Grabbing Permissions...")

    // get the perms
    new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://pastebin.com',
            onload: resolve,
            onerror: reject
        });
    });

    new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://github.com/',
            onload: resolve,
            onerror: reject
        });
    });

    new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://raw.githubusercontent.com',
            onload: resolve,
            onerror: reject
        });
    });

    console.log("MOVA-BOOTSTRAPPER | Fetching Bundle...")

    // load code
    const code = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://pastebin.com/raw/sxjWL6i2?mova=' + Date.now(),
            onload: response => {
                console.log("MOVA-BOOTSTRAPPER | Injecting...");

                new Function('GM_xmlhttpRequest', response.responseText)(GM_xmlhttpRequest);

                resolve(response.responseText)
            },
            onerror: reject
        });
    });

    // wait for DOM and loading element to disappear
    await new Promise(resolve => {
        const isPageReady = () => 
            !document.querySelector('section[data-loader="true"]') || 
            document.querySelector('section[data-loader="true"]').style.display === 'none';
    
        const checkPageReady = () => {
            const interval = setInterval(() => {
                if (isPageReady()) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1000);
        };
    
        if (document.readyState === 'complete') {
            checkPageReady();
        } else {
            document.addEventListener('DOMContentLoaded', checkPageReady);
        }
    });

    console.log("MOVA-BOOTSTRAPPER | Fetching Resources...")

    // then create overlay 
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        webkitBackdropFilter: 'blur(10px)',
        zIndex: '2147483647',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: '0',
        transition: 'opacity 0.5s ease',
    });

    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    // load img
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://raw.githubusercontent.com/pubert-Pebble/mova/refs/heads/main/logo.png',
            responseType: 'blob',
            onload: response => {
                image.src = URL.createObjectURL(response.response);
                image.onload = () => resolve(image);
            },
            onerror: reject
        });
    });

    Object.assign(img.style, {
        zIndex: '2147483647',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        transition: 'opacity 0.5s ease',
        opacity: '0'
    });

    overlay.appendChild(img);
    setTimeout(() => {
        img.style.opacity = '1';
    }, 50);

    await new Promise(resolve => {
        // send handshake before loading screen overlay is removed
        setTimeout(() => {
            console.log("MOVA-BOOTSTRAPPER | Emitting Handshake...")

            new Function(`
                const oldWith = Array.prototype.with;
                Array.prototype.with = new Proxy(oldWith, {
                    apply(target, thisArg, argumentsList) {
                        return Reflect.apply(target, thisArg, argumentsList);
                    }
                });
            `)();
        }, 3500);

        // "loading" is done, remove overlay and send the message, then resolve
        setTimeout(() => {
            overlay.style.opacity = '0';
            img.style.opacity = '0';
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 500);
        }, 4000);
    });
})();