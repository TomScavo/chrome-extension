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
