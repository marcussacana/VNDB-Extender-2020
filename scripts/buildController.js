/// ----------------------
/// Builds new VN entries.
/// ----------------------
class BuildController {
	constructor(mbox) {
		this.mainBox = mbox;
		this.container = null;
	}
	
	/// -------------------------------------
	/// Builds the container for the entries.
	/// -------------------------------------
	buildContainer() {
		if(this.mainBox != null) {
			let container = document.createElement("DIV");
			container.id = "VNEXT-EntryContainer";
			
			let wrapper = document.createElement("DIV");
			wrapper.id = "VNEXT-EntryWrapper";
			
			container.appendChild(wrapper);
			this.mainBox.appendChild(container);
			
			this.container = wrapper;
		}
	}
	
	/// ----------------------------------------
	/// Builds the preferences controls section.
	/// ----------------------------------------
	buildPreferences(callback, callbackScope) {
		let container = document.createElement("DIV");
		container.id = "VNEXT-PrefsContainer";
		
		let prefVisibilityInput = document.createElement("INPUT");
		prefVisibilityInput.type = "checkbox";
		prefVisibilityInput.className = "vnext-pref-checkbox";
		prefVisibilityInput.id = "VNEXT-VisibilityPref";
		prefVisibilityInput.onchange = function() {
			callback("Visibility", this.checked, callbackScope);
		}
		
		let prefVisibilityLabel = document.createElement("P");
		prefVisibilityLabel.appendChild(document.createTextNode("Always Show the VN Info"));
		prefVisibilityLabel.className = "vnext-pref-label";
		
		let prefNSFWInput = document.createElement("INPUT");
		prefNSFWInput.type = "checkbox";
		prefNSFWInput.className = "vnext-pref-checkbox";
		prefNSFWInput.id = "VNEXT-NsfwPref";
		prefNSFWInput.onchange = function() {
			callback("Nsfw", this.checked, callbackScope);
		}
		
		let prefNsfwLabel = document.createElement("P");
		prefNsfwLabel.appendChild(document.createTextNode("Show NSFW Covers"));
		prefNsfwLabel.className = "vnext-pref-label";
		
		let prefTooltipInput = document.createElement("INPUT");
		prefTooltipInput.type = "checkbox";
		prefTooltipInput.className = "vnext-pref-checkbox";
		prefTooltipInput.id = "VNEXT-TooltipPref";
		prefTooltipInput.onchange = function() {
			callback("Tooltip", this.checked, callbackScope);
		}
		
		let prefTooltipLabel = document.createElement("P");
		prefTooltipLabel.appendChild(document.createTextNode("Disable tooltip"));
		prefTooltipLabel.className = "vnext-pref-label";
		
		let prefDetailsInput = document.createElement("INPUT");
		prefDetailsInput.type = "checkbox";
		prefDetailsInput.className = "vnext-pref-checkbox";
		prefDetailsInput.id = "VNEXT-DetailsPref";
		prefDetailsInput.onchange = function() {
			callback("Details", this.checked, callbackScope);
		}
		
		let prefDetailsLabel = document.createElement("P");
		prefDetailsLabel.appendChild(document.createTextNode("Skip Additional Info"));
		prefDetailsLabel.className = "vnext-pref-label";
		
		let prefDisableInput = document.createElement("INPUT");
		prefDisableInput.type = "checkbox";
		prefDisableInput.className = "vnext-pref-checkbox";
		prefDisableInput.id = "VNEXT-DisablePref";
		prefDisableInput.onchange = function() {
			callback("Disable", this.checked, callbackScope);
		}

		let prefDisableLabel = document.createElement("P");
		prefDisableLabel.appendChild(document.createTextNode("Legacy View"));
		prefDisableLabel.className = "vnext-pref-label";
		
		let prefAsyncInput = document.createElement("INPUT");
		prefAsyncInput.type = "checkbox";
		prefAsyncInput.className = "vnext-pref-checkbox";
		prefAsyncInput.id = "VNEXT-AsyncPref";
		prefAsyncInput.onchange = function() {
			callback("Async", this.checked, callbackScope);
		}

		let prefAsyncLabel = document.createElement("P");
		prefAsyncLabel.appendChild(document.createTextNode("Async Cover"));
		prefAsyncLabel.className = "vnext-pref-label";
		
		let prefQueryInput = document.createElement("INPUT");
		prefQueryInput.type = "checkbox";
		prefQueryInput.className = "vnext-pref-checkbox";
		prefQueryInput.id = "VNEXT-QueryPref";
		prefQueryInput.onchange = function() {
			callback("Query", this.checked, callbackScope);
		}

		let prefQueryLabel = document.createElement("P");
		prefQueryLabel.appendChild(document.createTextNode("Query Mode"));
		prefQueryLabel.className = "vnext-pref-label";
		
		container.appendChild(prefVisibilityInput);
		container.appendChild(prefVisibilityLabel);
		container.appendChild(prefNSFWInput);
		container.appendChild(prefNsfwLabel);
		container.appendChild(prefTooltipInput);
		container.appendChild(prefTooltipLabel);
		container.appendChild(prefDetailsInput);
		container.appendChild(prefDetailsLabel);
		container.appendChild(prefAsyncInput);
		container.appendChild(prefAsyncLabel);
		container.appendChild(prefQueryInput);
		container.appendChild(prefQueryLabel);
		container.appendChild(prefDisableInput);
		container.appendChild(prefDisableLabel);
		
		this.mainBox.insertBefore(container, document.querySelector("#VNEXT-EntryContainer"));
	}
	
	/// ------------------------------------
	/// Builds the list version of an entry.
	/// ------------------------------------
	buildEntryList(id, englishTitle, japaneseTitle, status, releases, rating, comment, wishstatus, vote, castDate) {
		let hyperlink = document.createElement("A");
		hyperlink.href = "/v" + id;
		
		let box = document.createElement("DIV");
		box.id = "Vnext-" + id;
		box.className = "vnext-entry";
		
		let customCover = document.createElement("IMG");
		customCover.className = "custom-cover";
		
		let darken = document.createElement("DIV");
		darken.className = "vnext-darken";
		darken.onmouseover = function() {
			let tooltipElement = document.getElementById("Vnext-tooltip-" + id);
			if(tooltipElement != null) {
				tooltipElement.className = tooltipElement.className.replace(" disappear", " appear");
			}

			let cover = document.getElementById("Vnext-" + id).getElementsByClassName("custom-cover")[0];
			cover.classList.remove("nothover");
			
		};
		darken.onmouseout = function() {
			let tooltipElement = document.getElementById("Vnext-tooltip-" + id);
			if(tooltipElement != null) {
				tooltipElement.className = tooltipElement.className.replace(" appear", " disappear");
			}

			let cover = document.getElementById("Vnext-" + id).getElementsByClassName("custom-cover")[0];
			cover.classList.add("nothover");
		};
		
		//My friend, we have very small space to use, it's better skip useless info
		let TranslatedTitleAvaliable = englishTitle != null && japaneseTitle != null;
		if (TranslatedTitleAvaliable && (englishTitle.toLowerCase() == japaneseTitle.toLowerCase() || japaneseTitle.length > 15 || vote != null))
			japaneseTitle = null;
		
		let Lines = 0;		
		
		if (releases != null)
			Lines++;
		
		if (status != null)
			Lines++;
		
		 if (rating != null)
			Lines++;		
		
		if (releases.trim() == "0/0" && Lines > 3){
			releases = null;
			Lines--;
		}
		
		if (status == "-" && Lines > 3){
			status = null;
			Lines--;
		}		
		
		if (vote == '-/10' && Lines > 3){
			vote = null;
			Lines--;
		}
		
		if (rating != null && rating.endsWith(".00"))
			rating = rating.split('.')[0];
		
		if (rating != null && vote == null){
			vote = rating;
			rating = null;
		}
		
		let englishTitleLabel = document.createElement("P");
		englishTitleLabel.className = "vnext-english-title";
		englishTitleLabel.appendChild(document.createTextNode(englishTitle));
		
		let japaneseTitleLabel = document.createElement("P");
		japaneseTitleLabel.className = "vnext-japanese-title";
		japaneseTitleLabel.appendChild(document.createTextNode(japaneseTitle));
		
		let voteLabel = document.createElement("P");
		voteLabel.className = "vnext-vote";
		voteLabel.appendChild(document.createTextNode(vote));
		
		let castDateLabel = document.createElement("P");
		castDateLabel.className = "vnext-cast-date";
		castDateLabel.innerHTML = "<b>Cast date: </b>";
		castDateLabel.appendChild(document.createTextNode(castDate));
		
		let bottom = document.createElement("DIV");
		bottom.className = "vnext-bottom";
		
		let statusLabel = document.createElement("P");
		statusLabel.className = "vnext-status";
		statusLabel.innerHTML = wishstatus ? "<b>Priority: </b>" : "<b>Status: </b>";
		statusLabel.appendChild(document.createTextNode(status));
		
		let releasesLabel = document.createElement("P");
		releasesLabel.className = "vnext-releases";
		releasesLabel.innerHTML = "<b>Release(s): </b>";
		releasesLabel.appendChild(document.createTextNode(releases));
		
		let ratingLabel = document.createElement("P");
		ratingLabel.className = "vnext-rating";
		ratingLabel.innerHTML = "<b>Rating: </b>";
		ratingLabel.appendChild(document.createTextNode(rating));
		
		if (status != null)
			bottom.appendChild(statusLabel);
		
		if (releases != null)
			bottom.appendChild(releasesLabel);
		
		if (rating != null)
			bottom.appendChild(ratingLabel);
		
		if (castDate != null)
			bottom.appendChild(castDateLabel);
		
		if (englishTitle != null)
			darken.appendChild(englishTitleLabel);
		
		if (japaneseTitle != null)
			darken.appendChild(japaneseTitleLabel);		
		
		if (englishTitle != null)
			darken.appendChild(englishTitleLabel);
		
		if (vote != null)
			darken.appendChild(voteLabel);
		
		darken.appendChild(bottom);
		
		box.appendChild(darken);
		box.appendChild(customCover);

		hyperlink.appendChild(box);
		
		this.container.appendChild(hyperlink);
	}

	/// ------------------------------------
	/// Builds the browse version of an entry.
	/// ------------------------------------
	buildEntryBrowse(id, englishTitle, japaneseTitle, rating, relDate) {
		let hyperlink = document.createElement("A");
		hyperlink.href = "/v" + id;
		
		let box = document.createElement("DIV");
		box.id = "Vnext-" + id;
		box.className = "vnext-entry";
		
		let customCover = document.createElement("IMG");
		customCover.className = "custom-cover";
		
		let darken = document.createElement("DIV");
		darken.className = "vnext-darken";
		darken.onmouseover = function() {
			let tooltipElement = document.getElementById("Vnext-tooltip-" + id);
			if(tooltipElement != null) {
				tooltipElement.className = tooltipElement.className.replace(" disappear", " appear");
			}

			let cover = document.getElementById("Vnext-" + id).getElementsByClassName("custom-cover")[0];
			cover.classList.remove("nothover");
			
		};
		darken.onmouseout = function() {
			let tooltipElement = document.getElementById("Vnext-tooltip-" + id);
			if(tooltipElement != null) {
				tooltipElement.className = tooltipElement.className.replace(" appear", " disappear");
			}

			let cover = document.getElementById("Vnext-" + id).getElementsByClassName("custom-cover")[0];
			cover.classList.add("nothover");
		};
		
		let englishTitleLabel = document.createElement("P");
		englishTitleLabel.className = "vnext-english-title";
		englishTitleLabel.appendChild(document.createTextNode(englishTitle));
		
		let japaneseTitleLabel = document.createElement("P");
		japaneseTitleLabel.className = "vnext-japanese-title";
		japaneseTitleLabel.appendChild(document.createTextNode(japaneseTitle));
		
		let bottom = document.createElement("DIV");
		bottom.className = "vnext-bottom";

		let ratingLabel = document.createElement("P");
		ratingLabel.className = "vnext-rating";
		ratingLabel.innerHTML = "<b>Rating: </b>";
		ratingLabel.appendChild(document.createTextNode(rating));
		
		let relDateLabel = document.createElement("P");
		relDateLabel.className = "vnext-cast-date";
		relDateLabel.innerHTML = "<b>Released: </b>";
		relDateLabel.appendChild(document.createTextNode(relDate));
		
		if (relDate != null)
			bottom.appendChild(relDateLabel);		

		if (rating != null)
			bottom.appendChild(ratingLabel);
		
		if (englishTitle != null)
			darken.appendChild(englishTitleLabel);
		
		if (japaneseTitle != null)
			darken.appendChild(japaneseTitleLabel);
		
		darken.appendChild(bottom);
	
		box.appendChild(darken);
		box.appendChild(customCover);

		hyperlink.appendChild(box);
		
		this.container.appendChild(hyperlink);
	}
	
	buildEntryTooltip(id, comment) {
		let box = document.createElement("DIV");
		box.id = "Vnext-tooltip-" + id;
		box.className = "vnext-tooltip disappear";
		
		let infoBox = document.createElement("DIV");
		infoBox.className = "vnext-tooltip-infobox";
		
		let descriptionBox = document.createElement("DIV");
		descriptionBox.className = "vnext-tooltip-description";
		
		let commentBox;
		if(comment != null && comment != "") {
			commentBox = document.createElement("DIV");
			commentBox.className = "vnext-tooltip-comment";
			
			let paragraph = document.createElement("P"),
				commentNode = document.createTextNode(comment);
				
			paragraph.appendChild(commentNode);
			commentBox.appendChild(paragraph);
		}
		
		let lengthBox = document.createElement("DIV");
		lengthBox.className = "vnext-tooltip-length";
		
		box.appendChild(infoBox);
		box.appendChild(descriptionBox);
		
		if (comment != null && comment != "") {
			box.appendChild(commentBox);
		}
		
		box.appendChild(lengthBox);
		
		this.container.appendChild(box);
		
		// Position it based on the main entry
		let positionX = (document.getElementById("Vnext-" + id).offsetLeft + 200);
		let positionY = (document.getElementById("Vnext-" + id).offsetTop + 20);
		
		// Make sure we don't overflow, if we do, put it on the other side
		let potentialBorderX = positionX + 300;
		if(potentialBorderX > document.getElementById("VNEXT-EntryContainer").offsetWidth) {
			positionX -= 530;
		}
		
		document.getElementById("Vnext-tooltip-" + id).style.left = positionX + "px";
		document.getElementById("Vnext-tooltip-" + id).style.top = positionY + "px";
	}
}
