/**
 * TreSensa Game Engine- PlatForm Identification Messages
 * code snippet  from: http://modernizr.com/downloads/modernizr-2.5.3.js 
 */

/**@class
This class confirms whether a particular HTML5 feature is supported or not. Object can be created as follows:

var objPlatformCompatibility  =  new TGE.PlatformCompatibility()
*/



TGE.PlatformCompatibility = function() {
    return this;
};
	
TGE.PlatformCompatibility.prototype =
{
    /**
    This method returns whether the HTML5 audio tag is supported by the browser.

    @returns {bool}
    True: If the audio tag is supported.
    False: If audio tag is not supported.

    @example
    var bCheck =   objPlatformCompatibility.isAudioSupported();
    */
    isAudioSupported : function() {

        var elem = document.createElement('audio'), bool = false;

        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                bool.m4a = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
            }
        } catch(e) {
        }

        return bool;

    },

    /**
    This method determines whether the given audio format is supported on a particular platform.

    @param sFormat {string} The following values are supported “ogg”, "mp3", "wav", "m4a"

    @returns {bool}
    True: If the specified format is supported.
    False: If the specified format is not supported.

    @example
    var bCheck =  objPlatformCompatibility.isAudioFormatSupported("ogg");
    */
    isAudioFormatSupported : function(sFormat) {

        var elem = document.createElement('audio'), bool = false;
        var returnV

        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                switch(sFormat)
                {
                    case "ogg":
                    returnV = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                    break;
                    case "mp3":
                    returnV = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');
                    break;
                    case "wav":
                    returnV = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                    break;
                    case "m4a":
                    returnV = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
                    break;
                    default:

                    break;
                }
                                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs


            }
        } catch(e) {
        }

        return returnV;

    },

    /**
    Confirms whether canvas is supported on a particular  platform or not.

    @returns {bool}
    True:If canvas feature is supported.
    False: If canvas feature is not supported.

    @example
    var bCheck = objTGEPlatformCompatibility.isCanvasSupported();
    */
    isCanvasSupported : function() {

        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    },

    /**
    It returns whether video is supported on a particular  platform or not.

    @returns {bool}
    True: If the HTML5 video tag is supported by the browser.
    False If the HTML5 video tag is supported by the browser.

    @example
    var bCheck =  objPlatformCompatibility.isVideoSupported();
    */
    isVideoSupported : function() {
        var elem = document.createElement('video'), bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if( bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('video/ogg; codecs="theora"');

                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"');
            }

        } catch(e) {
        }

        return bool;

    },

    /** @ignore */
    isDragAndDropSupported : function() {

        var div = document.createElement('div');
        bool = ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
        return bool;
    },

    /** @ignore */
    isGeolocationSupported : function() {
        return !!navigator.geolocation;

    },

    /** @ignore */
    isWebGlSupported : function() {
        try {
            var canvas = document.createElement('canvas'), ret;
            ret = !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl') || canvas.getContext('webgl')));
            canvas = undefined;
        } catch (e) {
            ret = false;
        }
        return ret;

    },

    /** @ignore */
    isHistorySupported : function() {
        return !!(window.history && history.pushState);

    },

    /** @ignore */
    isVideoSupported : function() {
        var elem = document.createElement('video'), bool = false;
    },

    /** @ignore */
    isLocalStorageSupported : function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }

    },

    /** @ignore */
    isSessionStorageSupported : function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }

    },

    /** @ignore */
    isSVGSupported : function() {
        ns = {
            'svg' : 'http://www.w3.org/2000/svg'
        };
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;

    }
}



/**
 * TreSensa Game Engine- PlatForm Identification Messages
 * code snippet  from: http://modernizr.com/downloads/modernizr-2.5.3.js 
 */

/**@class
This class detects the orientation change and triggers the callback function. Object can be created as follows:

var objDeviceOrientation  =  new TGE.DeviceOrientation()
*/
TGE.DeviceOrientation = function() {
    return this;
};
	
TGE.DeviceOrientation.prototype =
{
    orientationChangeCallBack:null,

    /**
    This method  registers the callback and whenever the orientation of device is changed it triggers the callbackfunction

    @returns
    callback function

    @example
    function detectChangeInOrientation(mode)
    {
        switch(mode)
        {
        case 'portrait':
        break;
        case 'landscape':
        break;
        }
    }
    objDeviceOrientation.RegisterOrientationChange(detectChangeInOrientation);
    */
    RegisterOrientationChange:function(callback)
    {
        TGE.DeviceOrientation.prototype.orientationChangeCallBack= callback;
        window.addEventListener("orientationchange", TGE.DeviceOrientation.prototype.internalOrientationChanged)
        TGE.DeviceOrientation.prototype.internalOrientationChanged();

    },
    /** @ignore */
    internalOrientationChanged:function()
    {
        if(window.orientation === 90 || window.orientation === -90)
        {
            TGE.DeviceOrientation.prototype.orientationChangeCallBack("landscape");
        }
        else
        {
            TGE.DeviceOrientation.prototype.orientationChangeCallBack("portrait");
        }
    }
}