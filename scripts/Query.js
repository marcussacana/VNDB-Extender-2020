class Query {
    constructor() {
		Query.Loaded = true;
		
		if (document.location.hostname != "vndb.org")
			return;
		
		this.CORSEnforced = null;
		this.mainBox = document.getElementsByClassName("mainbox")[1];
	}
    async Do(query) {
		console.log("Query Request:\n" + query);
		var rst = await Query.direct(query);
		if (rst !== undefined && rst !== null && rst.length > 0) {
			return JSON.parse(rst);
		}
		
		throw new Error("Query Failed");
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