/// ------------------------------------------------------
/// Class that handles storing and retrieving preferences.
/// ------------------------------------------------------
class PreferencesController {
	constructor() {
		this.storage = new StorageController();
		this.preferences = {};
		this.isReady = false;
	}
	
	/// --------------------------------------
	/// Loads in the preferences from storage.
	/// --------------------------------------
	load() {
		this.storage.get("vnext-prefs", (data) => {
			this.onReceivePreferences(data);
		});
	}
	
	/// -----------------------------------------------------------------
	/// Returns if we've retrieved the preferences and are ready to work.
	/// -----------------------------------------------------------------
	ready() {
		return this.isReady;
	}
	
	/// ------------------------------------------------
	/// Called when the preferences have been retrieved.
	/// ------------------------------------------------
	onReceivePreferences(data) {
		this.isReady = true;
		if(data != null) {
			this.preferences = data;
		}
	}
	
	/// -------------------------------------------------------------------------
	/// Returns the "always show VN info" preference value, for a specified page.
	/// -------------------------------------------------------------------------
	getVisibility(page) {
		try {
			return this.preferences[page]["visibility"];
		} catch(ex) {
			return false;
		}
	}
	
	/// ----------------------------------------------------------------------
	/// Sets the "always show VN info" preference value, for a specified page.
	/// ----------------------------------------------------------------------
	setVisibility(value, page) {
		try {
			this.preferences[page]["visibility"] = value;
		} catch(ex) {
			this.preferences[page] = {
				"visibility": value
			};
		}
		
		this.savePreferences();
	}
	
	/// ---------------------------------------------------------------------
	/// Returns the "disable tooltip" preference value, for a specified page.
	/// ---------------------------------------------------------------------
	getTooltip(page) {
		try {
			return this.preferences[page]["tooltip"];
		} catch(ex) {
			return false;
		}
	}
	
	/// ------------------------------------------------------------------
	/// Sets the "disable tooltip" preference value, for a specified page.
	/// ------------------------------------------------------------------
	setTooltip(value, page) {
		try {
			this.preferences[page]["tooltip"] = value;
		} catch(ex) {
			this.preferences[page] = {
				"tooltip": value
			};
		}
		
		this.savePreferences();
	}
	
	/// ------------------------------------------------------------------
	/// Returns the "load details" preference value, for a specified page.
	/// ------------------------------------------------------------------
	getDetails(page) {
		try {
			return this.preferences[page]["details"];
		} catch(ex) {
			return false;
		}
	}
	
	/// ---------------------------------------------------------------
	/// Sets the "load details" preference value, for a specified page.
	/// ---------------------------------------------------------------
	setDetails(value, page) {
		try {
			this.preferences[page]["details"] = value;
		} catch(ex) {
			this.preferences[page] = {
				"details": value
			};
		}
		
		this.savePreferences();
	}
	
	/// ------------------------------------------------------------------
	/// Returns the "Show NSFW Cover" preference value
	/// ------------------------------------------------------------------
	getNsfw() {
		try {
			var Val = this.preferences["NSFW"];
			if (Val == undefined)
				return false;
			return Val;
		} catch(ex) {
			return false;
		}
	}
	
	/// ---------------------------------------------------------------
	/// Sets the "load details" preference value, for a specified page.
	/// ---------------------------------------------------------------
	setNsfw(value) {
		try {
			this.preferences["NSFW"] = value;
		} catch(ex) {
			this.preferences["NSFW"] = value;
		}
		
		this.savePreferences();
	}
	
	/// ------------------------------------------------------------------
	/// Returns the "Query Mode" preference value
	/// ------------------------------------------------------------------
	getQueryMode(page) {
		try {
			var Val = this.preferences["QUERY"];
			if (Val == undefined)
				return true;
			return Val;
		} catch(ex) {
			return true;
		}
	}

	/// ---------------------------------------------------------------
	/// Sets the "Query Mode" preference value
	/// ---------------------------------------------------------------
	setQueryMode(value) {
		try {
			this.preferences["QUERY"] = value;
		} catch(ex) {
			this.preferences["QUERY"] = value;
		}
		
		this.savePreferences();
	}
	
	
	/// ------------------------------------------------------------------
	/// Unimplemented
	/// ------------------------------------------------------------------
	getQueryConcurrency(page) {
		try {
			var Val = this.preferences["QueryConcurrency"];
			if (Val == undefined)
				return 3;
			return Val;
		} catch(ex) {
			return 3;
		}
	}

	/// ---------------------------------------------------------------
	/// Unimplemented
	/// ---------------------------------------------------------------
	setQueryConcurrency(value) {
		try {
			this.preferences["QueryConcurrency"] = value;
		} catch(ex) {
			this.preferences["QueryConcurrency"] = value;
		}
		
		this.savePreferences();
	}
	
	/// ------------------------------------------------------------------
	/// Returns the "disable extender" preference value, for a specified page.
	/// ------------------------------------------------------------------
	getDisable(page) {
		try {
			return this.preferences[page]["disable"];
		} catch(ex) {
			return false;
		}
	}
	
	/// ---------------------------------------------------------------
	/// Sets the "disable extender" preference value, for a specified page.
	/// ---------------------------------------------------------------
	setDisable(value, page) {
		try {
			this.preferences[page]["disable"] = value;
		} catch(ex) {
			this.preferences[page] = {
				"disable": value
			};
		}
		
		this.savePreferences();
	}
	
	/// ------------------------------------------------------------------
	/// Returns the "Async Cover" preference value, for a specified page.
	/// ------------------------------------------------------------------
	getAsync(page) {
		try {
			return this.preferences[page]["async"];
		} catch(ex) {
			return true;
		}
	}
	
	/// ---------------------------------------------------------------
	/// Sets the "Async Cover" preference value, for a specified page.
	/// ---------------------------------------------------------------
	setAsync(value, page) {
		try {
			this.preferences[page]["async"] = value;
		} catch(ex) {
			this.preferences[page] = {
				"async": value
			};
		}
		
		this.savePreferences();
	}
	
	getBigMode(){
		try {
			return this.preferences["bigmode"];
		} catch(ex) {
			return true;
		}
	}
	
	setBigMode(value) {
		this.preferences["bigmode"] = value;
		this.savePreferences();
	}
	
	/// ------------------------------------------
	/// Writes the current preferences to storage.
	/// ------------------------------------------
	savePreferences() {
		this.storage.set("vnext-prefs", this.preferences);
	}
	
	/// ------------------------------------------
	/// Called when we can't save the preferences.
	/// ------------------------------------------
	onSavePreferencesError(data) {
		// Don't log it for the user
	}
}
