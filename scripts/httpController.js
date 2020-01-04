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
	get(url, callback, parameters) {
		var req = new XMLHttpRequest();
		if(req) {
			req.open('GET', url, true);
			req.onreadystatechange =  function() {
				if (req.readyState == 4) {
					callback(req.responseText, parameters);
				}
			};
			req.send();
		} else {
			console.error("XMLHttpRequest is not supported by this browser.");
		}
	}
}