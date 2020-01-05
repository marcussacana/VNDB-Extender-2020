class StorageController {
    constructor() {

    }

    get(key, callback) {
        // Chrome version
		if(chrome) {
			chrome.storage.local.get(key, (result) => this.getcallback(result[key], callback));
		}
		// Firefox version
		else {
			browser.storage.local.get(key).then((result) => this.getcallback(result[key], callback));
		}
    }

    getcallback(result, callback) {
//      if(typeof(result) === "string" && result.startsWith("JSONDATA:")) {
//        result = JSON.parse(result.substr(9));
//      }
      callback(result);
    }

    set(key, value) {
        let data = {};
//       if (typeof(value) == "object")
//            value = "JSONDATA:" + JSON.stringify(value);

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
