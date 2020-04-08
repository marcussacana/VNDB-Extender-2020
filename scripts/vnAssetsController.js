/// -------------------------------------------------------------------------------
/// This class handles all VN asset-related tasks, such as covers and descriptions.
/// -------------------------------------------------------------------------------
class VnAssetsController {
	constructor() {
		this.http = new HttpController();
		this.storage = new StorageController();
		this.busy = false;
		this.retryQueue = [];
		this.retryCallback = [];
	}
	
	/// ------------------------------------------
	/// Downloads a vn's assets with the given ID.
	/// ------------------------------------------
	loadAssets(id, callback) {
		this.downloadPage(id, callback);
	}

	retry(id, callback) {
		this.retryQueue.push(id);
		this.retryCallback.push(callback);

		if(!this.busy) {
			this.runAssetLoader();
		}
	}

	/// -----------------------------------------------------------------------
	/// Loads in the VNDB page for each ID in the retry queue with an interval,
	/// this is to give the VNDB server some room to breathe.
	/// -----------------------------------------------------------------------
	runAssetLoader() {
		this.busy = true;

		let index = 0,
			attempts = {};

		let interval = setInterval(() => {
			let id = this.retryQueue[index];
			let callback = this.retryCallback[index];
			if(id != null) {
				if(attempts[id] == null) {
					attempts[id] = 0;
				} 
				
				// A VN page gets to retry max 4 times, else we'll say screw it.
				// Let's not bully the VNDB server more.
				if(attempts[id] < 4) {
					if (this.downloadPage(id, callback))
						attempts[id] = 5;//fuck off
					attempts[id]++;
				}

				index++;
			} else {
				this.busy = false;
				clearInterval(interval);
			}
		}, 2000);
	}
	
	/// --------------------------------------------------------------------------------------------------
	/// Issues a download request for the page for the vn with the given ID.
	/// Loading the page is better than using the API, because the data usage for just the HTML is minimal
	/// and there is no request limit for this method.
	/// --------------------------------------------------------------------------------------------------
	downloadPage(id, callback) {
		let data = {
			id: id,
			callback: callback,
			sender: this,
			cached: false
		};
		var AsyncMode = false;
		// Try to get it from storage first, else retrieve it.
		this.storage.get("vnext-page-" + id, (page) => {
			if(page != null && typeof page === "string" && page.length > 0) {
				data.cached = true;
				this.parsePage(page, data);
				if (callback != null) callback(data);
			} else if (page != null && typeof(page.title) != "undefined") {
				data.cached = true;
				this.parseInfo(page, data).then((x) => { if (callback != null) callback(data); });
				AsyncMode = true;
			} else if (Loaded) {
				Helper.Do("select * from vn where vn.id = " + id).then((x) => {
					this.onPageLoaded(x, data);
				}); 
			} else {
				this.http.get("https://vndb.org/v" + id, this.onPageLoaded, data);
			}
		}, (err) => {
			if (Loaded) {
				Helper.Do("select * from vn where vn.id = " + id).then((x) => {
					this.onPageLoaded(x, data);
				}); 
			} else 
				this.http.get("https://vndb.org/v" + id, this.onPageLoaded, data);
		});
		return AsyncMode;
	}

	isValidPage(page) {
		if (typeof(page) !== "string")
			return false;

		// Server sometimes gets overloaded and returns these possible titles
		const ERROR_MESSAGES = [
			"503 Service Temporarily Unavailable",
			"429 Too Many Requests"
		];

		let foundError = false;

		for(let errorMessage of ERROR_MESSAGES) {
			if(page.indexOf(errorMessage) > -1) {
				foundError = true;
				break;
			}
		}

		if(!foundError) {
			return page.indexOf("<h2>Description</h2>") > -1; // Surely any valid page would have this element
		} else {
			return false;
		}
	}

	onPageLoaded(page, data) {
		if(!data.sender.isValidPage(page) && (typeof(page.length) == "undefined")) {
			data.sender.retry(data.id, data.callback);
		} else {
			if (!data.cached) {
				VnAssetsController.Sleep(100)(data).then((data) => {
					if (Loaded && typeof(page) !== "string") {
						data.sender.parseInfo(page[0], data).then((x) => { 
							data.sender.storePage(data.id, x);
							if (data.callback !== null) 
								data.callback(data); 
						});
						return;
					}
					data.sender.parsePage(page, data);
					data.sender.storePage(data.id, page);

					if (data.callback !== null)
						data.callback(data);
				});
			}
		}
	}
	
	static Sleep(ms) {
  		return function(x) {
    		return new Promise(resolve => setTimeout(() => resolve(x), ms));
  		};
	}

	storePage(id, page) {
		this.storage.set("vnext-page-" + id, page);
	}
	/// -----------------------------------------------------------------------
	/// Called when a VN page in HTML form is successfully retrieved.
	/// These all have try catches around them because we're getting data from
	/// an unpredictable page, we have to make sure the whole algorithm doesn't
	/// break from one bug.
	/// -----------------------------------------------------------------------
	parsePage(page, data) {

		// Make sure we don't have any invalid pages in our storage
		if(!this.isValidPage(page)) {
			this.storage.set("vnext-page-" + data.id, null);
			data.sender.retry(data.id);
		} else {
			// Cover image
			try {
				let coverURL = data.sender.getCoverURLFromPage(page);
				data.sender.applyCoverURL(coverURL, data.id);
				data.nsfw = page.indexOf("nsfw_pic") > 0;
			} catch(ex) {
				data.sender.applyCoverURL("", data.id);
			}
			
			// Description
			try {
				let description = data.sender.getDescriptionFromPage(page);
				data.sender.applyDescription(description, data.id);
			} catch(ex) {
				data.sender.applyDescription("Description unavailable.", data.id);
			}
			
			// Publisher/developer
			try {
				let publisher = data.sender.getPublisherFromPage(page);
				data.sender.applyPublisher(publisher, data.id);
			} catch(ex) {
				data.sender.applyPublisher("Developer unavailable.", data.id);
			}
			
			// Translation status
			try {
				let tlStatus = data.sender.getTlStatusFromPage(page);
				data.sender.applyTlStatus(tlStatus, data.id);
			} catch(ex) {
				data.sender.applyTlStatus("Translation status unavailable.", data.id);
			}
			
			// Length
			try {
				let length = data.sender.getLengthFromPage(page);
				data.sender.applyLength(length, data.id);
			} catch(ex) {
				data.sender.applyLength("Length unknown.", data.id);
			}
		}
	}

/// -----------------------------------------------------------------------
	/// Called when a VN page in HTML form is successfully retrieved.
	/// These all have try catches around them because we're getting data from
	/// an unpredictable page, we have to make sure the whole algorithm doesn't
	/// break from one bug.
	/// -----------------------------------------------------------------------
	async parseInfo(info, data) {
			if (typeof(info.releases) == "undefined")
				info.releases = await Helper.Do("select l.lang, r.type, name, released from (releases_lang as l join (select * from releases_producers) as rp on l.id = rp.id join (select * from producers) as p on rp.pid = p.id join (select * from releases) as r on l.id = r.id ) where r.id in (select id from releases_vn where vid = "+data.id+")");

			// Cover image
			try {
				if (info.image.toString() === "0")
					throw new Error("Image Not Available");
				//(cv,5804)
				//cv28231
				let coverID = info.image.toString();
				let folder = 'cv';
				if (coverID.startsWith("(") && coverID.endsWith(")")) {
					folder = coverID.substr(1).split(',')[0];
					coverID = coverID.split(',')[1];
					coverID = coverID.substr(0, coverID.length-1);
				} 
				let IsInvalidId = isNaN(parseInt(coverID));
				if (IsInvalidId){
					folder = "";
					while (isNaN(parseInt(coverID))) {
						folder += coverID.substr(0, 1);
						coverID = coverID.substr(1);
					}
				}
				let coverURL = "https://s2.vndb.org/"+folder+"/"+coverID.substr(-2)+"/"+coverID+".jpg";
				data.sender.applyCoverURL(coverURL, data.id);

				data.nsfw = info.img_nsfw;
			} catch(ex) {
				data.sender.applyCoverURL("", data.id);
			}
			
			// Description
			try {
				let description = info.desc;
				data.sender.applyDescription(description, data.id);
			} catch(ex) {
				data.sender.applyDescription("Description unavailable.", data.id);
			}
			
			// Length
			try {
				var length = "Unknown";
				switch (info.length) {
					case 1:
						length = "Very Short";
					break;
					case 2:
						length = "Short";
					break;
					case 3:
						length = "Medium";
					break;
					case 4:
						length = "Long";
					break;
					case 5:
						length = "Very Long";
					break;
				}
				data.sender.applyLength(length, data.id);
			} catch(ex) {
				data.sender.applyLength("Length unknown.", data.id);
			}
			
			// Publisher/developer
			try {

				data.sender.applyPublisher(info.releases[0].name, data.id);
			} catch(ex) {
				data.sender.applyPublisher("Developer unavailable.", data.id);
			}
			
			// Translation status
			try {
				var LANG = "en";

				//Priority Order: Released > Complete > Partial > Trial
				var BestPatch = null;
				for (var i = 0; i < info.releases.length; i++){
					if (info.releases[i].lang != LANG)
						continue;
					if (BestPatch == null){
						BestPatch = info.releases[i];
						continue;
					}

					var BestReleased = BestPatch.released != 99999999 && data.sender.IsReleased(BestPatch.released);
					var BestComplete = BestPatch.type == "complete";
					var BestPartial  = BestPatch.type == "partial";
					var BestTrial    = BestPatch.type == "trial";

					var Released = info.releases[i].released != 99999999 && data.sender.IsReleased(info.releases[i].released);
					var Complete = info.releases[i].type == "complete";
					var Partial  = info.releases[i].type == "partial";
					var Trial    = info.releases[i].type == "trial";

					if (Released && !BestReleased){
						BestPatch = info.releases[i];
						continue; 
					}
					if (Complete && !BestComplete){
						BestPatch = info.releases[i];
						continue; 
					}
					//To best precision we can check the release date here, but we just want know if has translation
					if (Partial && !BestPartial && !BestComplete){
						BestPatch = info.releases[i];
						continue; 
					}
				}
				var tlStatus = "";
				if (BestPatch == null) {
					tlStatus = "No Translation Available";
				} else {
					var Released = BestPatch.released != 99999999 && data.sender.IsReleased(BestPatch.released);
					var Complete = BestPatch.type == "complete";
					var Partial  = BestPatch.type == "partial";
					var Trial    = BestPatch.type == "trial";
					if (Complete) {
						//tlStatus = "Complete ";
					} else if (Partial){
						tlStatus = "Partial ";
					} else if (Trial) {
						tlStatus = "Trial ";
					}
					tlStatus += "Translation ";
					if (Released) {
						tlStatus += "Available.";
					} else {
						tlStatus += "Planned.";
					}
				}

				data.sender.applyTlStatus(tlStatus, data.id);
			} catch(ex) {
				data.sender.applyTlStatus("Translation status unavailable.", data.id);
			}

			return info;
	}
	

	IsReleased(str) {
		str = str.toString();
    	if(!/^(\d){8}$/.test(str)) 
			return "invalid date";
    	var y = str.substr(0,4),
    	    m = str.substr(4,2) - 1,
    	    d = str.substr(6,2);
    	var RelDate = new Date(y,m,d);
		var now = new Date();
  		now.setHours(0,0,0,0);
		return RelDate <= now;
	}
	
	/// ----------------------------------
	/// Extracts a VN image from its page.
	/// ----------------------------------
	getCoverURLFromPage(page) {
		let elementWithImage = page.substring(page.indexOf("<div class=\"vnimg\">"), page.length);
		if (elementWithImage.indexOf("No image uploaded yet") >= 0)
			return "";
		return elementWithImage.substring(elementWithImage.indexOf("<img src=\"") + 10, elementWithImage.indexOf("\" alt"));
	}
	
	/// ----------------------------------------
	/// Extracts a VN description from its page.
	/// ----------------------------------------
	getDescriptionFromPage(page) {
		let descriptionLabelIndex = page.indexOf("<td class=\"vndesc\"");
		if(descriptionLabelIndex > -1) {
			let elementWithDesc = page.substring(descriptionLabelIndex, page.length);
			let description = elementWithDesc.substring(elementWithDesc.indexOf("<p>") + 3, elementWithDesc.indexOf("</p>"));
			
			if(description == "-") {
				return "Description unavailable.";
			} else {
				return description;
			}
		} else {
			return "Description unavailable.";
		}
	}
	
	/// --------------------------------------
	/// Extracts a VN publisher from its page.
	/// --------------------------------------
	getPublisherFromPage(page) {
		let developerLabelIndex = page.indexOf("<td>Developer</td>");
		if(developerLabelIndex > -1) {
			let elementWithPub = page.substring(developerLabelIndex, page.length);
			return elementWithPub.substring(elementWithPub.indexOf("\">") + 2, elementWithPub.indexOf("</a>"));
		} else {
			return "Developer unknown.";
		}
	}
	
	/// --------------------------------------
	/// Extracts a VN TL status from its page.
	/// --------------------------------------
	getTlStatusFromPage(page) {
		// Check if there is a tab for English releases on the page
		let englishOccurrenceIndex = page.indexOf("</abbr>English");
		if(englishOccurrenceIndex > -1) {
			// Cut out the English releases portion, the end of it depends on if there are any other language labels below it
			let englishInformation = page.substring(englishOccurrenceIndex, page.length);
			if(englishInformation.indexOf("<tr class=\"lang\">") > -1) {
				englishInformation = englishInformation.substring(0, englishInformation.indexOf("<tr class=\"lang\">"));
			} else {
				englishInformation = englishInformation.substring(0, englishInformation.indexOf("</table>"));
			}
			
			// If we find a complete patch, it returns that immediately,
			// if we find a partial patch, this value will be overwritten
			let returnValue = "English translation planned";
			
			// Iterate through each row below the row that says English
			let nextRow = englishInformation.indexOf("<tr>");
			let timeout = 0;
			
			while(nextRow > -1) {
				timeout++;
				if(timeout > 100) {
					break;
				}
				
				let currentRow = englishInformation.substring(nextRow, englishInformation.length);
				currentRow = currentRow.substring(0, currentRow.indexOf("</tr>"));
				
				// Make sure we don't get stuck on empty 'rows'
				if(currentRow.length < 3) {
					break;
				}
				
				// Remove the current row from the whole thing
				englishInformation = englishInformation.replace(currentRow, "");
				
				// Has a complete entry that is already released
				if(currentRow.indexOf("title=\"complete\"") > -1 && currentRow.indexOf("class=\"future\"") < 0) {
					return "Has English translation";
				} 
				
				// Something English is released now
				else if(currentRow.indexOf("class=\"future\"") < 0) {
					// It's a partial patch
					if(currentRow.indexOf("title=\"partial\"") > -1 || currentRow.indexOf("title=\"trial\"") > -1) {
						returnValue = "Has partial English translation";
					}
				}
				
				// Fetch the next row
				nextRow = englishInformation.indexOf("<tr>");
			}
			
			return returnValue;
		} else {
			return "No English translation";
		}
	}
	
	/// -----------------------------------
	/// Extracts a VN length from its page.
	/// -----------------------------------
	getLengthFromPage(page) {
		let elementWithLength = page.substring(page.indexOf("<td>Length</td>") + 15, page.length);
		let length = elementWithLength.substring(elementWithLength.indexOf("<td>") + 4, elementWithLength.indexOf("</td>"));
		
		if(length.indexOf("<") > -1 && length.indexOf(">") > -1) {
			return "Length unknown.";
		} else {
			return length;
		}
	}
	
	/// -------------------------------------------------------
	/// Applies the cover URL to the correct entry on the page.
	/// -------------------------------------------------------
	applyCoverURL(url, id) {
		//document.getElementById("Vnext-" + id).style.backgroundImage = "url('" + url + "')";
		document.getElementById("Vnext-" + id).setAttribute("data-src", url);
	}
	
	/// ---------------------------------------------------------
	/// Applies the description to the correct entry on the page.
	/// ---------------------------------------------------------
	applyDescription(description, id) {

		//Parse Query Method Description
		while(description.indexOf("\n") >= 0)
			description = description.replace("\n", "<br />");

		while (description.indexOf("[") >= 0) {
			var TagPos = description.indexOf("[");
			var Begin = description.substr(0, TagPos);
			var TagEndPos = description.indexOf("]", TagPos) + 1;
			var End = description.substr(TagEndPos);
			if (End.indexOf("]") == 0)
				End = End.substr(1);
			description = Begin + End;
		}


		let descriptionParts = description.indexOf("<br />") > -1 ? description.split("<br />") : description.split("<br>"),
			limit = descriptionParts.length > 5 ? 5 : descriptionParts.length;
		
		for(var i = 0; i < limit; i++) {
			if(descriptionParts[i] == null || descriptionParts[i].length < 1 || (descriptionParts[i].indexOf("<") > -1 && descriptionParts[i].indexOf(">") > -1)) {
				// Part contains HTML or is empty, skip it
			} else {
				let paragraph = document.createElement("P"),
					desc = document.createTextNode(descriptionParts[i]);
				
				paragraph.appendChild(desc);
				document.getElementById("Vnext-tooltip-" + id).getElementsByClassName("vnext-tooltip-description")[0].appendChild(paragraph);
			}
		}
		
		if(limit < descriptionParts.length) {
			let paragraph = document.createElement("P"),
					desc = document.createTextNode("[ Read more... ]");
				
				paragraph.appendChild(desc);
				document.getElementById("Vnext-tooltip-" + id).getElementsByClassName("vnext-tooltip-description")[0].appendChild(paragraph);
		}
	}
	
	/// -------------------------------------------------------
	/// Applies the publisher to the correct entry on the page.
	/// -------------------------------------------------------
	applyPublisher(publisher, id) {
		let paragraph = document.createElement("P");
		paragraph.className = "vnext-tooltip-publisher";
		paragraph.appendChild(document.createTextNode(publisher));
		document.getElementById("Vnext-tooltip-" + id).getElementsByClassName("vnext-tooltip-infobox")[0].appendChild(paragraph);
	}
	
	/// -------------------------------------------------------
	/// Applies the tl status to the correct entry on the page.
	/// -------------------------------------------------------
	applyTlStatus(tlStatus, id) {
		let paragraph = document.createElement("P");
		paragraph.className = "vnext-tooltip-tl-status";
		paragraph.appendChild(document.createTextNode(tlStatus));
		document.getElementById("Vnext-tooltip-" + id).getElementsByClassName("vnext-tooltip-infobox")[0].appendChild(paragraph);
	}
	
	/// ----------------------------------------------------
	/// Applies the length to the correct entry on the page.
	/// ----------------------------------------------------
	applyLength(length, id) {
		let paragraph = document.createElement("P");
		paragraph.appendChild(document.createTextNode(this.decodeString(length)));
		document.getElementById("Vnext-tooltip-" + id).getElementsByClassName("vnext-tooltip-length")[0].appendChild(paragraph);
	}
	
	/// -----------------------------------------------------------------------
	/// Removes any special characters from strings retrieved from a HTML page.
	/// -----------------------------------------------------------------------
	decodeString(value) {
		let tmp = document.createElement("textarea");
		tmp.innerHTML = value;
		return tmp.value;
	}
}
