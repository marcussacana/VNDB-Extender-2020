var onHeadersReceived = function(details) {
  for (var i = 0; i < details.responseHeaders.length; i++) {
    if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase()) {
      details.responseHeaders[i].name = "Access-Control-Allow-Origin";
      details.responseHeaders[i].value = 'https://vndb.com/';
    }
  }

  return {
    responseHeaders: details.responseHeaders
  };
};

var filter = {
  urls: ["*://*.vndb.org/*", "*://vndb.org/*"],
  types: ["main_frame", "sub_frame", "xmlhttprequest"]
};

var onBeforeRequested = function (details) {
    if (details.url.indexOf("/query-result") < 0)
        return;

    var Data = Decode(details.requestBody.raw[0].bytes);

    var Controller = new StorageController();
    Controller.set("QueryPostData", Data);
}

function Decode(Arr) {
    let decoder = new TextDecoder(); 
    return decoder.decode(Arr);
}

if (chrome) {
    chrome.webRequest.onBeforeRequest.addListener(onBeforeRequested, filter, [ "blocking", "requestBody" ]);
    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
} else {
    browser.webRequest.onBeforeRequest.addListener(onBeforeRequested, filter, [ "blocking", "requestBody" ]);
    browser.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
}
