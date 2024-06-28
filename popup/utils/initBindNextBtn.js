import {
    setCurrentWebsiteData,
    getHostName,
    getCurrentWebsiteData,
    deleteCurrentWebsiteData
} from './index.js';

const NextType = {
    Manual: 'manual',
    Auto: 'auto',
    Unbind: 'unbind'
}

function deleteNextBtn() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        const hostName = getHostName(activeTab.url);

        setCurrentWebsiteData(hostName, {nextBtn: ''});
    })
}

export default async function initBindNextBtn() {
    const deleteNextBtnEle = document.querySelector('#delete-next-btn');

    deleteNextBtnEle.onclick = deleteNextBtn;

    Array.from(document.querySelectorAll("input[name=nextRadios]")).forEach(ele => {
        chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
            const activeTab = tabs[0];
            const hostName = getHostName(activeTab.url);
            const value = ele.value;
            const isManualEle = value === NextType.Manual;
            const isAutoEle = value === NextType.Auto;
            const isUnbindEle = value === NextType.Unbind;

            ele.oninput = () => {
                setCurrentWebsiteData(
                    hostName,
                    { nextBtnType: value }
                );
            };

            const { isAutoNext, nextBtnType = NextType.Manual } = await getCurrentWebsiteData(hostName);
            const isManual = nextBtnType === NextType.Manual;
            const isAuto = nextBtnType === NextType.Auto;
            const isUnbind = nextBtnType === NextType.Unbind;

            ele.removeAttribute('checked');

            if (isAutoNext && isAutoEle) {
                await deleteCurrentWebsiteData(hostName, 'isAutoNext');
                setCurrentWebsiteData(hostName, { nextBtnType: NextType.Auto })
                ele.setAttribute('checked', 'true');
            } else if (
                isManual && isManualEle
                || isAuto && isAutoEle
                || isUnbind && isUnbindEle
            ) {
                ele.setAttribute('checked', 'true');
            }
        })
    });
}
