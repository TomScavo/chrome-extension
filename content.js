const isYouTuBe = window.location.hostname === 'www.youtube.com';

let intervalId = null;
let videoEle = null;

function needFullscreen() {
    const whiteList = [
        'www.youtube.com'
    ]

    return !whiteList.includes(window.location.hostname);
}

function getNextBtnEle() {
    const classNames = {
        'v.qq.com': '.txp_btn_next_u',
        'www.bilibili.com': '.bpx-player-ctrl-next',
        'www.iqiyi.com': '.iqp-btn-next',
        'v.youku.com': '.kui-next-icon-0'
    };

    return document.querySelector(classNames[window.location.hostname]);
}

function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
}

function isYouKu() {
    return window.location.hostname === 'v.youku.com';
}

function isInput(e) {
    const formElements = ['INPUT', 'TEXTAREA'];
    e = e || window.event;

    return formElements.includes(e.target.tagName);
}

function getFullscreenBtnEle() {
    const classNames = {
        'v.qq.com': '.txp_btn_fullscreen',
        // 'www.bilibili.com': '.squirtle-video-next',
        'www.iqiyi.com': '.screen-small',
        'v.youku.com': '.kui-fullscreen-icon-0'
    };

    if (!classNames[window.location.hostname]) return null;

    return document.querySelector(classNames[window.location.hostname]);
}

async function handleTimeupdateEvent() {
    try {
        const {startTime = 0, endTime = 0, isSkip = false} = (await chrome.storage.local.get(["startTime", "endTime", "isSkip"])) || { startTime: 0, endTime: 0 };
        if (!isSkip) return;
        if (!videoEle || !videoEle.duration) return;
        let duration = videoEle.duration;
        if (startTime >= duration || endTime>= duration || startTime + endTime >= duration) return;

        let currentTime = videoEle.currentTime;
        let isEnd = duration - currentTime <= endTime;
        let isStart = currentTime <= startTime;

        if (isStart && startTime) {
            videoEle.currentTime = startTime;
        }

        if (isEnd) {
            const nextBtnEle = getNextBtnEle();
            if (nextBtnEle) {
                nextBtnEle.click();
            }
        }
    } catch(e) {
        console.log('error', e)
    }
}

async function skip() {
    videoEle.removeEventListener("timeupdate", handleTimeupdateEvent);

    videoEle.addEventListener("timeupdate", handleTimeupdateEvent);
}

function pauseAllVideos() {
    const videoElements = document.querySelectorAll('video');
    Array.from(videoElements).filter(node => !!node.duration)[0].pause();
    Array.from(videoElements).filter(node => !!node.duration).forEach(v => v.pause());
}

async function sleep() {
    const { isSleep = false, sleepTime, sleepTimestamp } = (await chrome.storage.local.get(["isSleep", "sleepTime", "sleepTimestamp"])) || {};
    if (!isSleep || !sleepTime || !sleepTimestamp) return;

    if (sleepTime * 60 * 1000 - (Date.now() - sleepTimestamp) <= 0) {
        pauseAllVideos();

        setTimeout(() => pauseAllVideos(), 5000);

        setValue('isSleep', false);
    }
}

function stopImmediatePropagation(e) {
    if (e.keyCode === 39 || e.keyCode === 37) {
        e.stopImmediatePropagation();
    }
}

async function setFastForward(e) {
    stopImmediatePropagation(e);

    const { fastForwardSecond = 5 } = (await chrome.storage.local.get(["isFastForward", "fastForwardSecond"])) || {};


    if (e.keyCode === 39) {
        setTimeout(() => {
            videoEle.currentTime += fastForwardSecond;
        })
    }

    if (e.keyCode === 37) {
        setTimeout(() => {
            videoEle.currentTime -= fastForwardSecond;
        })
    }
}

async function youKuKeydown(e) {
    stopImmediatePropagation(e);

    if (e.keyCode === 37) {

        let { isFastForward = false, fastForwardSecond = 5 } = (await chrome.storage.local.get(["isFastForward", "fastForwardSecond"])) || {};
        fastForwardSecond = isFastForward ? fastForwardSecond : 5;

        setTimeout(() => {
            videoEle.currentTime -= fastForwardSecond;
        })
    }
}

async function youKuKeyup(e) {
    stopImmediatePropagation(e);

    if (e.keyCode === 39) {
        let { isFastForward = false, fastForwardSecond = 5 } = (await chrome.storage.local.get(["isFastForward", "fastForwardSecond"])) || {};
        fastForwardSecond = isFastForward ? fastForwardSecond : 5;

        setTimeout(() => {
            videoEle.currentTime += fastForwardSecond;
        })
    }
}

async function fixYouKuSkip() {
    window.removeEventListener('keydown', youKuKeydown, true);
    window.removeEventListener('keyup', youKuKeyup, true);
    window.addEventListener('keydown', youKuKeydown, true);
    window.addEventListener('keyup', youKuKeyup, true);
}

async function fastForward() {
    if (isYouKu()) {
        fixYouKuSkip();
        return;
    };
    const { isFastForward = false, fastForwardSecond = 5 } = (await chrome.storage.local.get(["isFastForward", "fastForwardSecond"])) || {};

    window.removeEventListener("keydown", setFastForward, true);
    window.removeEventListener("keyup", stopImmediatePropagation, true);

    if (!isFastForward || !fastForwardSecond) return;

    window.addEventListener('keydown', setFastForward, true)
    window.addEventListener('keyup', stopImmediatePropagation, true)
}

async function speedUp() {
    const { speed = 1, isSpeedUp = false } = await chrome.storage.local.get(["speed", "isSpeedUp"]);

    if (isSpeedUp) {
        videoEle.playbackRate = speed;
    }
}

function fullscreen(e) {
    if (e.keyCode === 70 && !isInput(e) && needFullscreen()) {
        const fullscreenEle = getFullscreenBtnEle();
        if (fullscreenEle) {
            fullscreenEle.click();
        } else {
            if (!document.fullscreenElement) {
                videoEle.requestFullscreen();
              } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

function addFullscreenShortcut() {
    window.removeEventListener('keydown', fullscreen);
    window.addEventListener('keydown',fullscreen);
}

function addNextShortcut() {
    let retryTime = 0;

    const nextBtnEle = getNextBtnEle();
    if (nextBtnEle) {
        window.addEventListener('keydown', (e) =>{
            if (e.key === 'Alt') {
                nextBtnEle && nextBtnEle.click();
            }
        })
    } else {
        if (retryTime < 40) {
            setTimeout(addNextShortcut, 500);
        }

        retryTime++;
    }
}

function handleIsYouTube() {
    setInterval(() => {
        let a = document.querySelector('.ytp-ad-skip-button-modern');
        a && a.click();
    }, 1000);
}

function handleMessage() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.message === "currentTime") {
                if(!videoEle) return;
                sendResponse({
                    currentTime: videoEle.currentTime,
                    duration: videoEle.duration
                });
            }

            if (request.message === "stopSpeedUp" && videoEle) {
                videoEle.playbackRate = 1;
            }
        }
    );
}

function addEvent() {
    if (isYouTuBe){
        handleIsYouTube();
    }
    handleMessage();
    setInterval(() => {
        const videoElements = document.querySelectorAll('video');
        videoEle = Array.from(videoElements).filter(node => !!node.duration)[0] || null;
        if (videoEle) {
            skip();
            sleep();
            fastForward();
            speedUp();
            addFullscreenShortcut();
        }
    }, 1000);
    addNextShortcut();
}

addEvent();
