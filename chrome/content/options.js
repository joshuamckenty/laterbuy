var lbConfig = {
  onLoad: function() { 
    lbConfig.prefs = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefService)
      .getBranch('extensions.laterbuy.');
    
    if (lbConfig.prefs.getPrefType("twittername")) {
      $('twittername').value = lbConfig.prefs.getCharPref("twittername");
    }
    
    if (lbConfig.prefs.getPrefType("emailaddress")) {
      $('emailaddress').value = lbConfig.prefs.getCharPref("emailaddress");
    }
  },
  prefs: null,
  onOK: function() {
    lbConfig.prefs.setCharPref("twittername", $('twittername').value);
    lbConfig.prefs.setCharPref("emailaddress", $('emailaddress').value);
  },
}

window.addEventListener("load", lbConfig.onLoad, false);