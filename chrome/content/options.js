var lbConfig = {
  onLoad: function() { 
    lbConfig.prefs = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefService)
      .getBranch('extensions.buylater.');
    if (lbConfig.prefs.getPrefType("emailaddress")) {
      $('emailaddress').value = lbConfig.prefs.getCharPref("emailaddress");
    }
  },
  prefs: null,
  onOK: function() {
    // lbConfig.prefs.setCharPref("twittername", $('twittername').value);
    lbConfig.prefs.setCharPref("emailaddress", $('emailaddress').value);
  },
  visit_user_page: function() {
    if (lbConfig.prefs.getPrefType("emailaddress")) {
      openUILinkIn('http://buylaterv2.cognition.ca/user/' 
        + encodeURIComponent(lbConfig.prefs.getCharPref("emailaddress")), 'tab'); 
      window.close();
    } else {
      alert("You've got to set your email address first."); 
    }
  }
}

window.addEventListener("load", lbConfig.onLoad, false);