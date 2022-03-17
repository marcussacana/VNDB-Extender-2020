let Loaded = false;
let Response = null;
let AsyncEnd = true;
let Finished = false;
let Helper = null;

function IsAnon() {
	return false;//Query mode now works anonymous
}

if (document.location.hostname == "vndb.org") { //if is running in the vndb.org in the extension context
	window.addEventListener("message", function(a) {
		eval(a.data);
	});
} else if (typeof(ace) != "undefined") { //If the script is running in the query.vndb.org in the page context
    window.addEventListener("message", async function(a) {
        var rst = eval(a.data);
		if (rst instanceof Promise){
			rst = await eval(a.data);
		}
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
        Script.src = chrome.runtime.getURL("scripts/Query.js");
        document.body.parentElement.insertBefore(Script, document.body.parentElement.firstElementChild);
    }
}


class Query {
    constructor() {

		if (document.location.hostname != "vndb.org")
			return;
		
		this.CORSEnforced = null;
		this.mainBox = document.getElementsByClassName("mainbox")[1];
		this.Busy = false;

		this.frame = document.createElement("iframe");
		this.frame.hidden = true;
		this.frame.id = "QueryFrame";		
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
		if (rst !== undefined && rst !== null && rst.length > 0) {
			return JSON.parse(rst);
		}
		
		//Wait Query Page Load
		while (await this.Invoke('document.getElementsByTagName("li") == 0 || document.getElementById("query-ace-editor") == null'))
			await this.timeout(50);
		
		while (this.Busy)
			this.timeout(50);
	
		this.Busy = true;
		
		var Waiting = 0;

        await this.Invoke('ace.edit("query-ace-editor").setValue(unescape("'+escape(query)+'")); true;');
		await this.Invoke('(async () => { var elms = document.getElementsByTagName("a"); var b = undefined; for (var i = 0; i < elms.length; i++){ if (elms[i].href.indexOf("json") < 0) continue; b = elms[i]; break; } if (typeof(b) !== "object") return false; b.remove(); return true;})();');
		await this.Invoke('var bnt = document.getElementsByTagName("button"); for (var i = 0; i < bnt.length; i++) if (bnt[i].className.indexOf("_primary_") >= 0) { bnt[i].click(); break; } true;');
		while (true) {
			await this.timeout(100);
			Waiting += 100;
			
			if (Waiting > 7000){
				this.Busy = false;
				return await this.Do(query);
			}
			
			var Response = await this.Invoke('(async () => { var elms = document.getElementsByTagName("a"); var b = undefined; for (var i = 0; i < elms.length; i++){ if (elms[i].href.indexOf("json") < 0) continue; b = elms[i]; break; } if (typeof(b) !== "object") return; var URL = b.href; if (typeof(URL) !== "string" || URL.length == 0) return; var rst = await Query.getUrl(URL); b.remove(); return rst;})();');
			if (typeof(Response) != "string" || Response.length == 0)
				continue;
			
			this.Busy = false;
			return JSON.parse(Response);
		}
    }

	static async getUrl(url, tries) {
		try {
			var rsp = await Query.XHR("GET", url);
			if (typeof(rsp) !== "string" || rsp.length == 0)
				throw new Error("Invalid HTTP Response");
			return rsp;
		} catch (ex){
			if (typeof(tries) === "undefined" || tries === null)
				return await Query.getUrl(url, 2);
			if (tries >= 0)
				return await Query.getUrl(url, tries - 1);
			throw ex;
		}
    }
	
	static XHR(method, url, data, headers) {
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open(method, url);
			
			if (!(headers === undefined)){
				for (var i = 0; i < headers.length; i++)
					xhr.setRequestHeader(headers[i].name, headers[i].value);
			}
			
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			
			if (data === undefined)
				xhr.send();
			else
				xhr.send(data);
		});
	}

	static async direct(query, tries) {
		try {

			if (document.location.hostname == "vndb.org" && Helper.CORSEnforced){//Opera and edge browser never trigger this
				AsyncEnd = false;
				Helper.BeginInvoke('Query.direct(unescape("'+escape(query)+'"), null")).then((x) => window.top.postMessage("Response = JSON.stringify("+x+"); AsyncEnd = true;", "https://vndb.org"));');
				while (!AsyncEnd)
					await Helper.timeout(10);
				var RetData = Response;
				Response = null;
				return RetData;
			}
			
			var Connection = await Query.getUrl('https://query.vndb.org/api/connections');
			var ConnectionInfo = JSON.parse(Connection);
			
			var Data = {"connectionId":"","name":"","batchText":"","selectedText":"","chart":{"chartType":"","fields":{}}};
			Data.connectionId = ConnectionInfo[0].id;
			Data.batchText = query;
			
			var Info = JSON.parse(await Query.XHR("POST", "https://query.vndb.org/api/batches", JSON.stringify(Data), [{ name: 'Content-Type', value: 'application/json; charset=UTF-8' }]));
			
			var StatementID = Info.statements[0].id;
			
			try {
				//Try get the result without wait first
				var Result = await Query.getUrl("https://query.vndb.org/statement-results/" + StatementID + ".json");
				
				if (Result == null || Result.trim().length == 0 || JSON.parse(Result) === null)
					throw new Error("Invalid Query Response");
				
				return Result;
				
			} catch {
				var QueryUrl = "https://query.vndb.org/api/batches/" + Info.statements[0].batchId;
				
				while (Info.statements[0].status != "finished"){
					if (Info.statements[0].status == "error")
						return null;
					
					Info = JSON.parse(await Query.getUrl(QueryUrl));
				}
				
				return await Query.getUrl("https://query.vndb.org/statement-results/" + StatementID + ".json");
			}
		} catch (ex) {
			if (typeof(tries) === "undefined" || tries === null)
				return await Query.direct(query, 2);
			if (tries >= 0)
				return await Query.direct(query, tries - 1);

			if (Helper.CORSEnforced == null){
				Helper.CORSEnforced = true;
				var Rst = await Query.direct(query, null);
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

if (document.location.hostname == "vndb.org"){
	let storage = new StorageController();
	storage.get("vnext-prefs", (data) => {
		try {
			if (data["QUERY"] === true)
				Helper = new Query();
		} catch {}
	});
}