import initBindNextBtn from './initBindNextBtn.js';
import initBindFullscreenBtn from './initBindFullscreenBtn.js';

const homeWrapperEle = document.querySelector('.home-wrapper');
const settingWrapperEle = document.querySelector('.setting-wrapper');
const settingIconEle = document.querySelector('#setting-icon');
const closeIconEle = document.querySelector('#close-icon');

function handleSettingIconClicked() {
    homeWrapperEle.classList.add("hide");
    settingWrapperEle.classList.remove("hide");
}

function handleCloseIconClicked() {
    settingWrapperEle.classList.add("hide");
    homeWrapperEle.classList.remove("hide"); 
}

export default function initSetting() {
    settingIconEle.onclick = handleSettingIconClicked;
    closeIconEle.onclick = handleCloseIconClicked;
    
    initBindNextBtn();
    initBindFullscreenBtn();
}
