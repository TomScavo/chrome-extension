import { setValue, getValue, setStartTime, setEndTime } from './index.js';

const saveVideoWrapperEle = document.querySelector('#save-video-wrapper');
const saveVideoBtnEle = document.querySelector('#save-video-btn');
const videoNameInputEle = document.querySelector('#video-name-input');
const videoListWrapperEle = document.querySelector('#video-list-wrapper');
const saveIconEle = document.querySelector('#save-icon');
const videoListEle = document.querySelector('#video-list');
const successMsgWrapperEle = document.querySelector('#success-msg-wrapper');
const successMsgEle = document.querySelector('#success-msg');
const deleteIconEle = document.querySelector('#delete-icon');

function showSuccess(text) {
    successMsgWrapperEle.classList.remove('hide');

    if (text) {
        successMsgEle.innerHTML = text;
    }

    setTimeout(() => {
        successMsgWrapperEle.classList.add('hide');
    }, 3000)
}

async function updateVideoSelector() {
    const { videos = {}, selectedVideo = '无' } = await chrome.storage.local.get(['videos', 'selectedVideo']);

    videoListEle.innerHTML = `
        <option value="无">无</option>
        ${Object.keys(videos).reduce((prevValue, currentValue) => 
            `${prevValue}<option value="${currentValue}">${currentValue}</option>`
        , '')}
    `;

    videoListEle.value = selectedVideo;
}

async function saveVideoName() {
    let name = videoNameInputEle.value.trim();
    if (name) {
        name = filterXSS(name);
        const { videos = {}, startTime = 0, endTime = 0 } = await chrome.storage.local.get(['videos', 'startTime', 'endTime']);
        setValue('videos', {
            ...videos,
            [name]: {
                startTime,
                endTime
            }
        });
        setValue('selectedVideo', name);
    }
    videoNameInputEle.value = '';
    saveVideoWrapperEle.classList.add('hide');
    videoListWrapperEle.classList.remove('hide');
    await updateVideoSelector();
    if (name) {
        videoListEle.value = name;
        showSuccess('保存成功');
    }
}

async function handleSaveIconClicked() {
    const { selectedVideo = '无' } = await chrome.storage.local.get(['videos', 'startTime', 'endTime', 'selectedVideo']);
    if (selectedVideo !== '无') {
        videoNameInputEle.value = selectedVideo;
    }
    saveVideoWrapperEle.classList.remove('hide');
    videoListWrapperEle.classList.add('hide');
    videoNameInputEle.focus();
}

async function deleteSelectedVideo() {
    const { videos = {}, selectedVideo = '无' } = await chrome.storage.local.get(['videos', 'selectedVideo']);
    if (selectedVideo === '无') {
        return;
    }
    delete videos[selectedVideo];
    setValue('videos', {...videos});
    setValue('selectedVideo', '无');
    await updateVideoSelector();
    videoListEle.value = '无';
    showSuccess(`已删除 <span style="color: red">${selectedVideo}</span>`);
}

async function handleVideoListChange(e) {
    const name = e.target.value;
    setValue('selectedVideo', name);

    if (name === '无') return;

    const { videos = {} } = await chrome.storage.local.get(['videos']);

    const times = videos[name];
    if (!times) return;

    setStartTime(times.startTime);
    setEndTime(times.endTime);
}

export function resetVideoList() {
    setValue('selectedVideo', '无');
    videoListEle.value = '无';
}

export default function initSaveVideo() {
    updateVideoSelector();
    saveVideoBtnEle.onclick = saveVideoName;
    saveIconEle.onclick = handleSaveIconClicked;
    deleteIconEle.onclick = deleteSelectedVideo;
    videoListEle.onchange = handleVideoListChange;
}
