class StorageController {
    constructor() {

    }

    get(key, callback) {
        // Chrome version
		if(chrome) {
			chrome.storage.local.get(key, (result) => {
                callback(result[key]);
            });
		}
		
		// Firefox version
		else {
			browser.storage.local.get(key).then((result) => {
                callback(result[key]);
            });
		}
    }

    set(key, value) {
        let data = {};
        data[key] = value;

        // Chrome version
		if(chrome) {
			chrome.storage.local.set(data);
		}
		
		// Firefox version
		else {
			browser.storage.local.set(data);
		}
    }
}