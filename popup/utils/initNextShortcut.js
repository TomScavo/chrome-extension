import { setValue } from './index.js';

const nextShortcutCheckboxEle = document.querySelector('#next-shortcut-checkbox');
const nextShortcutEle = document.querySelector('#shortcut');

function isMac() {
    return navigator.userAgent.includes("Mac");
}

function handleSleepCheckboxChange(e) {
    setValue('isNextShortcut', e.currentTarget.checked);
}

export default async function initNextShortcut() {
    const { isNextShortcut = true } = await chrome.storage.local.get(["isNextShortcut"]);

    nextShortcutCheckboxEle.checked = isNextShortcut;
    nextShortcutCheckboxEle.onchange = handleSleepCheckboxChange;
    nextShortcutEle.innerHTML = isMac() ? 'option' : 'Alt'
}