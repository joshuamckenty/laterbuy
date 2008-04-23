/*
BuyLater License BLOCK
*/

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const BASEURL = "http://buylater.cognition.ca/grid/volunteer/";

const XMLHTTPREQUEST_READYSTATE_UNINITIALIZED = 0;
const XMLHTTPREQUEST_READYSTATE_LOADING = 1;
const XMLHTTPREQUEST_READYSTATE_LOADED = 2;
const XMLHTTPREQUEST_READYSTATE_INTERACTIVE = 3;
const XMLHTTPREQUEST_READYSTATE_COMPLETED = 4;

const HTTP_CODE_OK = 200;
const HTTP_CODE_FOUND = 302;

const XMLHTTPREQUEST_CONTRACTID = "@mozilla.org/xmlextras/xmlhttprequest;1";

const buylaterClassName = "BuyLater Service";
const buylaterClassID =          Components.ID("{4267b35f-2d06-4066-9462-4c960b4ec230}");
const buylaterContractID =       "@mozilla.org/buylater/buylaterservice;1";

const BUYLATER_RECOVERY_TIMER = 300000;
const BUYLATER_POLLING_DELAY = 60000; // 60 seconds


function getObserverService() {
  return Cc["@mozilla.org/observer-service;1"]
         .getService(Ci.nsIObserverService);
}


function loadSubScript(spec) {
  var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Ci.mozIJSSubScriptLoader);
  var context = {};
  loader.loadSubScript(spec, context);
  return context;
}

function bb_log(str) {
    var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
         getService(Components.interfaces.nsIConsoleService);
    aConsoleService.logStringMessage(str);
}


function BuyLaterService() {
  var obs = getObserverService();
  obs.addObserver(this, "profile-do-change", false);
}

BuyLaterService.prototype = {
  wrappedJSObject: this,
  QueryInterface:   function(iid) {
     if (iid.equals(Ci.nsIObserver) ||
         iid.equals(Ci.nsIDOMEventListener) ||
         iid.equals(Ci.nsITimerCallback) ||
         iid.equals(Ci.buylaterIService))
       return this;
     throw Cr.NS_ERROR_NO_INTERFACE;
  },
  lastResult: null,
  _init: function buylaterService__init() {
    // Wait a few minutes after startup before polling for JSON scraping updates
    dump("JMC: Real Init in BuyLaterService...\n");
    this.wrappedJSObject = this;
    this.lb_prefs = Cc['@mozilla.org/preferences-service;1']
         .getService(Ci.nsIPrefService)
         .getBranch('extensions.buylater.');
    this._recoveryTimer = Cc["@mozilla.org/timer;1"].
                              createInstance(Ci.nsITimer);
    this._recoveryTimer
     .initWithCallback(this,
                       BUYLATER_RECOVERY_TIMER,
                       Ci.nsITimer. TYPE_REPEATING_SLACK);
    
    this.startTimer();
  },
  
  startTimer: function() {
    this._delayedUpdateTimer = Cc["@mozilla.org/timer;1"].
                               createInstance(Ci.nsITimer);
    this._delayedUpdateTimer.initWithCallback(this,
                                              BUYLATER_POLLING_DELAY,
                                              Ci.nsITimer.TYPE_ONE_SHOT);
  },
  
  notify: function(aTimer) {
    switch(aTimer) {
      case this._delayedUpdateTimer:
        this._getNextScript();
        this._delayedUpdateTimer = null;
        break;
      case this._recoveryTimer:
        if (!this._delayedUpdateTimer) this.startTimer();
        break;
    }
  },
  
  observe: function(subject, topic, data) {
    switch (topic) {
      case "profile-do-change":
        // JMC - Remove observer, no leaks!
        this._init();
        break;

    }
  },
  
  _getNextScript: function() {
    var url = BASEURL;
    url +=  this.lb_prefs.getCharPref("emailaddress");
    url += "/" + this.lb_prefs.getCharPref("userpass");
    this.getURLFromURL(url, this.lastResult);
    this.lastResult = null;
  },
  
  getURLFromURL: function(fetchURL, postData) {
    var inst = this;
    var req = Cc[XMLHTTPREQUEST_CONTRACTID]
               .createInstance(Ci.nsIXMLHttpRequest);
    req.QueryInterface(Ci.nsIJSXMLHttpRequest);
    if (!postData) {
      req.open("GET", fetchURL, true);
    } else {
      req.open("POST", fetchURL, true); 
    }
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    req.onreadystatechange =
    function JSON_onChange(aEvt) {
      if (req.readyState == XMLHTTPREQUEST_READYSTATE_COMPLETED) {
        if (req.status/100 == 2) {
          if (req.responseText) {
            var s = new Cu.Sandbox(BASEURL);
            var result = Cu.evalInSandbox("(" + req.responseText + ")", s);
            if (result.URL) {
              inst.currentCommand = req.responseText;
              inst.getXMLFromURL(result.URL);
            }
          }
        } else {
          dump("JMC: http error - " + req.status +" \n");
        }
      }
    }
    req.send("amazon=" + encodeURIComponent(postData));
  },
  
  getXMLFromURL: function(fetchURL) {
    var inst = this;
    var req = Cc[XMLHTTPREQUEST_CONTRACTID]
               .createInstance(Ci.nsIXMLHttpRequest);
    req.QueryInterface(Ci.nsIJSXMLHttpRequest);
    req.open("GET", fetchURL, true);
    req.onreadystatechange =
    function JSON_onChange(aEvt) {
      if (req.readyState == XMLHTTPREQUEST_READYSTATE_COMPLETED) {
        if (req.status/100 == 2) {
          var data = req.responseText;
          var serializer = Cc['@mozilla.org/xmlextras/xmlserializer;1'].createInstance(Ci.nsIDOMSerializer);
          var currentCommand = eval("(" + inst.currentCommand + ")"); // BAD, but evalInSandbox limits access to DOM
          if (currentCommand.processXML) {
            var doc = currentCommand.processXML(req.responseXML);
            data = serializer.serializeToString(doc);
          } else if (currentCommand.processText) {
            data = currentCommand.processText(req.responseText);
          }
          inst.lastResult = data;
        } else {
          dump("JMC: http error - " + req.status +" \n");
        }
        inst.startTimer();
      }
    }
    req.send(null);
  }
}



// ================================================
// ========== BEGIN XPCOM Module support ==========
// ================================================

var BuylaterServiceFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (this.singleton == null)
      this.singleton = new BuyLaterService();
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var BuylaterServiceModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(buylaterClassID, buylaterClassName, buylaterContractID, aFileSpec, aLocation, aType);
    var catMgr = Cc["@mozilla.org/categorymanager;1"]
        .getService(Ci.nsICategoryManager);
    catMgr.addCategoryEntry( 'app-startup', buylaterClassName,
                                 'service,' + buylaterContractID , true, true );
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(buylaterClassID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(buylaterClassID))
      return BuylaterServiceFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec) { return BuylaterServiceModule; }
