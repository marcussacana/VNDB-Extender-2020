/// ------------------------------------------
/// Entry point from which everything happens.
/// ------------------------------------------
class MainController {
    constructor() {
        this.preferences = new PreferencesController();
        this.assets = new VnAssetsController();
        this.builder = new BuildController();
        this.AsyncCover = true;
    }

    /// -------------------------------
    /// Entry point of the application.
    /// -------------------------------
    run() {
        if (this.getEntries() != null) {
            // Load the preferences in
            this.preferences.load();

            // Build the container for the new entries
            this.builder.buildContainer();

            // Wait for the preferences to load
            let scope = this;
            let prefsChecker = setInterval(function() {
                if (scope.preferences.ready()) {
                    clearInterval(prefsChecker);

                    // ...and then
                    // Determine which page we need to work on
                    let whichPage = scope.getPage();

                    if (scope.preferences.getDisable(whichPage)) {
                        scope.disableList(scope);
                        return;
                    }
			
                    try {
                        switch (whichPage) {
                            default:
                            case "vnlist":
                            case "list":
                            case "votes":
                            case "wishlist":
                            case "wish":
                                scope.runList(scope.preferences.getDetails(whichPage));
                                break;
                            case "browse":
                                scope.runBrowse(scope.preferences.getDetails(whichPage));
                                break;
                        }
                    } catch (err) {
                        console.log("VNDB Extender Disabled - Restore the original columns settings");
                        console.log(err);
                        scope.disableList(scope);
                        return;
                    }

					/*
                    if (typeof(colselect) != "undefined"){
	                    colselect.onclick = function () { 
                            if (this.warned)
                                return;
                            this.warned = true;
                            alert("Currently the VNDB Extender don't support the list with custom column, if you want enable the extension again reset your changes later\nPS: This will be fixed soon, so be patient.");
                        };
                    }
					*/
					
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

    disableList(scope){    
        scope.builder.buildPreferences(scope.onPreferenceChanged, scope);
        scope.executePreferencesDynamic();
        scope.executePreferencesStaticVisually();
        document.getElementsByClassName("mainbox")[1].getElementsByTagName("table")[0].classList.add("show");
    }

    /// ------------------------------------------
    /// Called when a preference value is changed.
    /// ------------------------------------------
    onPreferenceChanged(which, value, scope) {
        switch (which) {
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
            case "Nsfw":
                scope.preferences.setNsfw(value);
                scope.executePreferencesDynamic();
                break;
            case "Disable":
                scope.preferences.setDisable(value, scope.getPage());
                location.reload();
                break;
            case "Async":
                scope.preferences.setAsync(value, scope.getPage());
                location.reload();
                break;
            case "Query":
                scope.preferences.setQueryMode(value);
                location.reload();
                break;
        }
    }

    /// --------------------------------------------------------------------------------
    /// Applies the visuals of static preferences that are only executed once on a page.
    /// --------------------------------------------------------------------------------
    executePreferencesStaticVisually() {
        let currentPage = this.getPage();

        if (this.preferences.getDetails(currentPage)) {
            document.querySelector("#VNEXT-DetailsPref").checked = true;
            document.querySelector("#VNEXT-TooltipPref").disabled = true;
        } else {
            document.querySelector("#VNEXT-DetailsPref").checked = false;
            document.querySelector("#VNEXT-TooltipPref").disabled = false;
        }

        if (this.preferences.getNsfw()) {
            document.querySelector("#VNEXT-NsfwPref").checked = true;
        }		
		
        if (this.preferences.getQueryMode()) {
            document.querySelector("#VNEXT-QueryPref").checked = true;
        }

        this.AsyncCover = this.preferences.getAsync(currentPage);
		if (this.AsyncCover == null){
			this.AsyncCover = true;
			this.preferences.setAsync(this.AsyncCover, currentPage);
		}
		
        if (this.AsyncCover) {
            document.querySelector("#VNEXT-AsyncPref").checked = true;
        }

        if (this.preferences.getDisable(currentPage)) {
            document.querySelector("#VNEXT-TooltipPref").disabled = true;
            document.querySelector("#VNEXT-VisibilityPref").disabled = true;
            document.querySelector("#VNEXT-DetailsPref").disabled = true;
            document.querySelector("#VNEXT-NsfwPref").disabled = true;
            document.querySelector("#VNEXT-AsyncPref").disabled = true;
            document.querySelector("#VNEXT-QueryPref").disabled = true;
            document.querySelector("#VNEXT-DisablePref").checked = true;

            document.getElementsByClassName("mainbox")[1].getElementsByTagName("tbody")[0].setAttribute("style", "display: table-row-group;");

            var CfgMenu = document.querySelector("#VNEXT-PrefsContainer");
            CfgMenu.setAttribute("style", "padding-bottom: 15px;");
            if (CfgMenu.previousElementSibling)
                CfgMenu.parentNode.insertBefore(CfgMenu, CfgMenu.previousElementSibling);
        }
    }

    /// -----------------------------------------------------------------------------------
    /// Applies all the effects of the current preferences that can be applied in realtime.
    /// -----------------------------------------------------------------------------------
    executePreferencesDynamic() {
        let currentPage = this.getPage();
        let VNList = this.VNList;

        // Always show VN info
        let entries = document.getElementsByClassName("vnext-darken");
        if (this.preferences.getVisibility(currentPage)) {
            for (var i = 0; i < entries.length; i++) {
                if (!(entries[i].className.indexOf("always-visible") > -1)) {
                    entries[i].classList.add("always-visible");
                }
            }
            document.querySelector("#VNEXT-VisibilityPref").checked = true;
        } else {
            for (var i = 0; i < entries.length; i++) {
                entries[i].classList.remove("always-visible");
            }
            document.querySelector("#VNEXT-VisibilityPref").checked = false;
        }
		
		this.refreshTooltipsVisibility();

        if (typeof(VNList) != "undefined") {
            let Nsfw = document.querySelector("#VNEXT-NsfwPref").checked;
            for (var i = 0; i < VNList.length; i++) {
                var cover = document.getElementById("Vnext-" + VNList[i].id).getElementsByTagName("img")[0];
                if (Nsfw && cover.className.indexOf("noblur") == -1) {
                    cover.classList.add("noblur");
                }
                if (!Nsfw && cover.className.indexOf("noblur") != -1) {
                    cover.classList.remove("noblur");
                }
            }
        }
    }
	
	refreshTooltipsVisibility() {
        let currentPage = this.getPage();		
        let tooltips = document.getElementsByClassName("vnext-tooltip");
		
		let tooltipPref = document.querySelector("#VNEXT-TooltipPref");
		if (tooltipPref === null)
			tooltipPref = [];
		
        if (this.preferences.getTooltip(currentPage)) {
            for (var i = 0; i < tooltips.length; i++) {
                if (!(tooltips[i].className.indexOf("disabled") > -1)) {
                    tooltips[i].classList.add("disabled");
                }
            }
            tooltipPref.checked = true;
        } else {
            for (var i = 0; i < tooltips.length; i++) {
                tooltips[i].classList.remove("disabled");
            }
            tooltipPref.checked = false;
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
		
        if (actualItemCount < itemCount) {
            finalSize = (itemSize * actualItemCount);
        } else {
            finalSize = (itemSize * itemCount);
        }
		
		//some resolutions this will prevent a big lost of free space in the list
		if ((finalSize + itemSize) - (mainbox.offsetWidth - 10) < (itemSize/5))
			finalSize += itemSize;
	
		finalSize += 10;

        if (finalSize < minSize) {
            finalSize = minSize;
        }

        mainbox.style.width = finalSize + "px";
		
        let maintabs = document.getElementsByClassName("maintabs");
        for (var i = 0; i < maintabs.length; i++) {
            maintabs[i].style.width = finalSize+ "px";
        }
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
        if (entries == null) {
            return;
        }

        let scope = this;


        scope.VNList = new Array();
        // Iterate through the current page's visual novels
        for (var i = 0; i < entries.length; i++) {
            if (scope.isValidVNRow(entries[i])) {
                // Gather all the data we need about the 
				let vn = {};
				
				try {
					vn.englishTitle = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].innerText;
				} catch { vn.englishTitle = null; }
				
				try {
					vn.japaneseTitle = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].title;
				} catch { vn.japaneseTitle = null; }
				
				try {
					 var labels = entries[i].getElementsByClassName("tc_labels")[0];
					 labels.getElementsByTagName('i')[0].remove();
					 vn.status = labels.getElementsByTagName("a")[0].innerText;
				} catch { vn.status = null; }
				
				try {
					vn.releases = entries[i].getElementsByClassName("tc1")[0].lastChild.firstChild.innerText;
				} catch { vn.releases = null; }
				
				try {
					vn.castDate = entries[i].getElementsByClassName("tc_voted")[0].innerText.split('-').join('/');
					// On our own list, the cast date takes some more effort to cut out
					if (vn.castDate.indexOf("<input") > -1) 
						vn.castDate = vn.castDate.substring(vn.castDate.indexOf("\">") + 2, vn.castDate.length);	
					if (vn.castDate == "/")
						vn.castDate = null;
				} catch { vn.castDate = null; }
				
				try {
					let vote = entries[i].getElementsByClassName("tc_vote")[0].getElementsByClassName("elm_dd")[0].getElementsByTagName("a")[0];
					vote.getElementsByTagName("span")[0].remove();
					vote = vote.innerText;
					
					if (vote.indexOf('\n') > 0)
						vn.vote = vote.substr(0, vote.indexOf('\n'));
					else
						vn.vote = vote;
					
					vn.vote += "/10";
				} catch { vn.vote = null; }
				
				try {
					let rating = entries[i].getElementsByClassName("tc_rating")[0];
					rating.getElementsByClassName("grayedout")[0].remove();
					vn.rating = rating.innerText;
				} catch { vn.rating = null; }
                
				vn.comment = null;
				vn.wishstatus = false;
                

                // We get the VN id from the url the item links to
                let urlParts = entries[i].getElementsByClassName("tc_title")[0].getElementsByTagName("a")[0].href.split("/");
                vn.id = urlParts[urlParts.length - 1];
                vn.id = vn.id.substring(1, vn.id.length);

                // If someone has all releases of a VN, there will be another element that we need to go through
                if (vn.releases != null && entries[i].getElementsByClassName("tc1")[0].getElementsByTagName("b").length > 0) {
                    vn.releases = entries[i].getElementsByClassName("tc1")[0].getElementsByTagName("b")[0].innerHTML;
                }

                // If someone added a comment to a VN, there's yet another element
                if (entries[i].getElementsByClassName("tc_title")[0].getElementsByClassName("grayedout").length > 0) {
                    vn.comment = entries[i].getElementsByClassName("tc_title")[0].getElementsByClassName("grayedout")[0].innerHTML;
                }

                if (vn.status != null && vn.status.indexOf("Wishlist-") >= 0) {
                    vn.status = vn.status.substr(vn.status.indexOf("Wishlist-") + 9).split(' ')[0].split(',');
                    vn.wishstatus = true;
                }

                // Build the entry
                scope.builder.buildEntryList(vn.id, vn.englishTitle, vn.japaneseTitle, vn.status, vn.releases, vn.rating, vn.comment, vn.wishstatus, vn.vote, vn.castDate);

                scope.VNList.push(vn);
            }
        }
		
		
		if (scope.preferences.getQueryMode() && scope.preferences.getAsync(scope.getPage())) {
			scope.processVNListMulti(scope.VNList, skipDetails, scope.preferences.getQueryConcurrency());
		} else {
			scope.processVNList(scope.VNList, skipDetails);
		}
    }

    /// --------------------------------
    /// Do our thing, on the votes page.
    /// --------------------------------
    runBrowse(skipDetails) {
        let entries = this.getEntries();

        // If we got nothing, return
        if (entries == null) {
            return;
        }

        let scope = this;

        scope.VNList = new Array();

        // Iterate through the current page's visual novels
        for (var i = 0; i < entries.length; i++) {
            if (scope.isValidVNRow(entries[i])) {

                var rating = entries[i].getElementsByClassName("tc_rating")[0];
				
				if (rating.getElementsByTagName("b").length > 0)
					rating.getElementsByTagName("b")[0].remove();
				
				if (rating.getElementsByTagName("small").length > 0)
					rating.getElementsByTagName("small")[0].remove();
				
                var Title = entries[i].getElementsByClassName("tc_title");
                if (Title.length == 0)
                    Title = entries[i].getElementsByClassName("tc_t");

                // Gather all the data we need about the vn
                let vn = {
                    englishTitle: Title[0].getElementsByTagName("a")[0].innerText,
                    japaneseTitle: Title[0].getElementsByTagName("a")[0].title,
                    rating: entries[i].getElementsByClassName("tc_rating")[0].innerText + "/10",
                    relDate: entries[i].getElementsByClassName("tc_rel")[0].innerText
                };

                // We get the VN id from the url the item links to
                let urlParts = Title[0].getElementsByTagName("a")[0].href.split("/");
                vn.id = urlParts[urlParts.length - 1];
                vn.id = vn.id.substring(1, vn.id.length);


                // Build the entry
                scope.builder.buildEntryBrowse(vn.id, vn.englishTitle, vn.japaneseTitle, vn.rating, vn.relDate);

                scope.VNList.push(vn);
            }
        }
		
		if (scope.preferences.getQueryMode() && scope.preferences.getAsync(scope.getPage())) {
			scope.processVNListMulti(scope.VNList, skipDetails, scope.preferences.getQueryConcurrency());
		} else {
			scope.processVNList(scope.VNList, skipDetails);
		}
    }
	
	processVNListMulti(VNList, skipDetails, concurrency){
        let scope = this;
		for (var i = 0; i < concurrency; i++){
			scope.processVNList(scope.VNList, skipDetails, i, i, concurrency);
		}
	}
  
    processVNList(VNList, skipDetails, begin = 0, taskBegin = 0, adv = 1) {
        let scope = this;

        for (let i = begin; i < VNList.length; i += adv) {
            let vn = VNList[i];
            var next = null;
            if (i + adv < VNList.length)
                next = VNList[i + adv];

            // Load the vn's assets
            if (!skipDetails) {
                scope.builder.buildEntryTooltip(vn.id, vn.comment);
                scope.assets.loadAssets(vn.id, function(a) {
                    if (a.nsfw) {
                        var cover = document.getElementById("Vnext-" + vn.id).getElementsByClassName("custom-cover")[0];
                        cover.classList.add("nsfw");
                        cover.classList.add("nothover");

                        if (scope.preferences.getNsfw())
                            cover.classList.add("noblur");
                    }
					
                    if (i == taskBegin)
                        MainController.showCover(vn.id, scope.preferences.getAsync(scope.getPage()));
					
                    scope.processVNList(VNList, skipDetails, i + adv, taskBegin, adv);//The for don't contine because of the return
                });

                if (next !== null)
                    document.getElementById("Vnext-" + vn.id).setAttribute("next", next.id);
				
				scope.refreshTooltipsVisibility();
				
                return;
            }

        }
    }

    static showCover(id, Async) {
        var VN = document.getElementById("Vnext-" + id);
        
		var IMG = VN.getAttribute("data-src");
        if (IMG === null) {
            setTimeout(() => {
                MainController.showCover(id, Async)
            }, 100);
            return;
        }
        
		var Next = VN.getAttribute("next");
        if (IMG === "") {
            var Darken = VN.getElementsByClassName("vnext-darken")[0];
            Darken.classList.add("always-visible");
            setTimeout(() => {
                MainController.showCover(Next, Async)
            }, 100);
            return;
        }
		
        if (Async === true) {
            var cover = VN.getElementsByClassName("custom-cover")[0];
            cover.src = IMG;
            if (Next !== null)
                MainController.showCover(Next, Async);
            return;
        }

        var Image = MainController.asyncImageLoader(IMG, id);
        Image.then(img => {
            var cover = VN.getElementsByClassName("custom-cover")[0];
            cover.src = img.src;
            if (Next !== null)
                setTimeout(() => {
                    MainController.showCover(Next, Async)
                }, 100);
        }).catch((error) => {
            console.log(error);
            setTimeout(() => {
                MainController.showCover(id, Async)
            }, 2000);
        });
    }

    static asyncImageLoader(url, id) {
        return new Promise((resolve, reject) => {
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
        var stripes = document.getElementsByClassName("mainbox");
        if (stripes.length < 2)
            return null;
        stripes = stripes[1].getElementsByTagName("table")[0];
        if (stripes == null) {
            return null;
        } else {
            let rows = stripes.getElementsByTagName("tbody");

            if (rows.length < 1) {
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
        if (urlParts.length >= 4 && urlParts[3][0] == "v") {
            return "browse";
        }
        // We don't need any url parameters in it
        if (lastPart.indexOf("?") > -1) {
            lastPart = lastPart.substring(0, lastPart.indexOf("?"));
        }

        return lastPart;
    }
}
