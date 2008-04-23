/*
const USURL = "buylaterv2.cognition.ca";
const CAURL = "buylaterv2ca.cognition.ca";
const UKURL = "buylaterv2uk.cognition.ca";
const DEURL = "buylaterv2de.cognition.ca";
const RAWURL = "cognition.ca";
*/
const RAWURL = "localhost";
const USURL = "localhost";

var lb_prefs = null;

var bl_controller = {
  version: Cc["@mozilla.org/extensions/manager;1"]
           .getService(Ci.nsIExtensionManager)
           .getItemForID("{5bf4e017-d36a-4fc2-b99e-e9abb6b1f2f4}").version,
  SHOW_DELAY: 500,         
  onload: function() {
    lb_prefs = Components.classes['@mozilla.org/preferences-service;1']
       .getService(Components.interfaces.nsIPrefService)
       .getBranch('extensions.buylater.');
    var appcontent = window.document.getElementById("appcontent");
    if (appcontent) {
      if (!appcontent.greased_buylater) {    
        var pageURL;
        var lastVersion = lb_prefs.getCharPref("lastversion");
        if (lastVersion == "firstrun") {
          window.openDialog("chrome://buylater/content/options.xul");
          if (lb_prefs.getPrefType("firstRunURL")) pageURL = lb_prefs.getCharPref("firstRunURL");
        } else if (lastVersion != bl_controller.version) {
          if (lb_prefs.getPrefType("upgradeURL")) pageURL = lb_prefs.getCharPref("upgradeURL");
        }

        lb_prefs.setCharPref("lastversion", bl_controller.version);
        if (pageURL && pageURL != "null") {
          setTimeout(function(){window.openUILinkIn(pageURL, "tab")}, this.SHOW_DELAY);
        }

        appcontent.greased_buylater = true;
        if (!lb_prefs.getPrefType("userpass") || lb_prefs.getCharPref("userpass") == "") {
          lb_prefs.setCharPref("userpass", randomPassword(9)); 
        }
        appcontent.addEventListener("DOMContentLoaded", do_buylater, false);
      }
    }
  }
}

window.addEventListener("load", bl_controller.onload, false);

function buylater_gui(aDocument, aASIN) {
  
  var parent = aDocument.getElementById("buyboxDivId");
  if (!parent) {
    var wishlist = aDocument.getElementById("wishlist_btn_div_js");
    if (wishlist) {
      parent = wishlist.parentNode;  
    } 
  }
  if (parent) {
    var inst = this;
    
    var email = "";
    if (lb_prefs.getPrefType("emailaddress")) {
      email = lb_prefs.getCharPref("emailaddress");
    } 
    
    var href = aDocument.location.href;
    var BASEURL = USURL;
    if (href.indexOf('amazon.ca') > -1) BASEURL = CAURL;
    if (href.indexOf('amazon.co.uk') > -1) BASEURL = UKURL;
    if (href.indexOf('amazon.de') > -1) BASEURL = DEURL;
    
    var div = aDocument.createElement("div");
    div.setAttribute("style", "margin-left: 26px; margin-right: 38px; margin-top: 6px; cursor: pointer;");
    var img = aDocument.createElement("img");
    img.setAttribute("src", "http://" + BASEURL + "/btn/" + aASIN + "/" + email + ".png");
    img.id = "buylaterimg";
    div.appendChild(img);
    div.onclick = function (aEvt) {
      if (lb_prefs.getPrefType("emailaddress")) {
        email = lb_prefs.getCharPref("emailaddress");
      } 
      var userpass = lb_prefs.getCharPref("userpass");
      if (email) {
        inst.sendRequest(inst.makeRequest(BASEURL, aASIN, email, userpass), aDocument);
      } else {
        window.openDialog("chrome://buylater/content/options.xul"); 
      }
    };
    /* if (wishlist)
     parent.insertBefore(div, parent.firstChild);
    else */
     parent.appendChild(div);
  }
}

buylater_gui.prototype.sendRequest = function sendRequest(aURL, aDocument) {
  var req = new XMLHttpRequest();
  req.open('GET', aURL);

  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
       var s = new Components.utils.Sandbox("about:blank");
       var result = Components.utils.evalInSandbox("(" + req.responseText + ")", s);
       if (!result || (result.error_code && result.error_msg)) {
         bb_log("JMC: json didn't eval in sandbox well\n");
       } else {
         bb_log("JMC:" + result + "\n");
         var blimg = aDocument.getElementById('buylaterimg');
         var newsrc = blimg.getAttribute("src") +"?rnd=" + new Date().getTime();
         blimg.setAttribute("src", newsrc);
         blimg.src = newsrc;
         if (result.verify) {
           alert("Check your email for account verification!");
         } else if (result.URL) {
           aDocument.location.href = result.URL;
         } else {
           alert("Okay! Click again to change settings.");
         }
       }
    }
  }
  req.send(null); 
}


buylater_gui.prototype.makeRequest = function lb_sendRequest(BASEURL, aASIN, aEmail, aUserPass) {
  var fetchURL = "http://" + BASEURL + "/api/";
  fetchURL += "email=" + aEmail;
  fetchURL += "&ASIN=" + aASIN;
  fetchURL += "&userpass=" + aUserPass; // NOT A USER SPECIFIED VALUE!
  return fetchURL;
}


function do_buylater(evt) {
  var doc = new XPCNativeWrapper(evt.originalTarget, "top");
  if (!doc || !doc.body || (doc.defaultView.top != doc.defaultView.self)) return;
  
  var asin = GET_ASIN( doc );
  if (asin) {
    var selectGUI = new buylater_gui(doc, asin);
  }
}


function DECORATE_ACTIONS(aDocument) {
  var taglist = aDocument.getElementsByTagName("a"); 
  for (var i=0; i < taglist.length; i++) {
    var tag = taglist[i];
    if (tag.getAttribute("class") == "buylater-delete") {
      tag.href += "&password=" + lb_prefs.getCharPref("userpass");
      tag.setAttribute("style", "");
    } 
  }
}

function GET_ASIN(aDocument) {
  var href = aDocument.location.href;
  if (href.indexOf(RAWURL) > -1) {
    DECORATE_ACTIONS(aDocument);
  } 
  
  if ((href.indexOf('amazon.com') > -1) ||
     (href.indexOf('amazon.ca') > -1) ||
     (href.indexOf('amazon.co.uk') > -1) ||
     (href.indexOf('amazon.de') > -1)) {
    var asinNode = aDocument.getElementById('ASIN');
    if (asinNode) return asinNode.value;
  }
  return false; 
}