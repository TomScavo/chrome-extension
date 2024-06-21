async function needFullscreen() {
    const whiteList = [
        'www.bilibili.com'
    ]

    const hostName = await getHostName();

    return !whiteList.includes(hostName);
}
