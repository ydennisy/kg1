const makeIndexRequest = async (url, textSelection) => {
  const response = await fetch('http://localhost:8000/api/index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urls: [url] }),
  });
  console.log(response.json());
};

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'sendText',
    title: 'KG1: Index',
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId == 'sendText') {
    console.log(info);
    console.log(tab);
    makeIndexRequest(info.pageUrl, info.selectiontext);
  }
});
