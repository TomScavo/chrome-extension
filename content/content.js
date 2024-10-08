const isYouTuBe = window.location.hostname === 'www.youtube.com';

let intervalId = null;
let videoEle = null;
let mousedownTimestamp = 0;
let mousedownTimeout = null;
let nextBtnEle = null;
let isExecutingNext = false;
let isExecutingTimeupdate = false;
let mouseMoveTimer = null;
let removeAlertEleTimer = null;
let keysPressed = {};

const BindType = {
    Manual: 'manual',
    Auto: 'auto',
    Unbind: 'unbind'
}

async function getCurrentWebsiteData() {
    const { data = {} } = await chrome.storage.local.get(["data"]);
    
    const hostName = await getHostName();

    return data[hostName] || {};
}

async function getNextBtnEle() {
    const classNames = {
        'v.qq.com': '.txp_btn_next_u',
        'www.bilibili.com': '.bpx-player-ctrl-next',
        'www.iqiyi.com': '.iqp-btn-next',
        'v.youku.com': '.kui-next-icon-0'
    };

    const currentWebsiteData = await getCurrentWebsiteData();

    const hostName = await getHostName();

    return document.querySelector(
        !('nextBtn' in currentWebsiteData) && classNames[hostName]
        || currentWebsiteData.nextBtn || null
    );
}

async function getFullscreenBtnEle(isAuto) {
    const classNames = {
        'v.qq.com': '.txp_btn_fullscreen',
        'v.youku.com': '.kui-fullscreen-icon-0'
    };

    const currentWebsiteData = await getCurrentWebsiteData();

    const hostName = await getHostName();

    if (isAuto) {
        return document.querySelector(classNames[hostName] || null);
    }

    return document.querySelector(
        !('fullscreenBtn' in currentWebsiteData) && classNames[hostName]
        || currentWebsiteData.fullscreenBtn || null
    );
}

async function autoNext() {
    if (isIframe()) {
        const origin = await getOrigin();
        window.top.postMessage("chromeExtensionAutoNextVideo", origin);
        return;
    }

    const url = await getURL();

    const lastNumStr = url.split('/').filter(Boolean).at(-1).split(/[-\._]/).filter(Boolean).filter(i => !!Number(i)).at(-1);

    if (lastNumStr) {
        const index = url.lastIndexOf(lastNumStr);

        const length = lastNumStr.length;
        if (index !== -1) {
            const newUrl = url.substring(0, index) + String(Number(lastNumStr) + 1) +  url.substring(index + length);

            window.location.href = newUrl;
        }
    }
}

function handleLoop({startTime, endTime, isSkip}) {
    let duration = videoEle.duration;
    let currentTime = videoEle.currentTime;

    const isInvalidStartTimeAndEndTime = startTime >= duration || endTime>= duration || startTime + endTime >= duration;
    if (isInvalidStartTimeAndEndTime || !isSkip) {
        let isEnd = duration - currentTime <= 1;
        if (isEnd) {

            videoEle.currentTime = 0;
        }
    } else {
        let isEnd = duration - currentTime <= endTime;
        if (isEnd) {

            videoEle.currentTime = startTime;
        }
    }
}

async function handleTimeupdateEvent() {
    try {
        if (isExecutingTimeupdate) return;
        isExecutingTimeupdate = true;
        setTimeout(() => {
            isExecutingTimeupdate = false;
        }, 500)
        if (!videoEle || !videoEle.duration) return;
        const {startTime = 0, endTime = 0, isSkip = false, isLoop = false} = (await chrome.storage.local.get(["startTime", "endTime", "isSkip", "isLoop"])) || { startTime: 0, endTime: 0 };
        if (isLoop) handleLoop({startTime, endTime, isSkip});
        if (!isSkip) return;
        let duration = videoEle.duration;
        if (startTime >= duration || endTime>= duration || startTime + endTime >= duration) return;

        let currentTime = videoEle.currentTime;
        let isEnd = duration - currentTime <= endTime;
        let isStart = currentTime <= startTime;

        if (isStart && startTime) {
            videoEle.currentTime = startTime;
        }
        const { nextBtnType = BindType.Manual } = await getCurrentWebsiteData();
        const isManualNext = nextBtnType === BindType.Manual;
        const isAutoNext = nextBtnType === BindType.Auto;

        if (isEnd && !isExecutingNext && isManualNext && !isLoop) {
            isExecutingNext = true;
            nextBtnEle = await getNextBtnEle();
            if (nextBtnEle) {
                nextBtnEle.click();
                isExecutingNext = false;
            } else {
                iframeSendNextCommand();
            }
            setTimeout(() => {
                isExecutingNext = false;
            }, 10000);
        }

        if (isEnd && !isExecutingNext && isAutoNext && !isLoop) {
            isExecutingNext = true;
            autoNext();

            setTimeout(() => {
                isExecutingNext = false;
            }, 10000);
        }
    } catch(e) {}
}

async function skip() {
    videoEle.removeEventListener("timeupdate", handleTimeupdateEvent);

    videoEle.addEventListener("timeupdate", handleTimeupdateEvent);
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

async function iframeSendFullscreenCommand() {
    const currentWebsiteData = await getCurrentWebsiteData();

    if (currentWebsiteData.fullscreenBtn) {
        const origin = await getOrigin();

        window.top.postMessage("chromeExtensionTriggerFullscreenBtn", origin);
    }
}

function checkIsMultipleKeysPressed() {
    window.addEventListener('keydown', e => {keysPressed[e.key] = true;});
    window.addEventListener('keyup', e => {delete keysPressed[e.key];});
}

function IsMultipleKeysPressed(currentKey = '') {
    const keys = Object.keys(keysPressed);
    keysPressed = {};
    if (!currentKey) {
        return keys.length > 1;
    } else {
        return !!keys.filter(key => key !== currentKey).length;
    }
}

async function fullscreen(e) {
    if (e.keyCode === 70 && !isInput(e) && !IsMultipleKeysPressed(e.key)) {
        const { fullscreenBtnType = BindType.Auto } = await getCurrentWebsiteData();
        const isManual = fullscreenBtnType === BindType.Manual;
        const isAuto = fullscreenBtnType === BindType.Auto;
        const isUnbind = fullscreenBtnType === BindType.Unbind;
        if (isUnbind) return;

        const shouldFullscreen = await needFullscreen();
        if (!shouldFullscreen) return;

        if (isManual) {
            const fullscreenEle = await getFullscreenBtnEle();

            if (fullscreenEle) {
                e.stopImmediatePropagation();
                fullscreenEle.click();
                return;
            }
    
            if (!fullscreenEle && isIframe()) {
                iframeSendFullscreenCommand();
            }
        }

        if (isAuto) {
            e.stopImmediatePropagation();
            const fullscreenEle = await getFullscreenBtnEle(true);

            if (fullscreenEle) {
                fullscreenEle.click();
            } else {
                if (!document.fullscreenElement) {
                    videoEle && videoEle.requestFullscreen();
                  } else if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }
    }
}

function addFullscreenShortcut() {
    window.removeEventListener('keydown', fullscreen, true);
    window.addEventListener('keydown',fullscreen, true);
}

async function iframeSendNextCommand() {
    const currentWebsiteData = await getCurrentWebsiteData();

    if (!nextBtnEle && currentWebsiteData.nextBtn && isIframe()) {
        const origin = await getOrigin();

        window.top.postMessage("chromeExtensionTriggerNextBtn", origin);
    }
}

async function handleNextShortcut(e) {
    const { isNextShortcut = true } = await chrome.storage.local.get(["isNextShortcut"]);
    if (!isNextShortcut) return;

    const { nextBtnType = BindType.Manual } = await getCurrentWebsiteData();
    const isManualNext = nextBtnType === BindType.Manual;
    const isAutoNext = nextBtnType === BindType.Auto;

    if (e.key === 'Alt' && isAutoNext) {
        autoNext();
        return;
    }

    nextBtnEle = await getNextBtnEle();

    if (e.key === 'Alt' && isManualNext && nextBtnEle) {
        nextBtnEle.click();
        return;
    }

    if (e.key === 'Alt' && isManualNext && !nextBtnEle) {
        iframeSendNextCommand();
    }
}

async function clickNextBtn() {
    nextBtnEle = await getNextBtnEle();
    nextBtnEle && nextBtnEle.click();
}

async function clickFullscreenBtn() {
    fullscreenBtnEle = await getFullscreenBtnEle();
    fullscreenBtnEle && fullscreenBtnEle.click();
}

async function addNextShortcut() {
    window.removeEventListener('keydown', handleNextShortcut, true);
    window.addEventListener('keydown', handleNextShortcut, true);
}

function handleIsYouTube() {
    setInterval(() => {
        let a = document.querySelector('.ytp-ad-skip-button-modern');
        a && a.click();
    }, 1000);
}

async function saveBindBtnInfo(e) {
    const btnEle = findValidElement(e.target);
    const btnInfo = uniqueSelector(btnEle);
    const { isBindNextBtn = false, isBindFullscreenBtn = false } = await chrome.storage.local.get(['isBindNextBtn', 'isBindFullscreenBtn']);

    if (isBindNextBtn) {
        setCurrentWebsiteData({
            nextBtn: btnInfo,
            nextBtnType: BindType.Manual
        })
    }

    if (isBindFullscreenBtn) {
        setCurrentWebsiteData({
            fullscreenBtn: btnInfo,
            fullscreenBtnType: BindType.Manual
        })
    }
}

function successSaveBtn(text) {
    removeBindDataAndEvents();

    const alertEle = document.querySelector('#chrome-extension-tencent-video');
    if (alertEle) {
        alertEle.innerHTML =
        `
            <div style="font-size: 14px; display: flex; justify-content: center; align-items: center; position: fixed; color: #333; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 20px 0px; background: #fff; z-index: 9999; top: 5%; margin-left: 50%; transform: translate(-50%, 0);">
                <svg style="margin-right: 5px;" width="22" height="22" t="1718264268279" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4668"><path d="M512 53.248c129.707008 3.412992 237.739008 48.299008 324.096 134.656S967.339008 382.292992 970.752 512c-3.412992 129.707008-48.299008 237.739008-134.656 324.096S641.707008 967.339008 512 970.752c-129.707008-3.412992-237.739008-48.299008-324.096-134.656S56.660992 641.707008 53.248 512c3.412992-129.707008 48.299008-237.739008 134.656-324.096S382.292992 56.660992 512 53.248z m-57.344 548.864l-101.376-101.376c-8.192-7.508992-17.579008-11.264-28.16-11.264-10.580992 0-19.796992 3.924992-27.648 11.776-7.851008 7.851008-11.776 16.896-11.776 27.136s3.755008 19.456 11.264 27.648l130.048 130.048c7.508992 7.508992 16.724992 11.264 27.648 11.264 10.923008 0 20.139008-3.755008 27.648-11.264l269.312-269.312c10.24-10.24 13.483008-22.699008 9.728-37.376-3.755008-14.676992-12.971008-23.892992-27.648-27.648-14.676992-3.755008-27.136-0.512-37.376 9.728L454.656 602.112z" p-id="4669" fill="#0cb11d"></path></svg>
                <span style="color: #333;">${text ? text : '绑定成功！可在设置中进行修改。'}</span>
            </div>
        `;
        removeAlertEleTimer = setTimeout(() => {
            removeAlertEle();
        }, 8000);
    }
}

async function bindBtn(e) {
    const isBindingButton = await checkIsBindingButton();
    if (!isBindingButton) {
        removeBindBtnEventListener();
        return;
    };

    saveBindBtnInfo(e);

    if (isIframe()) {
        const origin = await getOrigin();
        window.top.postMessage("chromeExtensionSuccessBindBtn", origin);
        removeBindDataAndEvents();
    } else {
        successSaveBtn();
    }
}

async function checkIsBindingButton() {
    const { isBindNextBtn = false, isBindFullscreenBtn = false } = await chrome.storage.local.get(['isBindNextBtn', 'isBindFullscreenBtn'])
    return isBindNextBtn || isBindFullscreenBtn;
}

async function bindBtnMousedown(e) {
    const isBindingButton = await checkIsBindingButton();
    if (!isBindingButton) {
        removeBindBtnEventListener();
        return;
    };

    mousedownTimestamp = Date.now();

    mousedownTimeout = setTimeout(async () => {
        bindBtn(e);
    }, 2000);
}

async function bindBtnMouseup(e) {
    const isBindingButton = await checkIsBindingButton();
    if (!isBindingButton) {
        removeBindBtnEventListener();
        return;
    };

    const isFailToAddNextBtn = (Date.now() -  mousedownTimestamp) / 1000 < 3;
    if (isFailToAddNextBtn) clearTimeout(mousedownTimeout);
}

function removeBindBtnEventListener() {
    clearTimeout(mouseMoveTimer);
    window.removeEventListener('mousedown', bindBtnMousedown, true);
    window.removeEventListener('mouseup', bindBtnMouseup, true);
    window.removeEventListener('mousemove', mouseMove);
}

function resetBindInfo() {
    setValues({
        isBindNextBtn: false,
        isBindFullscreenBtn: false
    })
}

function removeBindDataAndEvents() {
    resetBindInfo();
    removeBindBtnEventListener();
}

function removeAlertEle() {
    const alertEle = document.querySelector('#chrome-extension-tencent-video');
    alertEle && alertEle.remove();
}

function removeBind() {
    clearTimeout(removeAlertEleTimer);

    removeAlertEle();
    removeBindDataAndEvents();
}

function addIframeMessageEventListener () {
    if (isIframe()) return;

    window.addEventListener('message', function(event) {
        if (event.data === 'chromeExtensionSuccessBindBtn') {
            successSaveBtn();
        }

        if (event.data === 'chromeExtensionTriggerNextBtn') {
            clickNextBtn();
        }

        if (event.data === 'chromeExtensionTriggerFullscreenBtn') {
            clickFullscreenBtn();
        }

        if (event.data === 'chromeExtensionAutoNextVideo') {
            autoNext();
        }
    });
}

function autoSelectNextBtn() {
    setCurrentWebsiteData({nextBtnType: BindType.Auto});
    successSaveBtn('自动绑定成功，如不生效、或出现异常，可在设置中解除绑定。');
}

function autoSelectFullscreenBtn() {
    setCurrentWebsiteData({fullscreenBtnType: BindType.Auto});
    successSaveBtn();
}

function mouseMove(e) {
    clearTimeout(mouseMoveTimer);

    mouseMoveTimer = setTimeout(() => {
        bindBtn(e);
    }, 4000);
}

function bindBtnEvents() {
    removeBindBtnEventListener();
    window.addEventListener('mousedown', bindBtnMousedown, true);
    window.addEventListener('mouseup', bindBtnMouseup, true);
    window.addEventListener('mousemove', mouseMove);
}

function handleBindFullscreenMessage() {
    removeBind();

    setValue('isBindFullscreenBtn', true);

    if (!isIframe()) {
        const ele = document.querySelector('body');
        const newDiv = document.createElement('div');
        newDiv.id = "chrome-extension-tencent-video";
        newDiv.innerHTML =
        `
            <div style="font-size: 14px; display: flex; justify-content: center; align-items: center; position: fixed; color: #333; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 20px 0px; background: #fff; z-index: 9999; top: 5%; margin-left: 50%; transform: translate(-50%, 0); white-space: nowrap;">
                <svg style="margin-right: 5px;" width="22" height="22" t="1718262072377" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3543"><path d="M512.001 928.997c230.524 0 418.076-187.552 418.075-418.077 0-230.527-187.552-418.077-418.075-418.077s-418.077 187.55-418.077 418.077c0 230.525 187.552 418.077 418.077 418.077zM512 301.88c28.86 0 52.26 23.399 52.26 52.263 0 28.858-23.399 52.257-52.26 52.257s-52.26-23.399-52.26-52.257c0-28.863 23.399-52.263 52.26-52.263zM459.74 510.922c0-28.86 23.399-52.26 52.26-52.26s52.26 23.399 52.26 52.26l0 156.775c0 28.86-23.399 52.26-52.26 52.26s-52.26-23.399-52.26-52.26l0-156.775z"  fill="rgb(250, 173, 20)" p-id="3544"></path></svg>
                <span style="color: #333;">长按全屏图标</span>
                <svg style="margin: 0 5px;" t="1719604793180" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4294" width="22" height="22"><path d="M213.333333 213.333333h213.333334V128H170.666667a42.666667 42.666667 0 0 0-42.666667 42.666667v256h85.333333V213.333333zM170.666667 896h256v-85.333333H213.333333v-213.333334H128v256a42.666667 42.666667 0 0 0 42.666667 42.666667z m725.333333-42.666667v-256h-85.333333v213.333334h-213.333334v85.333333h256a42.666667 42.666667 0 0 0 42.666667-42.666667zM597.333333 213.333333h213.333334v213.333334h85.333333V170.666667a42.666667 42.666667 0 0 0-42.666667-42.666667h-256v85.333333z" fill="#515151" p-id="4295"></path></svg>
                <span style="color: #333;">2 秒、或悬停 4 秒即可绑定成功。找不到全屏图标？可以使用
                    <span id="chrome-extension-tencent-video-auto-select" style="color: #1d69d5; cursor: pointer; text-decoration: underline;">自动绑定</span>。
                </span>
                <span id="chrome-extension-tencent-video-cancel" style="color: red; cursor: pointer; margin-left: 10px">取消</span>
            </div>
        `;
        ele.appendChild(newDiv);
        const cancelEle = document.querySelector('#chrome-extension-tencent-video-cancel');
        if (cancelEle) {
            cancelEle.onclick = removeBind;
        }
        const autoSelectEle = document.querySelector('#chrome-extension-tencent-video-auto-select');
        if (autoSelectEle) {
            autoSelectEle.onclick = autoSelectFullscreenBtn;
        }
    }

    bindBtnEvents();
}

function selectNextBtn() {
    removeBind();

    setValue('isBindNextBtn', true);

    if (!isIframe()) {
        const ele = document.querySelector('body');
        const newDiv = document.createElement('div');
        newDiv.id = "chrome-extension-tencent-video";
        newDiv.innerHTML =
        `
            <div style="font-size: 14px; display: flex; justify-content: center; align-items: center; position: fixed; color: #333; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 20px 0px; background: #fff; z-index: 9999; top: 5%; margin-left: 50%; transform: translate(-50%, 0); white-space: nowrap;">
                <svg style="margin-right: 5px;" width="22" height="22" t="1718262072377" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3543"><path d="M512.001 928.997c230.524 0 418.076-187.552 418.075-418.077 0-230.527-187.552-418.077-418.075-418.077s-418.077 187.55-418.077 418.077c0 230.525 187.552 418.077 418.077 418.077zM512 301.88c28.86 0 52.26 23.399 52.26 52.263 0 28.858-23.399 52.257-52.26 52.257s-52.26-23.399-52.26-52.257c0-28.863 23.399-52.263 52.26-52.263zM459.74 510.922c0-28.86 23.399-52.26 52.26-52.26s52.26 23.399 52.26 52.26l0 156.775c0 28.86-23.399 52.26-52.26 52.26s-52.26-23.399-52.26-52.26l0-156.775z"  fill="rgb(250, 173, 20)" p-id="3544"></path></svg>
                <span style="color: #333;">长按下一集图标</span>
                <svg style="margin: 0 5px;" t="1718260607361" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1507" width="15" height="15"><path d="M694.272 588.8L134.656 990.208c-58.88 41.984-107.008 14.336-107.008-61.952V96.256c0-76.288 48.128-103.936 107.008-61.44L694.272 435.2c58.88 42.496 58.88 111.616 0 153.6zM975.872 1009.664H819.2V14.336h156.672v995.328z" p-id="1508"></path></svg>
                <span style="color: #333;">2 秒、或悬停 4 秒即可绑定成功。找不到下一集图标？可以使用
                    <span id="chrome-extension-tencent-video-auto-select" style="color: #1d69d5; cursor: pointer; text-decoration: underline;">自动绑定</span>。
                </span>
                <span id="chrome-extension-tencent-video-cancel" style="color: red; cursor: pointer; margin-left: 10px">取消</span>
            </div>
        `;
        ele.appendChild(newDiv);
        const cancelEle = document.querySelector('#chrome-extension-tencent-video-cancel');
        if (cancelEle) {
            cancelEle.onclick = removeBind;
        }
        const autoSelectEle = document.querySelector('#chrome-extension-tencent-video-auto-select');
        if (autoSelectEle) {
            autoSelectEle.onclick = autoSelectNextBtn;
        }
    }
    
    bindBtnEvents();
}

function handleMessage() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch(request.message) {
                case 'currentTime': {
                    if(!videoEle) return true;
                    sendResponse({
                        currentTime: videoEle.currentTime,
                        duration: videoEle.duration
                    });
                    break;
                }
                case 'stopSpeedUp': {
                    if (videoEle) {
                        videoEle.playbackRate = 1;
                    }
                    break;
                }
                case 'selectNextBtn': {
                    selectNextBtn();
                    break;
                }
                case 'selectFullscreenBtn': {
                    handleBindFullscreenMessage();
                }
            }

           return true;
        }
    );
}

async function addEvent() {
    checkIsMultipleKeysPressed();
    resetBindInfo();
    if (isYouTuBe){
        handleIsYouTube();
    }
    handleMessage();
    setInterval(() => {
        setUrl();
        const videoElements = document.querySelectorAll('video');

        const videoElementsArr = Array.from(videoElements);
        videoEle = videoElementsArr.filter(node => !node.paused && node.duration)[0] || videoElementsArr.filter(node => !!node.duration)[0] || null;
        if (videoEle) {
            skip();
            sleep();
            fastForward();
            speedUp();
        }
        addFullscreenShortcut();
        addNextShortcut();
    }, 1000);
    addIframeMessageEventListener();
}

addEvent();
