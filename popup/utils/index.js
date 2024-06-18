export function setValue(name, value) {
    chrome.storage.local.set({ [name]: value });
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
        console.log('parse error');
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
