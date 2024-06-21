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
        'www.youtube.com'
    ]

    const hostName = await getHostName();

    return !whiteList.includes(hostName) || isYouTuBeShorts();
}
