/// ------------------------------------------
/// Entry point from which everything happens.
/// ------------------------------------------
class MainController {
	constructor() {
		this.preferences = new PreferencesController();
		this.assets = new VnAssetsController();
		this.builder = new BuildController();
	}
	
	/// -------------------------------
	/// Entry point of the application.
	/// -------------------------------
	run() {
		if(this.getEntries() != null) {
			// Load the preferences in
			this.preferences.load();
			
			// Build the container for the new entries
			this.builder.buildContainer();
			
			// Wait for the preferences to load
			let scope = this;
			let prefsChecker = setInterval(function() {
				if(scope.preferences.ready()) {
					clearInterval(prefsChecker);
					
					// ...and then
					// Determine which page we need to work on
					let whichPage = scope.getPage();

					if (scope.preferences.getDisable(whichPage)){
						scope.builder.buildPreferences(scope.onPreferenceChanged, scope);
						scope.executePreferencesDynamic();
						scope.executePreferencesStaticVisually();
						return;
					}

					switch(whichPage) {
						default:
						case "vnlist":
						case "list":
							scope.runList(scope.preferences.getDetails(whichPage));
							break;
						case "votes":
							scope.runVotes(scope.preferences.getDetails(whichPage));
							break;
						case "wishlist":
						case "wish":
							scope.runWishlist(scope.preferences.getDetails(whichPage));
						break;
						case "browse":
							scope.runBrowse(scope.preferences.getDetails(whichPage));
							break;
					}
					
					// Make sure the list looks good the way it does now
					scope.finalizeMainboxSize();
					
					// Set up the preferences controls
					scope.builder.buildPreferences(scope.onPreferenceChanged, scope);
					
					// Apply the preferences
					scope.executePreferencesDynamic();
					scope.executePreferencesStaticVisually();
				}
			}, 100);
		}
	}
	
	/// ------------------------------------------
	/// Called when a preference value is changed.
	/// ------------------------------------------
	onPreferenceChanged(which, value, scope) {
		switch(which) {
			case "Visibility":
				scope.preferences.setVisibility(value, scope.getPage());
				scope.executePreferencesDynamic();
				break;
			case "Tooltip":
				scope.preferences.setTooltip(value, scope.getPage());
				scope.executePreferencesDynamic();
				break;
			case "Details":
				scope.preferences.setDetails(value, scope.getPage());
				location.reload();
				break;
			case "Disable":
				scope.preferences.setDisable(value, scope.getPage());
				location.reload();
				break;
		}
	}
	
	/// --------------------------------------------------------------------------------
	/// Applies the visuals of static preferences that are only executed once on a page.
	/// --------------------------------------------------------------------------------
	executePreferencesStaticVisually() {
		let currentPage = this.getPage();
		
		if(this.preferences.getDetails(currentPage)) {
			document.querySelector("#VNEXT-DetailsPref").checked = true;
			document.querySelector("#VNEXT-TooltipPref").disabled = true;
		} else {
			document.querySelector("#VNEXT-DetailsPref").checked = false;
			document.querySelector("#VNEXT-TooltipPref").disabled = false;
		}

		if (this.preferences.getDisable(currentPage)) {			
			document.querySelector("#VNEXT-TooltipPref").disabled = true;
			document.querySelector("#VNEXT-VisibilityPref").disabled = true;
			document.querySelector("#VNEXT-DetailsPref").disabled = true;
			document.querySelector("#VNEXT-DisablePref").checked = true;

			document.getElementsByClassName("mainbox")[1].getElementsByTagName("tbody")[0].setAttribute("style", "display: table-row-group;");
			
			var CfgMenu = document.querySelector("#VNEXT-PrefsContainer");
			CfgMenu.setAttribute("style", "padding-bottom: 15px;");
			if(CfgMenu.previousElementSibling)
  				CfgMenu.parentNode.insertBefore(CfgMenu, CfgMenu.previousElementSibling);
		}
	}
	
	/// -----------------------------------------------------------------------------------
	/// Applies all the effects of the current preferences that can be applied in realtime.
	/// -----------------------------------------------------------------------------------
	executePreferencesDynamic() {
		let currentPage = this.getPage();
		
		// Always show VN info
		let entries = document.getElementsByClassName("vnext-darken");
		if(this.preferences.getVisibility(currentPage)) {
			for(var i = 0; i < entries.length; i++) {
				if(!(entries[i].className.indexOf(" always-visible") > -1)) {
					entries[i].className += " always-visible";
				}
			}
			document.querySelector("#VNEXT-VisibilityPref").checked = true;
		} else {
			for(var i = 0; i < entries.length; i++) {
				entries[i].className = entries[i].className.replace("always-visible", "");
			}
			document.querySelector("#VNEXT-VisibilityPref").checked = false;
		}
		
		// Disable tooltip
		let tooltips = document.getElementsByClassName("vnext-tooltip");
		if(this.preferences.getTooltip(currentPage)) {
			for(var i = 0; i < tooltips.length; i++) {
				if(!(tooltips[i].className.indexOf(" disabled") > -1)) {
					tooltips[i].className += " disabled";
				}
			}
			document.querySelector("#VNEXT-TooltipPref").checked = true;
		} else {
			for(var i = 0; i < tooltips.length; i++) {
				tooltips[i].className = tooltips[i].className.replace("disabled", "");
			}
			document.querySelector("#VNEXT-TooltipPref").checked = false;
		}
	}
	
	/// -----------------------------------------------------------
	/// Sets the main box to a final size to wrap around the items.
	/// -----------------------------------------------------------
	finalizeMainboxSize() {
		let mainbox = document.getElementsByClassName("mainbox")[1],
			itemSize = 170,
			minSize = 750,
			itemCount = Math.floor((mainbox.offsetWidth - 10) / itemSize),
			actualItemCount = this.getItemCount(),
			finalSize = 0;
		
		if(actualItemCount < itemCount) {
			finalSize = (itemSize * actualItemCount) + 10;
		} else {
			finalSize = (itemSize * itemCount) + 10;
		}
		
		if(finalSize < minSize) {
			finalSize = minSize;
		}
		
		mainbox.style.width = finalSize + "px";
		
		let maintabs = document.getElementsByClassName("maintabs");
		if(maintabs[1] != null) {
			maintabs[1].style.width = finalSize;
		}
		document.getElementsByClassName("mainbox")[1].getElementsByTagName("table")[0].hidden = true;
	}
	
	/// --------------------------------------------------------
	/// Returns the number of our items currently on the screen.
	/// --------------------------------------------------------
	getItemCount() {
		return document.getElementsByClassName("vnext-entry").length;
	}
	
	/// -------------------------------
	/// Do our thing, on the list page.
	/// -------------------------------
	runList(skipDetails) {
		let entries = this.getEntries();
		
		// If we got nothing, return
		if(entries == null) {
			return;
		}
		
		let scope = this;
		

		let VNList = new Array();
		// Iterate through the current page's visual novels
		for(var i = 0; i < entries.length; i++) {
			if(scope.isValidVNRow(entries[i])) {
				// Gather all the data we need about the vn
				let vn = {
					englishTitle: entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].innerHTML,
					japaneseTitle: entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].title,
					status: entries[i].getElementsByClassName("tc_labels")[0].getElementsByTagName("a")[0].innerText,
					releases: entries[i].getElementsByClassName("tc1")[0].innerHTML,
					comment: null,
					wishstatus: false
				};
				
				// We get the VN id from the url the item links to
				let urlParts = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].href.split("/");
				vn.id = urlParts[urlParts.length - 1];
				vn.id = vn.id.substring(1, vn.id.length);
				
				// If someone has all releases of a VN, there will be another element that we need to go through
				if(entries[i].getElementsByClassName("tc1")[0].getElementsByTagName("b").length > 0) {
					vn.releases = entries[i].getElementsByClassName("tc1")[0].getElementsByTagName("b")[0].innerHTML;
				}
				
				// If someone added a comment to a VN, there's yet another element
				if(entries[i].getElementsByClassName("tc_title")[0].getElementsByClassName("grayedout").length > 0) {
					vn.comment = entries[i].getElementsByClassName("tc_title")[0].getElementsByClassName("grayedout")[0].innerHTML;
				}

				if (vn.status.indexOf("Wishlist-") >= 0){
					vn.status = vn.status.substr(vn.status.indexOf("Wishlist-") + 9).split(' ')[0].split(',');
					vn.wishstatus = true;
				}
				
				// Build the entry
				scope.builder.buildEntryList(vn.id, vn.englishTitle, vn.japaneseTitle, vn.status, vn.releases, vn.rating, vn.comment, vn.wishstatus);

				VNList.push(vn);
			}
		}
		scope.processVNList(VNList, skipDetails, 0);
	}
	
	/// --------------------------------
	/// Do our thing, on the votes page.
	/// --------------------------------
	runVotes(skipDetails) {
		let entries = this.getEntries();
		
		// If we got nothing, return
		if(entries == null) {
			return;
		}
		
		let scope = this;

		let VNList = new Array();
		
		// Iterate through the current page's visual novels
		for(var i = 0; i < entries.length; i++) {
			if(scope.isValidVNRow(entries[i])) {
				// Gather all the data we need about the vn
				let vn = {
					englishTitle: entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].innerHTML,
					vote: entries[i].getElementsByClassName("tc_vote")[0].getElementsByTagName("input")[0].value + "/10",
					castDate: entries[i].getElementsByClassName("tc_voted")[0].innerHTML
				};
				
				// We get the VN id from the url the item links to
				let urlParts = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].href.split("/");
				vn.id = urlParts[urlParts.length - 1];
				vn.id = vn.id.substring(1, vn.id.length);
				
				// On our own list, the cast date takes some more effort to cut out
				if(vn.castDate.indexOf("<input") > -1) {
					vn.castDate = vn.castDate.substring(vn.castDate.indexOf("\">") + 2, vn.castDate.length);
				}
				
				// Build the entry
				scope.builder.buildEntryVotes(vn.id, vn.englishTitle, vn.vote, vn.castDate);

				VNList.push(vn);
			}
		}
			scope.processVNList(VNList, skipDetails, 0);
	}
	
	/// --------------------------------
	/// Do our thing, on the votes page.
	/// --------------------------------
	runBrowse(skipDetails) {
		let entries = this.getEntries();
		
		// If we got nothing, return
		if(entries == null) {
			return;
		}
		
		let scope = this;

		let VNList = new Array();
		
		// Iterate through the current page's visual novels
		for(var i = 0; i < entries.length; i++) {
			if(scope.isValidVNRow(entries[i])) {

				entries[i].getElementsByClassName("tc6")[0].getElementsByTagName("b")[0].remove();
				var Title = entries[i].getElementsByClassName("tc1");
				if (Title.length == 0)					
					Title = entries[i].getElementsByClassName("tc_t");

				// Gather all the data we need about the vn
				let vn = {
					englishTitle: Title[0].getElementsByTagName("a")[0].innerHTML,
					japaneseTitle: Title[0].getElementsByTagName("a")[0].title,
					rating: entries[i].getElementsByClassName("tc6")[0].innerText + "/10",
					relDate: entries[i].getElementsByClassName("tc4")[0].innerHTML
				};
				
				// We get the VN id from the url the item links to
				let urlParts = Title[0].getElementsByTagName("a")[0].href.split("/");
				vn.id = urlParts[urlParts.length - 1];
				vn.id = vn.id.substring(1, vn.id.length);

				
				// Build the entry
				scope.builder.buildEntryBrowse(vn.id, vn.englishTitle, vn.japaneseTitle, vn.rating, vn.relDate);

				VNList.push(vn);
			}
		}
		scope.processVNList(VNList, skipDetails, 0);
	}
	
	/// -----------------------------------
	/// Do our thing, on the wishlist page.
	/// -----------------------------------
	runWishlist(skipDetails) {
		let entries = this.getEntries();
		
		// If we got nothing, return
		if(entries == null) {
			return;
		}
		
		let scope = this;

		let VNList = new Array();
		
		// Iterate through the current page's visual novels
		for(var i = 0; i < entries.length; i++) {
			if(scope.isValidVNRow(entries[i])) {

				entries[i].getElementsByClassName("tc_labels")[0].getElementsByTagName("a")[0].children[0].remove();
				var Labels = entries[i].getElementsByClassName("tc_labels")[0].getElementsByTagName("a")[0].text;

				// Gather all the data we need about the vn
				let vn = {
					englishTitle: entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].innerHTML,
					japaneseTitle: entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].title,
					priority: Labels.substr(Labels.indexOf("Wishlist-") + 9).split(' ')[0].split(',')[0],
					addedDate: entries[i].getElementsByClassName("tc_added")[0].innerHTML,
				};
				
				// We get the VN id from the url the item links to
				let urlParts = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].href.split("/");
				vn.id = urlParts[urlParts.length - 1];
				vn.id = vn.id.substring(1, vn.id.length);
				
				// Build the entry
				scope.builder.buildEntryWishlist(vn.id, vn.englishTitle, vn.japaneseTitle, vn.priority, vn.addedDate);

				VNList.push(vn);
			}
		}
		scope.processVNList(VNList, skipDetails, 0);
	}

	processVNList(VNList, skipDetails, begin){
		let scope = this;

		for (let i = begin; i < VNList.length; i++) {
			let vn = VNList[i];
			var next = null;
			if (i + 1 < VNList.length)
				next = VNList[i + 1];
			
			// Load the vn's assets
			if(!skipDetails) {
				scope.builder.buildEntryTooltip(vn.id, vn.comment);
				scope.assets.loadAssets(vn.id, function(a){
					if (i == 0)
						MainController.showCover(vn.id);
					scope.processVNList(VNList, skipDetails, i + 1);
				});

				if (next !== null)
					document.getElementById("Vnext-" + vn.id).setAttribute("next", next.id);
				return;
			}
	 		
		}
	}

	static showCover(id) {
		var VN = document.getElementById("Vnext-" + id);
		var IMG = VN.getAttribute("data-src");
		if (IMG === null){
			setTimeout(() => { MainController.showCover(id) }, 100);
			return;
		}
		var Next = VN.getAttribute("next");
		if (IMG === ""){
			setTimeout(() => { MainController.showCover(Next) }, 100);
			return;
		}
		var Image = MainController.asyncImageLoader(IMG, id);
		Image.then( img => {
            VN.style.backgroundImage = "url('" + img.src + "')"
			if (Next !== null)
				setTimeout(() => { MainController.showCover(Next) }, 100);
		}).catch ((error) => {
			console.log(error);
			setTimeout(() => { MainController.showCover(id) }, 2000);
		});
	}

	static asyncImageLoader(url, id){
    	return new Promise( (resolve, reject) => {
    	    var image = new Image();
    	    image.onload = () => resolve(image);
    	    image.onerror = () => reject(new Error('could not load image'));
			image.id = id;
    	    image.src = url;
   		});
	}

	
	/// -----------------------------------------
	/// Returns if a given row is a valid VN row.
	/// -----------------------------------------
	isValidVNRow(element) {
		return !((' ' + element.className + ' ').indexOf(' hidden ') > -1);
	}
	
	/// --------------------------------------------------
	/// Returns a list of vn's from the default VNDB page.
	/// --------------------------------------------------
	getEntries() {
		let stripes = document.getElementsByClassName("mainbox")[1].getElementsByTagName("table")[0];
		if(stripes == null) {
			return null;
		} else {
			let rows = stripes.getElementsByTagName("tbody");
			
			if(rows.length < 1) {
				return null;
			} else {
				return rows[0].children;
			}
		}
	}
	
	/// -------------------------------------------------
	/// Returns which page we're on; list, votes or wish.
	/// -------------------------------------------------
	getPage() {
		let urlParts = window.location.toString().split("/");
		let lastPart = urlParts[urlParts.length - 1];
		if (lastPart.startsWith("ulist?")) {
			lastPart = lastPart.split('?')[1].split('=')[0]
		}
		if (urlParts.length > 4 && urlParts[3] == "v"){
			return "browse";
		}
		// We don't need any url parameters in it
		if(lastPart.indexOf("?") > -1) {
			lastPart = lastPart.substring(0, lastPart.indexOf("?"));
		}
		
		return lastPart;
	}
}
