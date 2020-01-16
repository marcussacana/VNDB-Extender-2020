let storage = null;
let Loaded = false;
let Response = null;
let AsyncEnd = true;
let Finished = false;
let Helper = null;


function IsAnon() {
    var Elm = document.getElementById("root");
    if (Elm != null && Elm.innerHTML.indexOf("Please log in at") >= 0)
        return true;

    var Menus = document.getElementsByClassName("menubox");
    var Anon = false;
    for (var i = 0; i < Menus.length; i++)
        if (Menus[i].innerHTML.indexOf("Password reset") >= 0) {
            Anon = true;
        }
    return Anon;
}

if (document.location.hostname == "vndb.org") { //if is running in the vndb.org in the extension context
    if (IsAnon()) {
        var LoginAsked = sessionStorage.getItem("LoginAsked");
        if (typeof(LoginAsked) == "undefined" || LoginAsked === null)
            LoginAsked = false;
        sessionStorage.setItem("LoginAsked", true);
        var MSG = "The VNDB Extender works better if you sign into your account,\nIf you want login press OK.";
        if (!LoginAsked && confirm(MSG)) {
            document.location = "https://vndb.org/u/login";
        }
    } else
        window.addEventListener("message", function(a) {
            eval(a.data);
        });

} else if (typeof(ace) != "undefined") { //If the script is running in the query.vndb.org in the page context
    window.addEventListener("message", function(a) {
        var rst = eval(a.data);
        if (typeof(rst) != "undefined") {
            rst = escape(JSON.stringify(rst));
            window.top.postMessage("Response = JSON.parse(unescape(\"" + rst + "\")); Finished = true;", "https://vndb.org");
        } else {
            window.top.postMessage("Response = undefined; Finished = true;", "https://vndb.org");
        }
    });

    //window.addEventListener("load", function() { window.top.postMessage("Loaded = true;", "https://vndb.org"); });
} else { //If the script is running in the query.vndb.org but in the extension context
    if (!IsAnon()) {
        var Script = document.createElement("script");
        Script.src = chrome.extension.getURL("scripts/Query.js");
        document.body.parentElement.insertBefore(Script, document.body.parentElement.firstElementChild);
    }
}


class Query {
    constructor() {

		if (document.location.hostname != "vndb.org")
			return;

		storage = new StorageController();
		
		this.CORSEnforced = null;
		this.mainBox = document.getElementsByClassName("mainbox")[1];
		this.frame = document.createElement("iframe");
		this.frame.hidden = true;
		if (!IsAnon())
			this.frame.onload = function() { Loaded = true; };

		this.frame.src = "https://query.vndb.org/queries/new";
		document.body.parentElement.insertBefore(this.frame, document.body.parentElement.firstElementChild);
	}

	BeginInvoke(script) {
		 this.frame.contentWindow.postMessage(script, "https://query.vndb.org");
	}

	async Invoke(script) {

		while (!Loaded)
			await this.timeout(50);
		
		Response = null;
		Finished = false;
		this.BeginInvoke(script);
		while (!Finished)
			await this.timeout(10);

		return Response;
	}

    async Do(query) {
		console.log("Query Request:\n" + query);
		var rst = await Query.direct(query);
		if (rst !== undefined && rst.length > 0) {
			var Result = JSON.parse(rst);
			if (typeof(Result.queryResult) !== "undefined" && typeof(Result.queryResult.rows) == "object" && Result.queryResult.rows.length > 0){
				return Result.queryResult.rows;
			}
		}
		while (await this.Invoke('document.getElementsByTagName("select").length == 0 || document.getElementsByTagName("select")[0].value == ""'))
			await this.timeout(50);

        await this.Invoke('ace.edit("query-ace-editor").setValue(unescape("'+escape(query)+'")); true;');
		await this.Invoke('var bnt = document.getElementsByTagName("button"); for (var i = 0; i < bnt.length; i++) if (bnt[i].className.indexOf("Button_primary") >= 0) { bnt[i].click(); break; } true;');
		while (true) {
			await this.timeout(100);
			var Response = await this.Invoke('(() => { var a = document.getElementsByTagName("a"); var b = undefined; for (var i = 0; i < a.length; i++) if (a[i].className.indexOf("QueryResultHeader_iconLink") >= 0 && a[i].innerHTML.indexOf("json") >= 0) { b = a[i]; break; } if (typeof(b) !== "object") return; var URL = b.href; if (typeof(URL) !== "string" || URL.length == 0) return; return Query.getUrl(URL);})();');
			if (typeof(Response) != "string" || Response.length == 0)
				continue;
			return JSON.parse(Response);
		}
    }

	static getUrl(url, tries) {
		try {
    		var xhr = new XMLHttpRequest();
    		xhr.open("GET", url, false);
   			xhr.send(null);
			if (typeof(xhr.responseText) !== "string" || xhr.responseText.length == 0)
				throw new Error("Invalid HTTP Response");
			return xhr.responseText;
		} catch (ex){
			if (typeof(tries) === "undefined" || tries === null)
				return Query.getUrl(url, 2);
			if (tries >= 0)
				return Query.getUrl(url, tries - 1);
			throw ex;
		}
    }

	static async direct(query, tries, QueryData) {
		try {

			if (document.location.hostname == "vndb.org" && Helper.CORSEnforced){//Opera browser never trigger this
				AsyncEnd = false;
				Helper.BeginInvoke('Query.direct(unescape("'+escape(query)+'"), null, unescape("'+escape(await storage.getAsync("QueryPostData"))+'")).then((x) => window.top.postMessage("Response = JSON.stringify("+x+"); AsyncEnd = true;", "https://vndb.org"));');
				while (!AsyncEnd)
					await Helper.timeout(10);
				var RetData = Response;
				Response = null;
				return RetData;
			}

			if (QueryData == undefined){
				QueryData = await storage.getAsync("QueryPostData");
				if (typeof(QueryData) !== "string" || QueryData.length == 0)
					return undefined;
			}

			var Data = JSON.parse(QueryData);
			Data.queryName = "";
			Data.queryText = query;
			Data = JSON.stringify(Data);

			var xhr = new XMLHttpRequest();
    		xhr.open("POST", "https://query.vndb.org/api/query-result", false);
  			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
   			xhr.send(Data);
			if (typeof(xhr.responseText) !== "string" || xhr.responseText.length == 0)
				throw new Error("Invalid HTTP Response");

			if (Helper != null && Helper.CORSEnforced == null)
				Helper.CORSEnforced = false;

			return xhr.responseText;
		} catch (ex) {
			if (typeof(tries) === "undefined" || tries === null)
				return await Query.direct(query, 2, QueryData);
			if (tries >= 0)
				return await Query.direct(query, tries - 1, QueryData);

			if (Helper.CORSEnforced == null){
				Helper.CORSEnforced = true;
				var Rst = await Query.direct(query, null, QueryData);
				if (Rst !== undefined && Rst.length > 0){
					return Rst;
				}
				Helper.CORSEnforced = null;
			}

			return undefined;
			
		}
	}


	timeout(ms) {
   	    return new Promise(resolve => setTimeout(resolve, ms));
	}
}

Helper = new Query();
