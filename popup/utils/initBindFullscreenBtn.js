import {
    setCurrentWebsiteData,
    getHostName,
    getCurrentWebsiteData,
} from './index.js';

const whiteList = ['www.bilibili.com', 'v.qq.com', 'www.iqiyi.com', 'v.youku.com'];

const clickHereEle = document.querySelector('#fullscreen-click-here');
const rebindFullscreenBtnEle = document.querySelector('#fullscreen-rebind-btn');
const deleteFullscreenBtnEle = document.querySelector('#fullscreen-delete-btn');
const bindTextEle = document.querySelector('#fullscreen-bind-text');
const unbindTextEle = document.querySelector('#fullscreen-unbind-text');

const FullscreenBtnType = {
    Manual: 'manual',
    Auto: 'auto',
    Unbind: 'unbind'
}

function deleteFullscreenBtn() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        const hostName = getHostName(activeTab.url);

        setCurrentWebsiteData(hostName, {fullscreenBtn: ''});
        unbindTextEle.classList.remove("hide");
        bindTextEle.classList.add("hide");
    })
}

function bindFullscreenBtn() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {message: "selectFullscreenBtn"});
    });

    window.close();
}

function initClickHere() {
    clickHereEle.onclick = bindFullscreenBtn;
    rebindFullscreenBtnEle.onclick = bindFullscreenBtn;

    deleteFullscreenBtnEle.onclick = deleteFullscreenBtn;
}

async function initBindText() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        const hostName = getHostName(activeTab.url);
        const websiteData = await getCurrentWebsiteData(hostName);

        if (
            websiteData.fullscreenBtn
            || (whiteList.includes(hostName) && !('fullscreenBtn' in websiteData))
        ) {
            unbindTextEle.classList.add("hide");
            bindTextEle.classList.remove("hide");
        } else {
            unbindTextEle.classList.remove("hide");
            bindTextEle.classList.add("hide");
        }
    })
}



export default async function initBindFullscreenBtn() {
    initClickHere();
    initBindText();

    Array.from(document.querySelectorAll("input[name=fullscreenRadios]")).forEach(ele => {
        chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
            const activeTab = tabs[0];
            const hostName = getHostName(activeTab.url);
            const value = ele.value;
            const isManualEle = value === FullscreenBtnType.Manual;
            const isAutoEle = value === FullscreenBtnType.Auto;
            const isUnbindEle = value === FullscreenBtnType.Unbind;

            ele.oninput = () => {
                setCurrentWebsiteData(
                    hostName,
                    { fullscreenBtnType: value }
                );
            };

            const { fullscreenBtnType = FullscreenBtnType.Auto } = await getCurrentWebsiteData(hostName);
            const isManual = fullscreenBtnType === FullscreenBtnType.Manual;
            const isAuto = fullscreenBtnType === FullscreenBtnType.Auto;
            const isUnbind = fullscreenBtnType === FullscreenBtnType.Unbind;

            ele.removeAttribute('checked');

            if (
                isManual && isManualEle
                || isAuto && isAutoEle
                || isUnbind && isUnbindEle
            ) {
                ele.setAttribute('checked', 'true');
            }
        })
    });
}
