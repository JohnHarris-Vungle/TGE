/**
 * @namespace TGE
 * @description The namespace used for client-side Tresensa Game Engine classes.
 */
var TGE = TGE || {};

/** @ignore */
TGE.log = function()
{
    /*if(window.console)
     {
     window.console.log(Array.prototype.slice.call(arguments));
     }*/
}

/** @ignore */
TGE.debugLog = function()
{
    /*if(window.console)
     {
     window.console.log(Array.prototype.slice.call(arguments));
     }*/
}

// PAN-240
TGE.Debug = TGE.Debug || {};

TGE.Debug.LOG_NONE = 0;
TGE.Debug.LOG_ERROR = 1;
TGE.Debug.LOG_WARNING = 2;
TGE.Debug.LOG_INFO = 3;
TGE.Debug.LOG_VERBOSE = 4;

/**
 * @param {Number} [TGE.Debug.LogLevel=3] Default is to not log any errors or warnings. Override by setting GameConfig.LOG_LEVEL
 */

if (typeof(GameConfig)!=="undefined" && typeof GameConfig.LOG_LEVEL === 'number')
{
    var debugMode = getQueryString()["tgedebug"];
    if (debugMode==="3" || debugMode==="4")
    {
        TGE.Debug.LogLevel = 4;
    }
    else
    {
        TGE.Debug.LogLevel = GameConfig.LOG_LEVEL;
    }
}
else
{
    TGE.Debug.LogLevel = TGE.Debug.LOG_INFO;
}

TGE.Debug.Log = function(level)
{
    if(window.console && level<=TGE.Debug.LogLevel)
    {
        var preamble = "TGE: ";
        var logMethod = "log";
        if(level===TGE.Debug.LOG_ERROR) {
            preamble += "**ERROR** ";
            logMethod = "error";
        } else if(level === TGE.Debug.LOG_WARNING) {
            preamble += "**WARNING** ";
            logMethod = "warn";
        }

        window.console[logMethod](preamble + Array.prototype.slice.call(arguments,1));
    }
};

// Macro function for implementing inheritence design pattern.
// Source: "Pro JavaScript Design Patterns" book
function extend(subClass, superClass)
{
    var subClassPrototype = subClass.prototype;

    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
    subClass.superclass = superClass.prototype;

    if(superClass.prototype.constructor === Object.prototype.constructor)
    {
        superClass.prototype.constructor = superClass;
    }

    for (var method in subClassPrototype)
    {
        if (subClassPrototype.hasOwnProperty(method))
        {
            subClass.prototype[method] = subClassPrototype[method];
        }
    }
}


// Implementation of bind function if required.
// Source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
    /** @ignore */
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,

            /** @ignore */
            fNOP = function () {},

            /** @ignore */
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}


// requestAnimationFrame polyfill
// Source: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function ()
{
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
    {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame) window.requestAnimationFrame = function (callback, element)
    {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function ()
        {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    if(!window.cancelAnimationFrame) window.cancelAnimationFrame = function (id)
    {
        clearTimeout(id);
    };
}());


// Put the querystring variables into an associate array
// Source: http://stackoverflow.com/questions/647259/javascript-query-string
function getQueryString()
{
    if(window.TreSensa)
    {
        return TreSensa.Playable.getParameters();
    }
    else if(window.GameConfig && GameConfig.DIRECT_AD) // Deprecated, but older CB versions used GameConfig.DIRECT_AD so we must retain support
    {
        return GameConfig.DIRECT_AD;
    }

    var result = {}, queryString = location.search.substring(1),
        re = /([^&=]+)=([^&]*)/g, m;

    while(m = re.exec(queryString))
    {
        result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }

    return result;
}


function getDistributionPartner()
{
    // Was a distribution partner id specified?
    var partnerID = getQueryString()["dst"];

    return (typeof partnerID === "string") ? partnerID : null;
}


function loadScript(url, callback)
{
    // adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // then bind the event to the callback function
    // there are several events for cross browser compatibility
    script.onreadystatechange = callback;
    script.onload = callback;

    // fire the loading
    head.appendChild(script);
}


function trimmedFilename(f)
{
    var start = f.lastIndexOf('/') + 1;
    return f.substr(start, f.lastIndexOf('.')-start);
}


var merge = function extend(obj)
{
    Array.prototype.forEach.call(Array.prototype.slice.call(arguments, 1), function(source)
    {
        for (var prop in source)
        {
            if (Object.prototype.hasOwnProperty.call(source, prop))
            {
                obj[prop] = source[prop];
            }
        }
    });

    return obj;
}

// Detect whether we're running inside the CB editor
TGE.InCreativeBuilder = function()
{
    return (window._selfServe !== undefined && !window.__gameOnly);
};

// Browser/Device detection code. Taken from: http://www.quirksmode.org/js/detect.html
TGE.BrowserDetect =
    {

        DEVICES: {
            IPAD: 'iPad',
            IPHONE_4: 'iPhone 4',
            IPHONE_5: 'iPhone 5',
            IPHONE_6: 'iPhone 6',
            IPHONE_6_PLUS: 'iPhone 6+'
        },

        init: function()
        {
            this.browser = this.searchString(this.dataBrowser) || "an unknown browser";
            this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
            this.platform = this.searchString(this.dataPlatform) || "an unknown OS or Device";
            this.OSversion = this.detectOSversion(this.platform);
            this.onFirefoxMobile = (/Firefox/i).test(navigator.userAgent) && ((/Android/i).test(navigator.userAgent) || (/Mobile/i).test(navigator.userAgent));
            this.oniOS = this.platform==="iPhone" || this.platform==="iPad";
            this.iOSDevice = this.detectiOSDevice(screen.height);
            this.onAndroid = this.platform==="Android";
            this.onWindowsMobile = this.platform==="Windows Phone" || this.platform==="Windows Tablet";
            this.isMobileDevice = !(this.platform==="Windows" || this.platform==="Mac" || this.platform==="Linux");
            this.clickEvent = !this.isMobileDevice || this.onWindowsMobile ? "click" : "touchstart";

            // PAN-545: iOS 8 Simulator reports wrong OS version
            if(this.oniOS && this.OSversion == "10_") {
                this.OSversion = "8_";
            }

            //alert(navigator.userAgent.toString());
            //alert("browser: " + this.browser + " version: " + this.version + " platform: " + this.platform + " OSversion: " + this.OSversion + " isMobileDevice: " + (this.isMobileDevice ? "yes" : "no"));
        },

        detectiOSDevice: function(screenHeight) {

            if(this.oniOS) {
                switch(screenHeight){
                    case 1024: return this.DEVICES.IPAD;
                    case 480: return this.DEVICES.IPHONE_4;
                    case 568: return this.DEVICES.IPHONE_5;
                    case 667: return this.DEVICES.IPHONE_6;
                    case 736: return this.DEVICES.IPHONE_6_PLUS;
                }
            } else {
                return false;
            }
        },

        detectOSversion: function(platform)
        {
            var sVersion = '-1'
            var regExp = ''
            var uagent = navigator.userAgent.toString();

            switch(platform)
            {
                case 'Windows Phone':
                    regExp =/Windows Phone OS\s+[\d\.]+/
                    sVersion = String(uagent.match(regExp)).substring(17,20)
                    break;
                case 'iPhone':
                case 'iPad':
                    regExp = /OS\s+[\d\_]+/
                    sVersion = String(uagent.match(regExp)).substring(3).match(/[^_]*/i)[0];

                    break;
                case 'Windows':
                    //http://msdn.microsoft.com/en-us/library/ms537503(v=vs.85).aspx
                    regExp = /Windows NT\s+[\d\.]+/
                    var sTempVersion = String(uagent.match(regExp)).substring(11, 14);
                    if(sTempVersion == '6.1')
                        sVersion = '7'
                    else if(sTempVersion == '5.1')
                        sVersion = 'XP'
                    else if(sTempVersion == '5.2')
                        sVersion = 'XP'
                    else if(sTempVersion == '6.0')
                        sVersion = 'Vista'
                    else if(sTempVersion == '5.01')
                        sVersion = '2000 SP1'
                    else if(sTempVersion == '5.0')
                        sVersion = '2000'

                    break;
                case 'Mac':
                    regExp = /Mac OS X\s+[\d\_]+/
                    sVersion = String(uagent.match(regExp)).substring(9, 13);
                    break;
                case 'Android':
                    regExp = /ndroid\s+[\d\.]+/
                    sVersion = String(uagent.match(regExp)).substring(7, 10);
                    break;
            }
            return sVersion;
        },

        searchString: function(data)
        {
            for (var i=0;i<data.length;i++)
            {
                if(data[i]!=null)
                {
                    var dataString = data[i].string;
                    var dataProp = data[i].prop;
                    this.versionSearchString = data[i].versionSearch || data[i].identity;
                    if (dataString)
                    {
                        if (dataString.indexOf(data[i].subString) !== -1)
                        {
                            // Special case for IE11 (PAN-453 http://stackoverflow.com/questions/17907445/how-to-detect-ie11)
                            if(data[i].identity==="Mozilla" && !!navigator.userAgent.match(/Trident\/7\./))
                            {
                                return "Explorer";
                            }
                            return data[i].identity;
                        }
                    }
                    else if (dataProp)
                    {
                        return data[i].identity;
                    }
                }
            }
        },

        searchVersion: function (dataString)
        {
            var index = dataString.indexOf(this.versionSearchString);
            if (index === -1) return;
            return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
        },

        dataBrowser: [
            {
                string: navigator.userAgent,
                subString: "Chrome",
                identity: "Chrome"
            },
            {
                // IE was previously MSIE now they call it 'Explorer'
                string: navigator.userAgent,
                subString: "MSIE",
                identity: "Explorer",
                versionSearch: "MSIE"
            },
            {
                string: navigator.userAgent,
                subString: "Explorer",
                identity: "Explorer",
                versionSearch: "Explorer"
            },
            {
                string: navigator.vendor,
                subString: "Apple",
                identity: "Safari",
                versionSearch: "Version"
            },
            {
                string: navigator.userAgent,
                subString: "Firefox",
                identity: "Firefox"
            },
            {
                prop: window.opera,
                identity: "Opera"
            },
            {   // Kindle Fire (Silk)
                string: navigator.userAgent,
                subString: "Silk",
                identity: "Silk",
                versionSearch: "Silk"
            },
            {   // Kindle Fire (Silk-Accelerated)
                string: navigator.userAgent,
                subString: "Kindle Fire",
                identity: "Amazon Web App",
                versionSearch: "AppleWebKit"
            },
            {
                string: navigator.userAgent,
                subString: "Gecko",
                identity: "Mozilla",
                versionSearch: "rv"
            },
            { // for older Netscapes (4-)
                string: navigator.userAgent,
                subString: "Mozilla",
                identity: "Netscape",
                versionSearch: "Mozilla"
            },
            {   string: navigator.userAgent,
                subString: "OmniWeb",
                versionSearch: "OmniWeb/",
                identity: "OmniWeb"
            },
            {
                string: navigator.vendor,
                subString: "iCab",
                identity: "iCab"
            },
            {
                string: navigator.vendor,
                subString: "KDE",
                identity: "Konqueror"
            },
            {
                string: navigator.vendor,
                subString: "Camino",
                identity: "Camino"
            },
            {	// for newer Netscapes (6+)
                string: navigator.userAgent,
                subString: "Netscape",
                identity: "Netscape"
            },
            {
                string: navigator.vendor,
                subString: "BlackBerry",
                identity: "BlackBerry"
            }
        ],

        dataPlatform: [
            {
                string: navigator.userAgent,
                subString: "Windows Phone",
                identity: "Windows Phone"
            },
            {
                string: navigator.userAgent,
                subString: "Tablet PC",
                identity: "Windows Tablet"
            },
            {
                string: navigator.platform,
                subString: "Win",
                identity: "Windows"
            },
            {
                string: navigator.userAgent,
                subString: "iPhone",
                identity: "iPhone"
            },
            {
                string: navigator.userAgent,
                subString: "iPad",
                identity: "iPad"
            },
            {
                string: navigator.userAgent,
                subString: "iPod",
                identity: "iPod"
            },
            {   // Kindle Fire (Silk)
                string: navigator.userAgent,
                subString: "Silk",
                identity: "Kindle Fire"
            },
            {   // Kindle Fire (Web App)
                string: navigator.userAgent,
                subString: "Kindle Fire",
                identity: "Kindle Fire"
            },
            {
                string: navigator.userAgent,
                subString: "Android",
                identity: "Android"
            },
            {
                string: navigator.platform,
                subString: "Mac",
                identity: "Mac"
            },
            {
                string: navigator.userAgent,
                subString: "webOS",
                identity: "webOS"
            },
            {
                string: navigator.userAgent,
                subString: "Mobile",
                identity: "Mobile"
            },
            {
                string: navigator.platform,
                subString: "Linux",
                identity: "Linux"
            }
        ]
    };
TGE.BrowserDetect.init();

// Force the viewport parameters to disable touch zooming
var _vp = document.querySelector("meta[name=viewport]");
if(_vp)
{
    _vp.setAttribute("content", " initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui");
}

// PAN-898 We need a little legacy TGL support since some games call the getPreviewMode() function
var TGL = window.TGL || {};
if(!TGL.PREVIEW)
{
    TGL.PREVIEW = {
        NONE: 0,
        AD_300X250: 1,
        AD_FULLSCREEN: 2
    };

    TGL.getPreviewMode = function(){
        TGE.Debug.Log(TGE.Debug.LOG_WARNING, "this game is using the deprecated TGL sdk. These references should be removed.");
        var previewMode = getQueryString()["previewMode"];
        if(previewMode == "1") {
            return TGL.PREVIEW.AD_300X250;
        } else if (previewMode == "2") {
            return TGL.PREVIEW.AD_FULLSCREEN;
        } else {
            return TGL.PREVIEW.NONE;
        }
    };
}


