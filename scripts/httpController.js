/// --------------------------------------------
/// Class that handles HTTP calls to VNDB pages.
/// --------------------------------------------
class HttpController {
	constructor() {
		
	}
	
	/// -----------------------------------------------------------------------------------
	/// Sends a GET request to the given url, calling the given callback with the response.
	/// Use the parameters field to pass along any parameters to the eventual callback.
	/// -----------------------------------------------------------------------------------
	get(url, callback, parameters, nocache = false) {
		try {
			var req = new XMLHttpRequest();
			if(req) {
				req.open('GET', url, true);
				if (nocache){
					req.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
					req.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
					req.setRequestHeader("Pragma", "no-cache"); 
				}
				req.onreadystatechange =  function() {
					if (req.status == 429 && !nocache){
						setTimeout(1000, function(){
							(new HttpController()).get(url + "?_=" + new Date().getTime(), callback, parameters, true);
						});
						return;
					}
					if (req.readyState == 4) {
						callback(req.responseText, parameters);
					}
				};
				req.send();
			} else {
				console.error("XMLHttpRequest is not supported by this browser.");
			}
		} catch (ex) {
			if (!nocache)
				return get(url, callback, parameters, true);
			throw ex;
		}
	}
}