const startMinuteEle = document.querySelector('#start-minute');
const startSecondEle = document.querySelector('#start-second');
const endMinuteEle = document.querySelector('#end-minute');
const endSecondEle = document.querySelector('#end-second');

export function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
}

export async function getValue(names) {
    return await chrome.storage.local.get(names);
}

export async function setCurrentWebsiteData(hostName, newValues) {
    try {
        const { data = {} } = await chrome.storage.local.get(["data"]);

        if (hostName) {
            const currentWebsiteData = data[hostName] || {};
            const newData = {
                ...data,
                [hostName]: {
                    ...currentWebsiteData,
                    ...newValues
                }
            }
            setValue('data', newData);
        }
    } catch (e) {
    }
}

export async function getCurrentWebsiteData(hostName) {
    const { data = {} } = await chrome.storage.local.get(["data"]);

    return data[hostName] || {};
}

export function getHostName(url) {
    if (!url) return '';
    url = new URL(url);
    return url.hostname;
}

export function getMinuteAndSecond(time) {
    return {
        minute: Math.floor(time / 60),
        second: Math.floor(time) % 60
    }
}

export function setStartTime(time) {
    const { minute, second } = getMinuteAndSecond(time);
    startMinuteEle.value = `${minute}`;
    startSecondEle.value = `${second}`;
    setValue('startTime', time);
}

export function setEndTime(time) {
    const { minute, second} = getMinuteAndSecond(time);
    endMinuteEle.value = `${minute}`;
    endSecondEle.value = `${second}`;
    setValue('endTime', time);
}