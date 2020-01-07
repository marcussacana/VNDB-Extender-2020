class StorageController {
    constructor() {

    }

    get(key, callback) {
        // Chrome version
        if (chrome) {
            chrome.storage.local.get(key, (result) => this.getcallback(result[key], callback));
        }
        // Firefox version
        else {
            browser.storage.local.get(key).then((result) => this.getcallback(result[key], callback));
        }
    }

    getAsync(sKey) {
        if (chrome) {
            return new Promise(function(resolve, reject) {
                chrome.storage.local.get(sKey, function(items) {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                        reject(chrome.runtime.lastError.message);
                    } else {
                        resolve(items[sKey]);
                    }
                });
            });
        } else {
            return new Promise(function(resolve, reject) {
                browser.storage.local.get(sKey, function(items) {
                    if (browser.runtime.lastError) {
                        console.error(browser.runtime.lastError.message);
                        reject(browser.runtime.lastError.message);
                    } else {
                        resolve(items[sKey]);
                    }
                });
            });

        }
    }

    getcallback(result, callback) {
        callback(result);
    }

    set(key, value) {
        let data = {};

        data[key] = value;

        // Chrome version
        if (chrome) {
            chrome.storage.local.set(data);
        }

        // Firefox version
        else {
            browser.storage.local.set(data);
        }
    }
}
