

function laterbuyPopupMenu() {
  alert("ImplementMe!"); 
}
function laterbuy_gui(aDocument, aASIN) {
  
  this.prefs = Components.classes['@mozilla.org/preferences-service;1']
    .getService(Components.interfaces.nsIPrefService)
    .getBranch('extensions.laterbuy.');
  
  var parent = aDocument.getElementById("buyboxDivId");
  if (parent) {
    var inst = this;
    var div = aDocument.createElement("div");
    div.setAttribute("style", "border: 1px solid gray; padding: 3px; text-align: center; font-weight: bold; background-color: lightgrey; margin-left: 32px; margin-right: 32px; cursor: pointer;");
    div.onclick = function (aEvt) {
      // Show a dialog
      if (inst.prefs.getPrefType("emailaddress") && inst.prefs.getCharPref("emailaddress")) {
        var userpass = null;
        if (inst.prefs.getPrefType("userpass")) {
          userpass =  inst.prefs.getCharPref("userpass");
        }
        inst.sendRequest(aDocument, aASIN, userpass);
      } else {
        window.openDialog("chrome://laterbuy/content/options.xul"); 
      }
    };
    div.appendChild(aDocument.createTextNode("Buy This Later"));
    parent.appendChild(div);
  }
}


laterbuy_gui.prototype.sendRequest = function lb_sendRequest(aDocument, aASIN, aUserPass) {
  var fetchURL = "http://laterbuy.cognition.ca/?";
  fetchURL += "&email=" + this.prefs.getCharPref("emailaddress");
  fetchURL += "&ASIN=" + aASIN;
  if (aUserPass) fetchURL += "&userpass=" + aUserPass; // NOT A USER SPECIFIED VALUE!
  aDocument.location = fetchURL;
}


var lb_prefs = null;

function do_laterbuy(evt) {
  var doc = new XPCNativeWrapper(evt.originalTarget, "top");
  if (!doc || !doc.body || (doc.defaultView.top != doc.defaultView.self)) return;
  
  var asin = GET_ASIN( doc );
  if (asin) {
    var selectGUI = new laterbuy_gui(doc, asin);
  }
 
  var userpass = GET_PASSWORD(doc);
  if (userpass) {
    lb_prefs.setCharPref("userpass", userpass);
  }
}


window.addEventListener("load", function () {
  var appcontent = window.document.getElementById("appcontent");
  if (appcontent) {
    if (!appcontent.greased_laterbuy) {
      appcontent.greased_laterbuy = true;
      lb_prefs = Components.classes['@mozilla.org/preferences-service;1']
         .getService(Components.interfaces.nsIPrefService)
         .getBranch('extensions.laterbuy.');
      var lastVersion = lb_prefs.getCharPref("lastversion");
      if (lastVersion == "firstrun") {
        window.openDialog("chrome://laterbuy/content/options.xul");
        lb_prefs.setCharPref("lastversion", "0.1"); // TODO - extension manager here, please
      }
      appcontent.addEventListener("DOMContentLoaded", do_laterbuy, false);
    }
  }
}, false);

function GET_PASSWORD(aDocument) {
  var href = aDocument.location.href;
  if (href.indexOf('laterbuy.cognition.ca') > -1) {
    if (lb_prefs.getPrefType("userpass")) {
      DECORATE_ACTIONS(aDocument);
    }
    var passNode = aDocument.getElementById("userpass");
    if (passNode) return passNode.value;  
  } 
  return false;
}

function DECORATE_ACTIONS(aDocument) {
  var taglist = aDocument.getElementsByTagName("a"); 
  for (var i=0; i < taglist.length; i++) {
    var tag = taglist[i];
    if (tag.getAttribute("class") == "laterbuy-delete") {
      tag.href += "&password=" + lb_prefs.getCharPref("userpass");
    } 
  }
}

function GET_ASIN(aDocument) {
  var href = aDocument.location.href;
   if ((href.indexOf('amazon.com') > -1) && (href.indexOf('rate-this') == -1)) {
     if (href.indexOf('verifiedbuylater') > -1) {
       alert("Your BuyLater watch has been set.");
       return false;
     } else if (href.indexOf('buylater') > -1) {
       alert("Check your email for your buylater confirmation.");
       return false; 
     }
     var asinNode = aDocument.getElementById('ASIN');
     if (asinNode) return asinNode.value;
   }
   return false; 
}