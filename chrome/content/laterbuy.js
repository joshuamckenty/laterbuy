

function laterbuyPopupMenu() {
  alert("foo"); 
}
function laterbuy_gui(aDocument, aASIN) {
  
  this.prefs = Components.classes['@mozilla.org/preferences-service;1']
    .getService(Components.interfaces.nsIPrefService)
    .getBranch('extensions.laterbuy.');
  
  var parent = aDocument.getElementById("buyboxDivId");
  if (parent) {
    var inst = this;
    var div = aDocument.createElement("div");
    div.onclick = function (aEvt) {
      // Show a dialog
      if (inst.prefs.getPrefType("twittername") && inst.prefs.getCharPref("twittername")) {
        inst.sendRequest(aDocument, aASIN);
      } else {
        window.openDialog("chrome://laterbuy/content/options.xul"); 
      }
    };
    div.appendChild(aDocument.createTextNode("Buy This Later"));
    parent.appendChild(div);
  }
}


laterbuy_gui.prototype.sendRequest = function lb_sendRequest(aDocument, aASIN) {
  var fetchURL = "http://laterbuy.cognition.ca/?";
  fetchURL += "tn=" + this.prefs.getCharPref("twittername");
  fetchURL += "&email=" + this.prefs.getCharPref("emailaddress");
  fetchURL += "&ASIN=" + aASIN;
  
  aDocument.location = fetchURL;
  /*
  var req = new XMLHttpRequest();
  req.open('GET', fetchURL);

  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      // alert(req.responseText);
     // update_info_from_status(info, final_status);
    }
  }
  req.send(null);
  */
}


function do_laterbuy(evt) {
  var doc = new XPCNativeWrapper(evt.originalTarget, "top");
  
  if (!doc || !doc.body) return;
  // if (win.body.clientWidth < 250 || win.body.clientHeight < 200) return;
  
  var asin = GET_ASIN( doc );
  if (asin) {
    var selectGUI = new laterbuy_gui(doc, asin);
  }
  
}


window.addEventListener("load", function () {
  var appcontent = window.document.getElementById("appcontent");
  if (appcontent) {
    if (!appcontent.greased_laterbuy) {
      appcontent.greased_laterbuy = true;
      appcontent.addEventListener("DOMContentLoaded", do_laterbuy, false);
    }
  }
}, false);

function GET_ASIN(aDocument) {
  var href = aDocument.location.href;
   if ((href.indexOf('amazon.com') > -1) && (href.indexOf('rate-this') == -1)) {
     if (href.indexOf('buylater') > -1) {
       alert("Check your email for your buylater confirmation.");
       return false; 
     }
     
     var asinNode = aDocument.getElementById('ASIN');
     if (asinNode) return asinNode.value;
   }
   return false; 
}