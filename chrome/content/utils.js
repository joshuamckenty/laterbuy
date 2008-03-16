function bb_log(str) {
  if (typeof(console) == 'object' && console.log) {
    console.log(str);
  }
  else {
    var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
         getService(Components.interfaces.nsIConsoleService);

    aConsoleService.logStringMessage(str);
  }
}


function $(x) { return document.getElementById(x); }
