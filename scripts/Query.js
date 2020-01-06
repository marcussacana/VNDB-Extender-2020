function IsAnon() {
	var Elm = document.getElementById("root");
	if (Elm != null && Elm.innerHTML.indexOf("Please log in") >= 0)
    	return true;

	var Menus = document.getElementsByClassName("menubox");
	var Anon = false;
	for (var i = 0; i < Menus.length; i++)
		if (Menus[i].innerHTML.indexOf("Password reset") >= 0){
			Anon = true;
		}
	return Anon;
}

if (document.location.hostname == "vndb.org") {//if is running in the vndb.org in the extension context
		if (IsAnon()) {
			var LoginAsked = sessionStorage.getItem("LoginAsked");
			if (typeof(LoginAsked) == "undefined" || LoginAsked === null)
				LoginAsked = false;
			sessionStorage.setItem("LoginAsked", true);
			var MSG = "The VNDB Extender works better if you sign into your account,\nIf you want login press OK.";
			if (!LoginAsked && confirm(MSG)){
				document.location = "https://vndb.org/u/login";
			}
		}
	
	window.addEventListener("message", function(a) { eval(a.data); });

} else if (typeof(ace) != "undefined") {//If the script is running in the query.vndb.org in the page context
	window.addEventListener("message", function(a) { 
		var rst = eval(a.data);
		if (typeof(rst) != "undefined"){
			rst = escape(JSON.stringify(rst));
		    window.top.postMessage("Query.Response = JSON.parse(unescape(\""+rst+"\")); Query.Finished = true;", "https://vndb.org");
		} else {
		    window.top.postMessage("Query.Response = undefined; Query.Finished = true;", "https://vndb.org");
		}
	});
	
    window.addEventListener("load", function() { window.top.postMessage("Query.Loaded = true;", "https://vndb.org"); });
} else {//If the script is running in the query.vndb.org but in the extension context
		if (!IsAnon()) {
			var Script = document.createElement("script");
			Script.src = chrome.extension.getURL("scripts/Query.js");
			document.body.parentElement.insertBefore(Script, document.body.parentElement.firstElementChild);
		}
}

class Query {
    constructor() {
		if (document.location.hostname != "vndb.org"){
			console.log("QueryHelper Instance Skiped: " + document.location.hostname);
			return;
		}

		this.mainBox = document.getElementsByClassName("mainbox")[1];
		this.frame = document.createElement("iframe");
		this.frame.hidden = true;
		this.frame.src = "https://query.vndb.org/queries/new";
		document.body.parentElement.insertBefore(this.frame, document.body.parentElement.firstElementChild);

		Query.Helper = this;
	}

	BeginInvoke(script) {
		 this.frame.contentWindow.postMessage(script, "https://query.vndb.org");
	}

	async Invoke(script) {

		while (!Query.Loaded)
			await this.timeout(50);
		
		Query.Response = null;
		Query.Finished = false;
		this.BeginInvoke(script);
		while (!Query.Finished)
			await this.timeout(10);

		return Query.Response;
	}

    async Do(query) {
		console.log("Query Request:\n" + query);
		while (await this.Invoke('document.getElementsByTagName("select").length == 0 || document.getElementsByTagName("select")[0].value == ""'))
			await this.timeout(50);

        await this.Invoke('ace.edit("query-ace-editor").setValue("'+query.replace("\"", "\\\"")+'"); true;');
		await this.Invoke('var bnt = document.getElementsByTagName("button"); for (var i = 0; i < bnt.length; i++) if (bnt[i].className.indexOf("Button_primary") >= 0) { bnt[i].click(); break; } true;');
		while (true) {		
			await this.timeout(100);
			var Result = await this.Invoke('var a = document.getElementsByTagName("a"); for (var i = 0; i < a.length; i++) if (a[i].className.indexOf("QueryResultHeader_iconLink") >= 0 && a[i].innerHTML.indexOf("json") >= 0) { a = a[i]; break; } a.href;');
			if (Result == undefined)
				continue;
			Result = this.getJSON(Result);
			console.log("Query Result:");
			console.log(Result);
			return Result;
		}
    }

	getJSON(url) {
        var resp;
        var xmlHttp;

        resp  = '';
        xmlHttp = new XMLHttpRequest();

        if(xmlHttp != null) {
            xmlHttp.open("GET", url, false);
            xmlHttp.send(null);
            resp = xmlHttp.responseText;
        }

        return JSON.parse(resp);
    }


	timeout(ms) {
   	    return new Promise(resolve => setTimeout(resolve, ms));
	}

	static Loaded = false;
	static Response = null;
	static Finished = false;
	static Helper = null;
}

Query.Helper = new Query();
