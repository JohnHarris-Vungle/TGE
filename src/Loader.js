
TGE.Loader = function(settings) {

    // merge settings with defaults
    settings = settings || {};

	this.assetManager = TGE.AssetManager.sAssetManagerInstance;

	// how frequently we poll resources for progress
    if (settings.statusInterval == null) {
        settings.statusInterval = 5000; // every 5 seconds by default
    }

    // delay before logging since last progress change
    if (settings.loggingDelay == null) {
        settings.loggingDelay = 20 * 1000; // log stragglers after 20 secs
    }

    // stop waiting if no progress has been made in the moving time window
    if (settings.noProgressTimeout == null) {
        settings.noProgressTimeout = Infinity; // do not stop waiting by default
    }

    var entries = [], // holds resources to be loaded with their status
        progressListeners = [],
        timeStarted,
        progressChanged = +new Date;

    /**
     * The status of a resource
     * @enum {number}
     */
    var ResourceState = {
        QUEUED: 0,
        WAITING: 1,
        LOADED: 2,
        ERROR: 3,
        TIMEOUT: 4
    };

    // places non-array values into an array.
    var ensureArray = function(val) {
        if (val == null) {
            return [];
        }

        if (Array.isArray(val)) {
            return val;
        }

        return [ val ];
    };

    // add an entry to the list of resources to be loaded
    this.add = function(resource) {

        // ensure priority is set
        if (resource.priority == null) {
            resource.priority = Infinity;
        }

        entries.push({
            resource: resource,
            state: ResourceState.QUEUED
        });
    };

    this.addProgressListener = function(callback) {
        progressListeners.push({
            callback: callback
        });
    };

    this.addCompletionListener = function(callback) {
        progressListeners.push({
            callback: function(e) {
                if (e.completedCount === e.totalCount) {
                    callback();
                }
            }
        });
    };

    this.start = function() {
        timeStarted = +new Date;

        // trigger requests for each resource
        for (var i = 0, len = entries.length; i < len; i++) {
            var entry = entries[i];
            entry.status = ResourceState.WAITING;
            entry.resource.start(this);
        }

        // do an initial status check soon since items may be loaded from the cache
        setTimeout(statusCheck, 100);
    };

    var statusCheck = function() {
        var checkAgain = false,
            noProgressTime = (+new Date) - progressChanged,
            timedOut = (noProgressTime >= settings.noProgressTimeout),
            shouldLog = (noProgressTime >= settings.loggingDelay);

        for (var i = 0, len = entries.length; i < len; i++) {
            var entry = entries[i];
            if (entry.status !== ResourceState.WAITING) {
                continue;
            }

            // see if the resource has loaded
            entry.resource.checkStatus();

            // if still waiting, mark as timed out or make sure we check again
            if (entry.status === ResourceState.WAITING) {
                if (timedOut) {
                    entry.resource.onTimeout();
                }
                else {
                    checkAgain = true;
                }
            }
        }

        // log any resources that are still pending
        if (shouldLog && checkAgain) {
            log();
        }

        if (checkAgain) {
            setTimeout(statusCheck, settings.statusInterval);
        }
    };

    this.isBusy = function() {
        for (var i = 0, len = entries.length; i < len; i++) {
            if (entries[i].status === ResourceState.QUEUED ||
                entries[i].status === ResourceState.WAITING) {
                return true;
            }
        }
        return false;
    };

    var onProgress = function(resource, statusType) {
        // find the entry for the resource
        var entry = null;
        for(var i=0, len = entries.length; i < len; i++) {
            if (entries[i].resource === resource) {
                entry = entries[i];
                break;
            }
        }

        // we have already updated the status of the resource
        if (entry == null || entry.status !== ResourceState.WAITING) {
            return;
        }
        entry.status = statusType;
        progressChanged = +new Date;

        // fire callbacks for interested listeners
        for (var i = 0, numListeners = progressListeners.length; i < numListeners; i++) {
            var listener = progressListeners[i];
            sendProgress(entry, listener);
        }
    };

    this.onLoad = function(resource) {
	    onProgress(resource, ResourceState.LOADED);

    	// add this to the list of loaded assets
	    if (resource.url)       // the url will be null for audio assets "not loaded" from NoAudioLoader
	    {
		    this.assetManager._mLoadedAssets.push(resource.url);
	    }
    };
    this.onError = function(resource) {
        onProgress(resource, ResourceState.ERROR);
    };
    this.onTimeout = function(resource) {
        onProgress(resource, ResourceState.TIMEOUT);
    };

    // sends a progress report to a listener
    var sendProgress = function(updatedEntry, listener) {
        // find stats for all the resources the caller is interested in
        var completed = 0,
            total = 0;
        for (var i = 0, len = entries.length; i < len; i++) {
            var entry = entries[i];

            total++;
            if (entry.status === ResourceState.LOADED ||
                entry.status === ResourceState.ERROR ||
                entry.status === ResourceState.TIMEOUT) {
                completed++;
            }
        }

        listener.callback({
            // info about the resource that changed
            resource: updatedEntry.resource,

            // should we expose StatusType instead?
            loaded: (updatedEntry.status === ResourceState.LOADED),
            error: (updatedEntry.status === ResourceState.ERROR),
            timeout: (updatedEntry.status === ResourceState.TIMEOUT),

            // updated stats for all resources
            completedCount: completed,
            totalCount: total
        });
    };

    // prints the status of each resource to the console
    var log = this.log = function(showAll) {
        if (!window.console) {
            return;
        }

        var elapsedSeconds = Math.round((+new Date - timeStarted) / 1000);
        window.console.log('TGE.Loader elapsed: ' + elapsedSeconds + ' sec');

        for (var i = 0, len = entries.length; i < len; i++) {
            var entry = entries[i];
            if (!showAll && entry.status !== ResourceState.WAITING) {
                continue;
            }

            var message = 'TGE.Loader: #' + i + ' ' + entry.resource.getName();
            switch(entry.status) {
                case ResourceState.QUEUED:
                    message += ' (Not Started)';
                    break;
                case ResourceState.WAITING:
                    message += ' (Waiting)';
                    break;
                case ResourceState.LOADED:
                    message += ' (Loaded)';
                    break;
                case ResourceState.ERROR:
                    message += ' (Error)';
                    break;
                case ResourceState.TIMEOUT:
                    message += ' (Timeout)';
                    break;
            }

            // add resource details, if present
            if (entry.resource.log)
            {
                message += " " + entry.resource.log();
            }
            window.console.log(message);
        }
    };
}

// shims to ensure we have newer Array utility methods

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
	Array.isArray = function(arg) {
		return Object.prototype.toString.call(arg) == '[object Array]';
	};
}

TGE.ElementLoader = function(url, type, attributes, listeners) {
    var self = this,
        loader = null,
        preload = (attributes && attributes.preload) || "auto",
        loadEvent;

    this.url = url;
    this.el = document.createElement(type);

	// cross-browser event binding
	this.bind = function(eventName, eventHandler) {
		if (self.el.addEventListener) {
			self.el.addEventListener(eventName, eventHandler, false);
		} else if (self.el.attachEvent) {
			self.el.attachEvent('on'+eventName, eventHandler);
		}
	};

	// cross-browser event un-binding
	this.unbind = function(eventName, eventHandler) {
		if (self.el.removeEventListener) {
			self.el.removeEventListener(eventName, eventHandler, false);
		} else if (self.el.detachEvent) {
			self.el.detachEvent('on'+eventName, eventHandler);
		}
	};

	if (type == "video")
    {
	    loadEvent = (preload === "auto") ? "canplaythrough" : "loadstart";

	    // add playsinline, unless specified not to
        if (!attributes || attributes.playsinline !== "false")
        {
	        this.el.setAttribute("webkit-playsinline", "");
	        this.el.setAttribute("playsinline", "");         // for iOS 10+
        }

	    // add any additional attributes passed in
	    if (attributes)
	    {
		    for (var a in attributes)
		    {
			    this.el.setAttribute(a, attributes[a]);
		    }
	    }

	    // set up any listeners passed in
	    if (listeners)
	    {
		    for (var l in listeners)
		    {
			    this.bind(l, listeners[l]);
		    }
	    }
    }
    else    // type == "img"
    {
        this.img = this.el;  // this.img is used for counting assets loaded
	    loadEvent = "load";
    }

    var onReadyStateChange = function () {
        if (self.el.readyState == 'complete') {
            removeEventHandlers();
            loader.onLoad(self);
        }
    };

	// for mobile, we need to load the video on an input event
    var addMobilePreload = function () {
	    // console.log("---adding touch listener for _preloadVideo: " + Date.now()/1000);
	    TGE.Game.GetInstance()._mStage.addEventListener("mouseup", _preloadVideo);
    };

    var _preloadVideo = function() {
	    // console.log("---calling _preloadVideo now: " + Date.now()/1000);
	    TGE.Game.GetInstance()._mStage.removeEventListener("mouseup", _preloadVideo);
    	var video = self.el;
	    video.muted = true;
	    var promise = video.play();
	    if (promise)
	    {
		    promise.then(function() {
			    video.pause();
		    }).catch(function(e) {
			    TGE.Debug.Log(TGE.Debug.LOG_WARNING,"video preload failed: " + e);
			    // fallback, since the preloading failed, we return the asset as loaded so it won't block game playback
			    onLoad();
		    });
	    }
	    else
	    {
		    video.pause();
	    }
    };

    var onLoad = function() {
	    // console.log("-----loaded: " + url);
	    removeEventHandlers();
        loader.onLoad(self);
    };

    var onError = function() {
        removeEventHandlers();
        loader.onError(self);
    };

    var removeEventHandlers = function() {
        self.unbind(loadEvent, onLoad);
        self.unbind('error', onError);
	    if (type === "img")
	    {
		    self.unbind('readystatechange', onReadyStateChange);
	    }
	    else if (TGE.BrowserDetect.isMobileDevice && preload === "auto")
        {
	        self.unbind('loadstart', addMobilePreload);
        }
    };

    var isComplete = function()
    {
        // NOTE: We're using readyState >= 1 for video, even though that's not enough data to play cleanly
        // without buffering, just in case our _preloadVideo attempt is unsuccessful. We could otherwise
        // be stuck in a Catch-22, if the game is waiting for the video to load, and the loader is waiting
        // for the game to play it. With metadata, the play() will at least be successful, albeit with a buffering pause.
    	return type === "video" ? (self.el.readyState >= 1) : self.el.complete;
    };

    this.start = function(ldr) {
        // we need the loader ref so we can notify upon completion
        loader = ldr;

        // NOTE: Must add event listeners before the src is set.
        self.bind(loadEvent, onLoad);
	    self.bind('error', onError);

	    // For images, we also need to use the readystatechange because
        // sometimes load doesn't fire when an image is in the cache.
	    if (type === "img")
	    {
		    self.bind('readystatechange', onReadyStateChange);
	    }
	    else
        {
            if (TGE.BrowserDetect.isMobileDevice && preload === "auto")
            {
	            self.bind('loadstart', addMobilePreload);
            }
        }

		// If we're in the Creative Builder environment we need to set the crossOrigin flag to prevent xdomain errors
		if (getQueryString()["draft"])
		{
			self.el.crossOrigin = "anonymous";
		}
		
		// For packaged builds that require inlined assets (Facebook, Vungle), we will check for the existence of a global
		// dictionary of asset names to base64 strings
		if (window._TREIMAGES)
		{
			var parts = url.split("/");
			var filename = parts[parts.length-1];
			self.el.src = _TREIMAGES[filename];
		}
		else
		{
			self.el.src = url;
		}        
    };

    // called to check status of image (fallback in case
    // the event listeners are not triggered).
    this.checkStatus = function() {
	    if (isComplete()) {
            removeEventHandlers();
            loader.onLoad(self);
        }
    };

    this.log = function() {
        return "readyState: " + this.el.readyState;
    };

    // called when it is no longer waiting
    this.onTimeout = function() {
        removeEventHandlers();
        if (isComplete()) {
            loader.onLoad(self);
        }
        else {
            loader.onTimeout(self);
        }
    };

    // returns a name for the resource that can be used in logging
    this.getName = function() {
        return url;
    };

};

// add convenience methods for adding an image or video
TGE.Loader.prototype.addImage = function(url) {
    var imageLoader = new TGE.ElementLoader(url, "img");
    this.add(imageLoader);

    // return the element to the caller
    return imageLoader.el;
};

TGE.Loader.prototype.addVideo = function(url, asset) {
	var videoLoader = new TGE.ElementLoader(url, "video", asset.attributes, asset.listeners);
	this.add(videoLoader);

	// return the element to the caller
	return videoLoader.el;
};
