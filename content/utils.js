function isIframe() {
    return window != window.top;
}

async function getURL() {
    if (isIframe()) {
        const { url = '' } = (await chrome.storage.local.get(["url"])) || {};
        return url;
    }

    return window.location.href;
}

async function getHostName() {
if (isIframe()) {
        let url = await getURL();
        if (!url) return '';
        url = new URL(url);
        return url.hostname;
    } else {
        return window.location.hostname;
    }
}

function isYouTuBeShorts() {
    return window.location.href.includes('www.youtube.com/shorts');
}

async function needFullscreen() {
    const whiteList = [
        'www.bilibili.com',
        'www.youtube.com',
        'www.iqiyi.com'
    ]

    const hostName = await getHostName();

    return !whiteList.includes(hostName) || isYouTuBeShorts();
}

function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
}

function setValues(values) {
    chrome.storage.local.set(values);
}

function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
}

function setValues(values) {
    chrome.storage.local.set(values);
}

function isYouKu() {
    return window.location.hostname === 'v.youku.com';
}

function isInput(e) {
    const formElements = ['INPUT', 'TEXTAREA'];
    e = e || window.event;

    return formElements.includes(e.target.tagName);
}

function pauseAllVideos() {
    const videoElements = document.querySelectorAll('video');
    Array.from(videoElements).filter(node => !!node.duration)[0].pause();
    Array.from(videoElements).filter(node => !!node.duration).forEach(v => v.pause());
}

function stopImmediatePropagation(e) {
    if (e.keyCode === 39 || e.keyCode === 37) {
        e.stopImmediatePropagation();
    }
}

async function getOrigin() {
    let url = await getURL();
    url  = new URL(url);
    return url.origin;
}


function findValidElement(element) {
    const isSVG = !!element.closest('svg');
    if (isSVG) {
        return findValidElement(element.parentElement);
    }

    return element;
}

async function setCurrentWebsiteData(newValues) {
    try {
        const { data = {} } = await chrome.storage.local.get(["data"]);

        const hostName = await getHostName();
        if (hostName) {
            const currentWebsiteData = data[hostName] || {};
            const newData = {
                ...data,
                [hostName]: {
                    ...currentWebsiteData,
                    ...newValues
                }
            }
            setValue('data', newData);
        }
    } catch (e) {
    }
}

function setUrl() {
    if (!isIframe()) {
        setValue('url', window.location.href);
    }
}

function enableIframeFullscreen() {
    const iframeList = Array.from(document.querySelectorAll('iframe'));
    iframeList.forEach(iframe => {
        if (!iframe.allow || !iframe.allow.includes('fullscreen')) {
            iframe.setAttribute('allow', `${iframe.allow}; fullscreen; `);
            iframe.src = iframe.src;
        }
    })
}