var onHeadersReceived = function(details) {
  for (var i = 0; i < details.responseHeaders.length; i++) {
    if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase()) {
      var val = details.responseHeaders[i].value;
	  val = val.replace("frame-ancestors 'none'", "frame-ancestors 'self' https://*.vndb.org https://vndb.org");
	  details.responseHeaders[i].value = val;
    }
  }
  
  details.responseHeaders.push({name: 'Access-Control-Allow-Origin', value: 'https://vndb.org'});
  details.responseHeaders.push({name: 'Access-Control-Allow-Headers', value: 'Content-Type'});
  
  return {
    responseHeaders: details.responseHeaders
  };
};

var filter = {
  urls: ["*://*.vndb.org/*", "*://vndb.org/*"],
  types: ["main_frame", "sub_frame", "xmlhttprequest"]
};


function Decode(Arr) {
    let decoder = new TextDecoder(); 
    return decoder.decode(Arr);
}

if (chrome) {
    chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
} else {
    browser.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ["blocking", "responseHeaders"]);
}
