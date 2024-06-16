const checkboxEle = document.querySelector('#skip-checkbox');
const startMinuteEle = document.querySelector('#start-minute');
const startSecondEle = document.querySelector('#start-second');
const endMinuteEle = document.querySelector('#end-minute');
const endSecondEle = document.querySelector('#end-second');
const progressEle = document.querySelector('#progress');
const setStartBtn = document.querySelector('#set-start');
const setEndBtn = document.querySelector('#set-end');
const sleepCheckboxEle = document.querySelector('#sleep-checkbox');
const sleepSelectorEle = document.querySelector('#sleep-selector');
const sleepTimerEle = document.querySelector('#sleep-timer');
const statusErrorEle = document.querySelector('#status-error');
const statusSuccessEle = document.querySelector('#status-success');
const fastForwardCheckboxEle = document.querySelector('#fast-forward-checkbox');
const fastForwardSecondEle = document.querySelector('#fast-forward-second');
const loopCheckboxEle = document.querySelector('#loop-checkbox');
const speedUpSelectorEle = document.querySelector('#speed-selector');
const speedUpCheckboxEle = document.querySelector('#speed-checkbox');
const resetHeadEle = document.querySelector('#reset-head');
const resetTailEle = document.querySelector('#reset-tail');
const clickHereEle = document.querySelector('#click-here');
const endInputsEle = document.querySelector('#end-inputs');
const bindNextBtnEle = document.querySelector('#bind-next-btn');

let currentTime = 0;
let duration = 0;

const whiteList = ['v.qq.com', 'www.bilibili.com', 'www.iqiyi.com', 'v.youku.com', 'www.youku.com'];

function getImgSrc(hostname) {
    const classNames = {
        'v.qq.com': 'tencent.jpeg',
        'www.bilibili.com': 'bilibili.jpeg',
        'www.iqiyi.com': 'iqiyi.png',
        'v.youku.com': 'youku.jpeg'
    };
    
    let image = classNames[hostname || ''];
    if (image) return `./images/${image}`;

    // const tabIconElements = Array.from(document.querySelectorAll("link")).filter(i => i.rel && i.rel.toLowerCase().includes('icon'));
    // const tabIconEle = tabIconElements.filter(i => i.href && i.href.includes('png'))[0] || tabIconElements.filter(i => i.href)[0];
    // if (!tabIconEle || !tabIconEle.href) return null;
    // return tabIconEle.href;

    return null;
}


function getMinuteAndSecond(time) {
    return {
        minute: Math.floor(time / 60),
        second: Math.floor(time) % 60
    }
}

function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
}

function handleStartTimeChange() {
    const startMinute = parseInt(startMinuteEle.value || '0');
    const startSecond = parseInt(startSecondEle.value || '0');
    setValue('startTime', startMinute * 60 + startSecond);
}

function handleEndTimeChange() {
    const endMinute = parseInt(endMinuteEle.value || '0');
    const endSecond = parseInt(endSecondEle.value || '0');
    setValue('endTime',  endMinute * 60 + endSecond);
}

function handleClickStartBtn() {
    const { minute, second } = getMinuteAndSecond(currentTime);
    startMinuteEle.value = `${minute}`;
    startSecondEle.value = `${second}`;
    setValue('startTime', currentTime);
}

function handleClickEndBtn() {
    const { minute, second} = getMinuteAndSecond(duration - currentTime);
    endMinuteEle.value = `${minute}`;
    endSecondEle.value = `${second}`;
    setValue('endTime', duration - currentTime);
}

function handleSleepCheckboxChange(e) {

    if (!e.currentTarget.checked) {
        sleepTimerEle.innerHTML = '';
    }
    setValue('isSleep', e.currentTarget.checked);
    setValue('sleepTime', Number(sleepSelectorEle.value));
    setValue('sleepTimestamp', Date.now());
}

function handleFastForwardSecondChange() {
    const fastForwardSecond = parseInt(fastForwardSecondEle.value || '5');

    setValue('fastForwardSecond', fastForwardSecond);
}

function resetHead() {
    startMinuteEle.value = '0';
    startSecondEle.value = '0';
    setValue('startTime', 0);
}

function resetTail() {
    endMinuteEle.value = '0';
    endSecondEle.value = '0';
    setValue('endTime', 0);
}

async function initSkipForm() {
    const { startTime = 0, endTime = 0, isSkip = false } = await chrome.storage.local.get(["startTime", "endTime", "isSkip"]);
    checkboxEle.checked = isSkip;

    startMinuteEle.value = Math.floor(startTime / 60);
    startSecondEle.value = startTime % 60;
    endMinuteEle.value = Math.floor(endTime / 60);
    endSecondEle.value = endTime % 60;

    checkboxEle.onchange = (e) => setValue('isSkip', e.currentTarget.checked);
    startMinuteEle.oninput = handleStartTimeChange;
    startSecondEle.oninput = handleStartTimeChange;
    endMinuteEle.oninput = handleEndTimeChange;
    endSecondEle.oninput = handleEndTimeChange;
    setStartBtn.onclick = handleClickStartBtn;
    setEndBtn.onclick = handleClickEndBtn;
    resetHeadEle.onclick = resetHead;
    resetTailEle.onclick = resetTail;
}

async function initSleepForm() {
    const { isSleep = false, sleepTime = 30, sleepTimestamp = Date.now() } = await chrome.storage.local.get(["isSleep", "sleepTime", "sleepTimestamp"]);

    sleepCheckboxEle.checked = isSleep;
    sleepSelectorEle.value = String(sleepTime);

    sleepCheckboxEle.onchange = handleSleepCheckboxChange;
    sleepSelectorEle.onchange = (e) => setValue('sleepTime', Number(e.target.value));
}

async function initFastForwardForm() {
    const { isFastForward = false, fastForwardSecond = 5 } = (await chrome.storage.local.get(["isFastForward", "fastForwardSecond"])) || {};
    fastForwardCheckboxEle.checked = isFastForward;
    fastForwardSecondEle.value = fastForwardSecond;

    fastForwardCheckboxEle.onchange = (e) => setValue('isFastForward', e.currentTarget.checked);;
    fastForwardSecondEle.onchange = handleFastForwardSecondChange;
}

async function initSpeedUpForm() {
    const { speed = 1, isSpeedUp = false } = await chrome.storage.local.get(["speed", "isSpeedUp"]);
    speedUpCheckboxEle.checked = isSpeedUp;
    speedUpSelectorEle.value = String(speed);

    speedUpCheckboxEle.onchange = (e) => {
        const isSpeedUp = e.currentTarget.checked;
        setValue('isSpeedUp', isSpeedUp);

        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {message: "stopSpeedUp"});
        });
    }
    speedUpSelectorEle.onchange = (e) => setValue('speed', Number(e.target.value));
}

function initClickHere() {
    clickHereEle.onclick = () => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {message: "selectNextBtn"});
        });

        window.close();
    }
}

function setVideoStatus(data) {
    if (!data && statusErrorEle && statusSuccessEle) {
        statusErrorEle.style.display = 'flex'
    }

    if (data && statusErrorEle && statusSuccessEle) {
        statusErrorEle.style.display = 'none'
    }
}

function getHostName(url) {
    if (!url) return '';
    url = new URL(url);
    return url.hostname;
}

function checkNextBtnInfo() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        const { data = {} } = await chrome.storage.local.get(["data"]);
        const hostName = getHostName(activeTab.url);
        const websiteData = data[hostName] || {};
        if (websiteData.nextBtn || whiteList.includes(hostName)) {
            endInputsEle.classList.remove("hide");
            bindNextBtnEle.classList.add("hide");
        } else {
            endInputsEle.classList.add("hide");
            bindNextBtnEle.classList.remove("hide");
        }
    }); 
}

function popup() {
    setInterval(async () => {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {message: "currentTime"}, (data) => {
                setVideoStatus(data);
                if (!data) return;
                currentTime = Math.floor(data.currentTime);
                duration = Math.floor(data.duration);
                const { minute, second } = getMinuteAndSecond(currentTime);
                const time = `${String(minute).length <= 1 ? '0': '' }${minute}:${String(second).length <= 1 ? '0': '' }${second}`;
                progressEle.innerHTML = time;
            });
        });

        const { isSleep, sleepTime, sleepTimestamp } = await chrome.storage.local.get(["isSleep", "sleepTime", "sleepTimestamp"]);
        if (!isSleep && sleepCheckboxEle.checked) {
            sleepCheckboxEle.checked = false;
            sleepTimerEle.innerHTML = '';
        } 
        if (isSleep) {
            const remindTime = sleepTime * 60 - ((Date.now() - sleepTimestamp) / 1000);
            if (remindTime < 0) return;

            const { minute, second } = getMinuteAndSecond(remindTime);
            const time = `${String(minute).length <= 1 ? '0': '' }${minute}:${String(second).length <= 1 ? '0': '' }${second}`;
            sleepTimerEle.innerHTML = time;
        }

        checkNextBtnInfo();
    }, 1000);

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        const activeTab = tabs[0];
        const imageEle = document.querySelector('#icon');
        const url = new URL(activeTab.url);
        const imageSrc = getImgSrc(url.hostname);

        if (imageEle) {
            if (imageSrc) {
                imageEle.src = imageSrc;
            } else if (activeTab.favIconUrl) {
                imageEle.src = activeTab.favIconUrl;
            }
        }   
    });


}

function init() {
    document.addEventListener("DOMContentLoaded", function() {
        popup();
    });

    initSkipForm();
    initSleepForm();
    initFastForwardForm();
    initSpeedUpForm();
    initClickHere();
    // initLoopForm();
}

init();