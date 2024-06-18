import { setCurrentWebsiteData, getHostName, getCurrentWebsiteData } from './index.js';

const homeWrapperEle = document.querySelector('.home-wrapper');
const settingWrapperEle = document.querySelector('.setting-wrapper');
const settingIconEle = document.querySelector('#setting-icon');
const closeIconEle = document.querySelector('#close-icon');
const deleteNextBtnEle = document.querySelector('#delete-next-btn');

function handleSettingIconClicked() {
    homeWrapperEle.classList.add("hide");
    settingWrapperEle.classList.remove("hide");
}

function handleCloseIconClicked() {
    settingWrapperEle.classList.add("hide");
    homeWrapperEle.classList.remove("hide"); 
}

async function getHostNameAsync() {
    new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve("foo");
        }, 300);
      });
}

function deleteNextBtn() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        const hostName = getHostName(activeTab.url);

        setCurrentWebsiteData(hostName, {nextBtn: ''});
    })
}

export default function initSetting() {
    settingIconEle.onclick = handleSettingIconClicked;
    closeIconEle.onclick = handleCloseIconClicked;
    deleteNextBtnEle.onclick = deleteNextBtn;

    Array.from(document.querySelectorAll("input[name=nextRadios]")).forEach(ele => {
        chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
            const activeTab = tabs[0];
            const hostName = getHostName(activeTab.url);
            const value = ele.value;
            const isManual = value === 'manual';
            const isAuto = value === 'auto';

            ele.oninput = function (e) {
                    if (value === 'manual') {
                        setCurrentWebsiteData(hostName, {isAutoNext: false});
                    } else {
                        setCurrentWebsiteData(hostName, {isAutoNext: true});
                    }
            };

            const currentWebsiteData = await getCurrentWebsiteData(hostName);

            if (currentWebsiteData.isAutoNext) {
                if (isManual) {
                    ele.removeAttribute('checked')
                } else {
                    ele.setAttribute('checked', 'true')
                }
            } else {
                if (isManual) {
                    ele.setAttribute('checked', 'true')
                } else {
                    ele.removeAttribute('checked')
                }
            }
        })
    })
}
