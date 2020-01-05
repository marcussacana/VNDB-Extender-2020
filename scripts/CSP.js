var onHeadersReceived = function(details) {
  for (var i = 0; i < details.responseHeaders.length; i++) {
    if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase()) {
      details.responseHeaders[i].name = "Access-Control-Allow-Origin";
      details.responseHeaders[i].value = 'http://vndb.com/';
    }
  }

  return {
    responseHeaders: details.responseHeaders
  };
};

var filter = {
  urls: ["*://*.vndb.org/*", "*://vndb.org/*"],
  types: ["main_frame", "sub_frame"]
};

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
