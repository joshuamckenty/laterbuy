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

function randomPassword(length)
{
  chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  pass = "";
  for(x=0;x<length;x++)
  {
    i = Math.floor(Math.random(new Date().getTime()) * 62);
    pass += chars.charAt(i);
  }
  return pass;
}