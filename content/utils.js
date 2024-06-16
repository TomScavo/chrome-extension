function needFullscreen() {
    const whiteList = [
        'www.youtube.com',
        'www.bilibili.com'
    ]

    return !whiteList.includes(getHostName());
}
