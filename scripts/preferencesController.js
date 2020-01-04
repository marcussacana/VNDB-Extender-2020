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
