/**
 * @class A class for playing a video asset, by rendering into an offscreen canvas
 * @property {HTMLVideoElement} video The playable video HTML element, corresponding to the assetId in setup()
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.VideoPlayer = function()
{
    TGE.VideoPlayer.superclass.constructor.apply(this, arguments);
};

/**
 * Deprecated and renamed to Wrappers, but need to keep it around due to references in PB 1.108.0 and VP module
 * @ignore
 */
TGE.VideoPlayer.Globals = {};

// VideoWrapper objects, by asset id
TGE.VideoPlayer.Wrappers = {};

// Global state properties, that need to persist on a preview restart
TGE.VideoPlayer.State = {
    muted: undefined,
    _unlockFunction: null
};

TGE.VideoPlayer.Analytics = "";

TGE.VideoPlayer.LoadEvents = [
    "loadstart",
    "loadedmetadata",
    "loadeddata",
    "canplay",
    "canplaythrough",
    "rendered"      // this is a non-native event synthesized by VP when the first frame data is drawn
];

TGE.VideoPlayer.PlayEvents = [
    "seeked",
    "playing",
    "waiting",
    "timeupdate",
    "ended",
];

TGE.VideoPlayer.Log = function(msg)
{
    if (getQueryString()["tgedebug"] === 5 || TGE.Debug.LogLevel === TGE.Debug.LOG_VERBOSE)
    {
        TGE.Debug.Log(TGE.Debug.LOG_INFO, msg);
    }
};

/**
 * Returns the VideoPlayer instance for a specified assetId
 * @param {String} assetId
 * @returns {TGE.VideoPlayer}
 */
TGE.VideoPlayer.Get = function(assetId)
{
    var wrapper = TGE.VideoPlayer.Wrappers[assetId];
    return wrapper && wrapper._videoPlayer;
};

/**
 * Suspend the loading of a video asset, when you know that it is no longer needed.
 * Note that there is also a suspendOnRemove flag that can be specified in setup().
 * @param {String} assetId
 */
TGE.VideoPlayer.Suspend = function(assetId)
{
    TGE.VideoPlayer.Log("video: [" + assetId + "] suspending");
    var video = TGE.Game.GetInstance().assetManager.getAsset(assetId, false);
    if (video)
    {
        TGE.VideoPlayer.Wrappers[assetId]._clearEventCounts(TGE.VideoPlayer.LoadEvents);

        video.setAttribute("preload", "none");
        video.load();
    }
};

TGE.VideoPlayer.prototype = {
    /**
     * Initialization
     * @param {String} [params.assetId] The AssetManager id for the video
     * @param {Boolean} [params.muted] Whether sound should be muted (default is to mirror the current AudioManager state)
     * @param {String} [params.muteStyle] Style for mute button: "none", "filled", "circle", "circleFilled"
     * @param {String} [params.muteColor=#ffffff] Color for mute button
     * @param {String} [params.muteThickness=0.5] Line thickness for mute button
     * @param {String} [params.muteSync=true] whether mute button changes mirror audioManager, or are treated separately
     * @param {String} [params.aspectHandling] When video aspect doesn't match the container, options are "crop", and "letterbox" (default)
     * @param {Boolean} [params.autoplay=false] Whether to play the video immediately upon creation
     * @param {Boolean} [params.loop=false] Whether the video should loop when reaching the end
     * @param {Number} [params.skipCountdown=0] optional time until the skip button becomes active
     * @param {Boolean} [params.hideVideo=false] Enable to selectively hide the video, while leaving letterboxing visible.
     * @return {VideoPlayer}
     */
    setup: function(params)
    {
        this.assetId = params.assetId;

        if (params.colorDef === undefined)
        {
            params.colorDef = (GameConfig.COLOR_DEFS && GameConfig.COLOR_DEFS[this.assetId + "_background"] ? this.assetId : this.settingsPrefix) + "_background";
        }
        if (params.rotation && this.getRemoteSetting("orientationLock"))
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "video: orientationLock controls the rotation, and is not compatible with a rotation specified in setup");
        }

        this.audioSupported = TGE.AudioManager.GetInstance().pluginType() !== "NoAudio";
        if (!this.audioSupported)
        {
            params.muted = true;
        }

        TGE.VideoPlayer.superclass.setup.call(this, params);

        if (params.muted !== undefined)
        {
            TGE.VideoPlayer.State.muted = params.muted;
        }
        else if (TGE.VideoPlayer.State.muted === undefined)
        {
            TGE.VideoPlayer.State.muted = TGE.AudioManager.GetInstance().isMuted();
        }

        this._playPromise = null;		// the Promise from any play() call
        this.paused = true;             // tracks the desired play/pause state
        this.completed = false;
        this.firstPlay = true;
        this.frameCache = null;
        this.cacheTime = -1;
        this._mVolume = params.volume !== undefined ? params.volume : this.getRemoteSetting("volume");
        this.muteStyle = (!this.audioSupported && !TGE.InCreativeBuilder()) ? "none" : params.muteStyle || this.getRemoteSetting("muteStyle");
        if (params.muted && params.muteStyle === "none")
        {
            this.muteStyle = "muted";       // stay muted, with no touch unmute
        }
        this.muteColor = params.muteColor || "#ffffff";
        this.muteThickness = params.muteThickness || 0.5;
        this.muteSync = params.muteSync !== false;
        this.aspectHandling = params.aspectHandling || (this.getRemoteSetting("noCropping") ? "letterbox" : "crop");
        this.skipCountdown = params.skipCountdown || 0;
        this.suspendOnRemove = !!params.suspendOnRemove;
        this.hideVideo = typeof params.hideVideo === "boolean" ? params.hideVideo : false;
        this._skipable = true;
        this._prevFrameTime = 0;
        this._prevEventTime = 0;
        this._progressEvent = 0;
        this._locationEvent = -1;
        this.loop = !!params.loop;
        this._loopStart = -1;
        this._loopEnd = -1;
        this._loopDir = 0;
        // this._loopPingPong = false;      // disabled for now, due to poor Android performance
        // this._loopTime = 0;
        // this._loopDateStamp = 0;

        this.videoScale = 1;
        this.xPosition = 0.5;
        this.yPosition = 0.5;

        this.blurAmountBase = 1920; // This number is mostly arbitrary. It's set so that Blurring looks consistent across various sizes of source assets

        if (params.assetId)
        {
            // video asset
            this.video = TGE.Game.GetInstance().assetManager.getAsset(params.assetId, false);
            if (this.video)
            {
                if (params.analytics !== undefined)
                {
                    TGE.VideoPlayer.Analytics = params.analytics;
                }
                else if (!TGE.VideoPlayer.Analytics)
                {
                    TGE.VideoPlayer.Analytics = params.assetId;
                }

                var wrapper = this.wrapper = TGE.VideoPlayer.Wrappers[this.assetId];
                this.wrapper._videoPlayer = this;
                
                if (TGE.VideoPlayer.State._unlockFunction)
                {
                    this.stage.removeEventListener("mousedown", TGE.VideoPlayer.State._unlockFunction);
                    this.stage.removeEventListener("mouseup", TGE.VideoPlayer.State._unlockFunction);
                    TGE.VideoPlayer.State._unlockFunction = null;
                }
                // if there's no mute button, add an audio unlock on any interaction
                if (this.muteStyle === "none" && this.audioSupported)
                {
                    TGE.VideoPlayer.State._unlockFunction = function(e) {
                        this.log("_unlockFunction " + e.type + " -- current video/wrapper states: " + this.video.muted + " " + TGE.VideoPlayer.State.muted);

                        // NOTE: checking muteStyle again, since it can change in CB
                        if ((this.video.muted || TGE.VideoPlayer.State.muted) && this.muteStyle === "none")
                        {
                            this.mute(false);
                        }
                    }.bind(this);

                    this.log("adding _unlockListeners");
                    this.stage.addEventListener("mousedown", TGE.VideoPlayer.State._unlockFunction);
                    this.stage.addEventListener("mouseup", TGE.VideoPlayer.State._unlockFunction);
                }

                // set looping behavior
                if (params.loop || (params.loop !== false && this.getRemoteSetting("videoUpload")))
                {
                    this.video.setAttribute("loop", "");
                }
                else
                {
                    this.video.removeAttribute("loop");
                }

                // pause/resume on deactivation
                this.addEventListener("deactivate", wrapper._onDeactivate.bind(wrapper));
                this.addEventListener("activate", wrapper._onActivate.bind(wrapper));

                // continue setup after our container has a valid size
                this.addEventListener("addedToStage", this._onValidSize.bind(this, params), {oneShot: true});
            }

            this.videoContainer = this.addChild(new TGE.DisplayObjectContainer().setup({}));

            // will mirror videoContainer, but layered above it
            this.topContainer = this.addChild(new TGE.DisplayObjectContainer().setup({}));

            this.videoContainer.layout = function () {
                var vp = this.parent;
                var w = vp.width, h = vp.height;

                // position in the center
                this.x = vp.topContainer.x = w * (0.5 - vp.registrationX);
                this.y = vp.topContainer.y = h * (0.5 - vp.registrationY);

                var video = vp.video;
                if (video)
                {
                    var videoW = video.videoWidth;
                    var videoH = video.videoHeight;

                    // check for orientation lock, and the need for video rotation
                    this.rotation = 0;
                    if (vp.getRemoteSetting("orientationLock") && videoW && videoH)
                    {
                        if ((w > h) !== (videoW > videoH))
                        {
                            // swap orientation to match video aspect
                            this.rotation = this.stage.isLandscape() ? -90 : 90;
                            var tmp = w;
                            w = h;
                            h = tmp;
                        }
                    }
                }
                this.width = w;
                this.height = h;

                // set topContainer to matching layout
                vp.topContainer.width = w;
                vp.topContainer.height = h;
                vp.topContainer.rotation = this.rotation;

                // recalculate video draw properties
                vp._resizeVideo();
            }
        }

        return this;
    },

    _onValidSize: function(params)
    {
        if (this.getRemoteSetting("letterboxStyle") === "blurred") this._setupLetterboxBlur();

        // NOTE: unusual binding for the drawbegin on videoContainer, but 'this' bound to the VideoPlayer
        this.videoContainer.addEventListener("drawbegin", this._drawVideo.bind(this));
        this.addEventListener("remove", this._onRemove);
        this.addEventListener("update", this._onUpdate);

        if (params.autoplay && !TGE.Game.IsViewable())
        {
            // if video should begin playing, we will start that on "game viewable" event
            TGE.Game.AddEventListener("tgeGameViewable", this.play.bind(this));

            this.play(true);
        }
        else
        {
            this.play(!params.autoplay);

            if (this.getRemoteSetting("previewVideoCropping"))
            {
                this.addEventListener("resize", this.setLocation);
                this.setLocation();
            }
        }

    },

    log: function(msg)
    {
        TGE.VideoPlayer.Log("video: [" + this.assetId + "] " + msg);
    },

    /**
     * Registers a single event listener on a single target.
     * @param {String} type A string representing the event type to listen for.
     * @param {Function} listener The object that receives a notification when an event of the specified type occurs. This must be a JavaScript function.
     * @param {Object} [options]
     * @param {Boolean} [options.oneShot] Auto-remove this listener after the first time it is called.
     * @param {TGE.DisplayObject} [options.onRemove] Remove this listener if the specified object is removed from the scene.
     * @return {Number} A unique id to identify the listener (used when calling removeEventListener).
     */
    addEventListener: function(type, listener, options)
    {
        TGE.VideoPlayer.superclass.addEventListener.call(this, type, listener, options);

        if (TGE.VideoPlayer.LoadEvents.indexOf(type) >= 0)
        {
            // for one-time load events, see if the event has already happened
            if (this.wrapper.eventCounts[type])
            {
                listener.call();
                // need to remove the listener, if it's oneShot
                if (options && options.oneShot)
                {
                    this.removeEventListener(type, listener);
                }
            }
        }
    },

    /**
     * Set the video to a paused state, at a specified location
     * (If not specified, uses remote setting VideoPlayer_location)
     * @param {Number} [location] fractional location 0-1 within the video
     * @param {Function} [cb] optional callback to fire when the video reports the "seeked" event
     */
    setLocation: function(location, cb)
    {
        if (typeof location !== "number")
        {
            location = this.getRemoteSetting("location");
        }

        if (this.video.duration)
        {
            this.pause();
            this.seek(location * this.video.duration, cb);
        }
        else
        {
            // if video is not yet loaded, this needs to set up an event to wait for it
            this.addEventListener("oncanplaythrough", this.setLocation.bind(this, location, cb), { oneShot: true });
        }
    },

    /**
     * Set a specific location in the video to dispatch a "location" event
     * when playback reaches that point.
     * @param {Number} location fractional location 0-1 within the video
     */
    setLocationEvent: function(location)
    {
        if (location < 0 || location > 1)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "video: setLocationEvent should be a fraction value 0-1");
            return;
        }

        this._locationEvent = location !== undefined ? location : -1;
    },

    /**
     * Sets two locations to set up a looping section when the video reaches that point
     * @param {Number} location1 fractional location 0-1 for the start of the loop
     * @param {Number} location2 fractional location 0-1 for the end of the loop
     */
    // * @param {Boolean} [pingPong] if true, loop plays forwards/backwards in ping-pong style
    setLoopPoints: function(location1, location2)
    {
        if (location1 < 0 || location1 > 1 || location2 < 0 || location2 > 1 || location2 < location1)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "video: setLoopPoints invalid, need to be fractions 0-1, with location2 > location1");
            return;
        }

        this.log("setLoopPoints: " + location1 + " " + location2);
        this._loopStart = location1 !== undefined ? location1 : -1;
        this._loopEnd = location2 !== undefined ? location2 : -1;
        // Currently unsupported due to poor performance on Android
        // this._loopPingPong = !!pingPong;
        this._loopDir = (this._loopEnd > 0) ? 1 : 0;    // set to zero if no valid looping
    },

    play: function(pauseState)
    {
        var self = this;
        var video = this.video;
        if (video && this.paused)
        {
            this.paused = pauseState === true;
            if (!this.paused && this._progressEvent === 0)
            {
                this._logProgress(0);
            }
            this.completed = false;
            this._destroyFrameCache();
            this._prevEventTime = 0;
            this._skipable = (this.skipCountdown === 0);
            video.muted = this.shouldBeMuted() || this.paused;      // start muted if we're going to be paused anyway
            this.volume = this._mVolume;

            if (this._playPromise && this.video.currentTime === 0)
            {
                this.log("play with already-pending Promise, just setting muted: " + TGE.VideoPlayer.State.muted + " pauseState: " + this.paused);
                // we're already playing, so just let the Promise continue
                return this._playPromise;
            }
            else
            {
                this._setCurrentTime(0);
                this.log("play with muted: " + TGE.VideoPlayer.State.muted + " pauseState: " + this.paused);
                return this._play("play");
            }
        }
    },

    _play: function(msg)
    {
        var self = this;
        var video = this.video;
        if (!this.paused)
        {
            this.wrapper._playTime = new Date().getTime();
        }

        if (this._playPromise)
        {
            this.log("skipping play, with previous Promise unresolved");
        }
        else
        {
            this._playPromise = video.play();
            if (this._playPromise)
            {
                this._playPromise.then(function() {
                    self._playPromise = null;
                    self.log("Promise resolved with pause state: " + video.paused);
                    if (self.paused !== video.paused)
                    {
                        if (self.paused)
                        {
                            // we had to call play() to trigger the loading on mobile, but we actually want to be paused
                            video.pause();
                        }
                        else if (self.firstPlay)
                        {
                            // we're supposed to be playing now, but we only do this once to avoid VUN-18
                            self.firstPlay = false;
                            self._play("promise")
                        }
                    }
                }).catch(function(e) {
                    self._playPromise = null;
                    // SCR-27 even though we played muted above, an immediate pause state will still throw a "play interrupted" exception, so we don't want to show that
                    if (!self.paused)
                    {
                        if (!video.muted)
                        {
                            self.log(msg + " failed, switching to muted: " + e);
                            self.mute(true);
                            video.play();
                        }
                        else
                        {
                            self.log(msg + " failed: " + e);
                        }
                    }
                    else
                    {
                        self.log("play with pauseState caught: " + e);
                    }
                });
            }
        }
        return this._playPromise;
    },

    resume: function()
    {
        this.volume = this._mVolume;
        if (this.paused)
        {
            this.paused = false;
            this._resume("resume()");
        }
    },

    _resume: function(msg)
    {
        if (this.video && this.video.paused && this.width && this.height)
        {
            this.log("_resume via " + msg);
            return this._play(msg);
        }
    },

    pause: function()
    {
        this.log("pause, from current state: " + this.paused);
        if (!this.paused)
        {
            this.paused = true;
            this._pause();
        }
    },

    _pause: function()
    {
        // NOTE: if we're in the middle of a play Promise, the `.then` method of the promise will take care of the pause state
        if (this.video && !this.video.paused && !this._playPromise)
        {
            this.video.pause();
        }
    },

    /**
     * If you no longer need this video, and playback wasn't yet complete, this will suspend any further loading
     * NOTE: when suspended, the video will no longer have valid properties for things like w/h, duration, etc.
     */
    suspend: function()
    {
        if (this.video)
        {
            this.stop();
            this._destroyFrameCache();
            TGE.VideoPlayer.Suspend(this.assetId);
        }
    },

    /**
     * Restore loading of a suspended video
     */
    unsuspend: function(cb)
    {
        if (this.video && this.video.getAttribute("preload") === "none")
        {
            this.log("unsuspend");
            this.addEventListener("canplaythrough", cb, {oneShot: true});
            this.video.setAttribute("preload", "auto");
            this.video.load();
        }
        else
        {
            cb.call(this);
        }
    },

    /**
     * For detecting externally paused video when it's still supposed to be playing
     * - browser "tap on pause" behavior
     * - game pause/resume from ISI panel, or CB preview pause button
     * @private
     */
    _onUpdate: function()
    {
        var video = this.video;

        if (this.paused)
        {
            // INV-87 send the locationEvent for '0' even if we're paused
            if (this._locationEvent === 0)
            {
                this._locationEvent = -1;
                this._sendEvent("location");
            }
        }
        else
        {
            // progress events
            this._checkProgress();

            // location event
            var currentTime = video.currentTime;
            var frac = currentTime / video.duration;
            // NOTE: _locationEvent=1 is handled in _onComplete(), so it always triggers before the "complete" event
            if (this._locationEvent >= 0 && this._locationEvent !== 1 && frac >= this._locationEvent)
            {
                this._locationEvent = -1;
                this._sendEvent("location");
            }

            // looping (NOTE: _loopEnd=1 is handled in _onComplete)
            if (this._loopDir > 0)
            {
                var dt = currentTime - this._prevFrameTime;
                this._prevFrameTime = currentTime;
                // we don't want to display any frames past the loop point, so trigger if the next frame update is likely to exceed that point
                frac += dt / video.duration;
                if (frac > this._loopEnd)
                {
                    this._loop();
                }
            }
        }

        var audioMgr = TGE.Game.GetInstance().audioManager;
        // sync the audioManager with the video mute button, either when we're in creative builder, or muteSync is set
        // INV-12 Also, suspend mute sync once we're inside PB
        if ((TGE.InCreativeBuilder() || this.muteSync) && (!window.PromoBuilder || !PromoBuilder._sInstance) && (!audioMgr.isMuted() || !TGE.InCreativeBuilder()))
        {
            audioMgr._mPlugin.mute(TGE.VideoPlayer.State.muted, audioMgr.volume);
        }
    },

    stop: function()
    {
        this.pause();
        this.removeEventListenersFor("seeked");
        this.setLoopPoints();
        // this.video.currentTime = 0;
    },

    seek: function(offset, cb)
    {
        this.volume = this._mVolume;
        this._seek(offset, cb);
    },

    _seek: function(offset, cb)
    {
        if (this.video)
        {
            if (offset > this.video.duration)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "video: seek offset > duration");
                return;
            }

            if (typeof cb === "function")
            {
                this.addEventListener("seeked", cb, { oneShot: true });
            }

            this.log("seek to: " + offset);
            this.completed = false;
            this._destroyFrameCache();
            this._setCurrentTime(offset);
        }
    },

    mute: function(state)
    {
        if (this.video)
        {
            this.log("set mute: " + state + " -- current video/wrapper states: " + this.video.muted + " " + TGE.VideoPlayer.State.muted);
            this.video.muted = TGE.VideoPlayer.State.muted = (state !== false);
            this.handleEvent({type: "mute", muted: TGE.VideoPlayer.State.muted});
            if (this.muteSync)
            {
                // mute the game audio without actually changing the AM static mute
                var audioMgr = TGE.Game.GetInstance().audioManager;
                audioMgr._mPlugin.mute(TGE.VideoPlayer.State.muted, audioMgr.volume);
            }
        }
    },

    shouldBeMuted: function()
    {
        var audioMgr = TGE.AudioManager.GetInstance();
        if (audioMgr.isMuted())
        {
            TGE.VideoPlayer.State.muted = true;
        }
        else if (this.muted !== undefined)
        {
            TGE.VideoPlayer.State.muted = this.muted;
        }
        else
        {
            var canPlayAudio = audioMgr.canPlayAudio() || (audioMgr.pluginType() === "WebAudioAPI" && audioMgr._mPlugin._mContext.state === "running");
            TGE.VideoPlayer.State.muted = TGE.VideoPlayer.State.muted || !(TGE.Game.GetInstance().timeSinceLastInteraction() || canPlayAudio);
        }

        return TGE.VideoPlayer.State.muted;
    },

    /**
     * Given a prefix with *X, *Y [, *Width, *Height] fractional remote settings (relative to video size), this returns a rectangle in screen coordinates
     * @param {String} [remoteSettingPrefix] if not specified, returns the safeZone defined by the VideoPlayer settings
     * @param {Boolean} [useMajorAxis] if true, both w/h fractions are based on the same major axis size (as opposed to fractions of each respective axis)
     * @returns {TGE.Rectangle}
     */
    getScreenRect: function(remoteSettingPrefix, useMajorAxis)
    {
        if (!remoteSettingPrefix)
        {
            remoteSettingPrefix = this.assetId + "_safeZone";
            if (!TGE.RemoteSettings.HasSetting(remoteSettingPrefix + "X"))
            {
                remoteSettingPrefix = this.settingsPrefix + "_safeZone";
            }
        }
        var videoContainer = this.videoContainer;
        var videoW = this.video.videoWidth || videoContainer.width;
        var videoH = this.video.videoHeight || videoContainer.height;
        var cx = TGE.RemoteSettings(remoteSettingPrefix + "X") - this.xPosition;
        var cy = TGE.RemoteSettings(remoteSettingPrefix + "Y") - this.yPosition;

        var x = cx * videoW * this.videoScale;
        var y = cy * videoH * this.videoScale;
        var size = Math.max(videoW, videoH) * this.videoScale;
        var w, h;
        if (TGE.RemoteSettings.HasSetting(remoteSettingPrefix + "Width"))
        {
            w = TGE.RemoteSettings(remoteSettingPrefix + "Width") * (useMajorAxis ? size : videoW * this.videoScale);
            h = TGE.RemoteSettings(remoteSettingPrefix + "Height") * (useMajorAxis ? size : videoH * this.videoScale);
        }
        else
        {
            w = h = 0;      // return position, only
        }

        // clamp display rect to the outer boundaries
        var maxW = Math.min(videoW * this.videoScale, videoContainer.width) / 2;      // registration is in the center, so coords should be within +/- half the dimensions
        var maxH = Math.min(videoH * this.videoScale, videoContainer.height) / 2;
        var edge, excess;
        edge = x - w / 2;
        if (edge < -maxW)
        {
            excess = -maxW - edge;
            w -= excess;
            x += excess / 2;
            edge = -maxW;
        }
        if (edge + w > maxW)
        {
            excess = edge + w - maxW;
            w -= excess;
            x -= excess / 2;
        }

        edge = y - h / 2;
        if (edge < -maxH)
        {
            excess = -maxH - edge;
            h -= excess;
            y += excess / 2;
            edge = -maxH;
        }
        if (edge + h > maxH)
        {
            excess = edge + h - maxH;
            h -= excess;
            y -= excess / 2;
        }

        return new TGE.Rectangle(x, y, w, h);
    },

    _setCurrentTime: function (t)
    {
        this._prevFrameTime = t;
        if (this.video.currentTime !== t)
        {
            this.video.currentTime = t;
        }
    },

    // returns whether the video is close to completion
    _nearEnd: function()
    {
        return !this.paused && this.video.duration - this.video.currentTime < 0.1;
    },

    _setupLetterboxBlur: function()
    {
        var blurAmount = this._getBlurAmount();

        this.blurHelper = new TGE.BlurHelper({
            width: this.width / 2,
            height: this.height / 2,
            blurAmount: blurAmount,
            fillToEdge: true
        });
    },

    _getBlurAmount: function()
    {
        var blurBaseSize = (this.width > this.height) ? this.width : this.height;
        var blurAmount = this.getRemoteSetting("blurAmount");
        if (TGE.BrowserDetect.onAndroid && blurAmount > 100)
        {
            // using a reduced blur amount to avoid the INV-108 mopub delay
            blurAmount = 100;
        }
        return blurAmount / this.blurAmountBase * blurBaseSize;
    },

    _resizeVideo: function()
    {
        var sx, sy, sw, sh, min, max, scaleX, scaleY;
        var src = this.video
        var videoW = src.videoWidth;
        var videoH = src.videoHeight;
        var videoContainer = this.videoContainer;
        var w = videoContainer.width, h = videoContainer.height;

        if (!videoW || !videoH || !w || !h)
        {
            // media not yet loaded
            return;
        }

        if (this.getRemoteSetting("letterboxStyle") === "blurred" && this.blurHelper)
        {
            this.blurHelper.blurAmount = this._getBlurAmount();
        }

        // by default, draw the whole source video
        sw = videoW;
        sh = videoH;

        if (this.aspectHandling === "letterbox" || (!this.getRemoteSetting("zoomedPreview") && this.getRemoteSetting("previewVideoCropping")))
        {
            // determine scale to draw the video, as the min of the x/y axes
            scaleX = w / sw;
            scaleY = h / sh;
            this.videoScale = Math.min(scaleX, scaleY);

            // draw full video into center of destination
            this.xPosition = 0.5;
            this.yPosition = 0.5;
        }
        else    // cropping
        {
            // figure out the dimensions of what we need to keep visible
            if (this.getRemoteSetting("useSafeZone"))
            {
                sw *= this.getRemoteSetting("safeZoneWidth");
                sh *= this.getRemoteSetting("safeZoneHeight");
            }

            // determine video scaling that will fit our needed w/h
            // (including extra Math.max check to not over-zoom past what it takes to fill the screen)
            scaleX = w / sw;
            scaleY = h / sh;
            this.videoScale = Math.min(scaleX, scaleY, Math.max(w / videoW, h / videoH));

            // now that the scaling is set, determine the final bounds of the area that we can draw,
            // which is determined by the container size at our target scale
            sw = Math.max(sw, Math.min(videoW, Math.ceil(w / this.videoScale)));
            sh = Math.max(sh, Math.min(videoH, Math.ceil(h / this.videoScale)));

            // center x/y position, clamped to stay within the video bounds
            min = sw * 0.5;
            max = videoW - min;
            sx = TGE.Math.Clamp(videoW * this.getRemoteSetting("safeZoneX"), min, max);
            this.xPosition = sx / videoW;

            min = sh * 0.5;
            max = videoH - min;
            sy = TGE.Math.Clamp(videoH * this.getRemoteSetting("safeZoneY"), min, max);
            this.yPosition = sy / videoH;
        }

        // redraw cropping safe zone to match video sizing
        if (this.overlay)
        {
            this.overlay.reapplyLayout();
        }
    },

    // NOTE: this is the drawbegin for the videoContainer object, even though 'this' points to the VideoPlayer
    _drawVideo: function (e)
    {
        // VUN-38 TODO this shouldn't be needed every draw, but something throws the scaling off when it's not here
        this._resizeVideo();

        var sx, sy, sw, sh, dx, dy, dw, dh;
        var ctx = e.canvasContext;
        var src = this.video
        var videoW = src.videoWidth;
        var videoH = src.videoHeight;
        var videoContainer = this.videoContainer;
        var w = Math.ceil(videoContainer.width), h = Math.ceil(videoContainer.height);
        var scale = this.videoScale;

        // iOS has some kind of reset bug, where the video will return to time index 0, if there were no touch actions
        // so we have to cache the final video frame, and render that instead
        if (this.frameCache || ((TGE.BrowserDetect.oniOS || TGE.BrowserDetect.browser==="Safari") && !TGE.Game.GetInstance().timeSinceLastInteraction() && !this.loop && this._nearEnd()))
        {
            this._createFrameCache();
            if (videoW && videoH && !this.completed && src.currentTime > this.cacheTime)
            {
                // update cache as long as the video is still playing
                this._updateFrameCache();
            }
            // draw from the cache
            src = this.frameCache;
        }

        // fill with the letterbox color, since safe-zone cropping can still result in letterboxing
        ctx.fillStyle = this.backgroundColor || "black";
        ctx.fillRect(0, 0, w, h);

        if (!videoW || !videoH)
        {
            // media not yet loaded, so just exit with blank fill
            return;
        }

        // A decent amount of this is duplicated from normal video drawing and might be worth cleaning up
        if (this.getRemoteSetting("letterboxStyle") === "blurred")
        {
            if (TGE.InCreativeBuilder()) {
                this.blurHelper.blurAmount = this._getBlurAmount();
            }
            this.blurHelper.applySizes(this.width, this.height);

            // by default, draw the whole source video
            sw = videoW;
            sh = videoH;

            if (this.aspectHandling === "letterbox" || (!this.getRemoteSetting("zoomedPreview") && this.getRemoteSetting("previewVideoCropping")))
            {
                // draw full video into center of destination
                sx = 0;
                sy = 0;
            }
            else    // cropping
            {
                // source position for the video draw
                sx = this.xPosition * videoW;
                sy = this.yPosition * videoH;

                // w/h portion that we'll be drawing, limited by the container size at our target scale
                sw = Math.min(Math.min(sx, videoW - sx) * 2, Math.ceil(w / scale));
                sh = Math.min(Math.min(sy, videoH - sy) * 2, Math.ceil(h / scale));

                // subtract 1/2 w/h to get the source x/y render coords
                sx = (sx - sw * 0.5) | 0;     // using "| 0" to convert to int
                sy = (sy - sh * 0.5) | 0;
            }

            this.blurHelper.drawBlurredImage(
                src, ctx,
                sx, sy, sw, sh,
                0, 0, w, h
            );
        }

        if (!this.hideVideo) {
            // by default, draw the whole source video
            sw = videoW;
            sh = videoH;

            if (this.aspectHandling === "letterbox" || (!this.getRemoteSetting("zoomedPreview") && this.getRemoteSetting("previewVideoCropping"))) {
                // draw full video into center of destination
                dw = Math.ceil(sw * scale);
                dh = Math.ceil(sh * scale);
                dx = (w - dw) >> 1;
                dy = (h - dh) >> 1;

                ctx.drawImage(src, dx, dy, dw, dh);
            } else    // cropping
            {
                // source position for the video draw
                sx = this.xPosition * videoW;
                sy = this.yPosition * videoH;

                // w/h portion that we'll be drawing, limited by the container size at our target scale
                sw = Math.min(Math.min(sx, videoW - sx) * 2, Math.ceil(w / scale));
                sh = Math.min(Math.min(sy, videoH - sy) * 2, Math.ceil(h / scale));

                // subtract 1/2 w/h to get the source x/y render coords
                sx = (sx - sw * 0.5) | 0;     // using "| 0" to convert to int
                sy = (sy - sh * 0.5) | 0;

                // destination size we're drawing
                dw = Math.min(Math.ceil(sw * scale), w);
                dh = Math.min(Math.ceil(sh * scale), h);

                // position where to draw
                dx = (w - dw) >> 1;
                dy = (h - dh) >> 1;

                var version = parseInt(TGE.BrowserDetect.OSversion.match(/\d+$/)[0], 10);
                if (!TGE.BrowserDetect.oniOS || version > 12) {
                    // most platforms can crop directly from the video buffer
                    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
                } else {
                    // old versions of iOS Safari crash when trying to crop directly, so we need a different approach

                    // set up mask region for the video area
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, this.videoContainer.rotation ? this.height : this.width, this.videoContainer.rotation ? this.width : this.height);
                    ctx.clip();

                    if (version < 10) {
                        // iOS < 10 still crashes on the work-around, so just draw the full image
                        ctx.drawImage(src, dx, dy, dw, dh);
                    } else {
                        // draw the video scaled, and rely on clip rect to do the cropping
                        sw = videoW * scale;
                        sh = videoH * scale;
                        sx *= -scale;
                        sy *= -scale;
                        sx += dx;
                        sy += dy;
                        ctx.drawImage(src, sx | 0, sy | 0, sw | 0, sh | 0);
                    }
                    ctx.restore();
                }
            }
        }

        // our synthesized event for "frame is rendered"
        this.wrapper._onVideoEvent({type: "rendered"});

        // only perform pause sync checks when we're not in a pending play Promise
        if (!this._playPromise)
        {
            var video = this.video;
            if ((!(TGE.Game.GetUpdateRoot().stage instanceof TGE.GameStage) && !this.paused) || (this.paused && !video.paused))
            {
                // pause video if the update root has been changed externally (creative builder preview pause, or ISI panel opened)
                // also pause if the VideoPlayer thinks we should be paused, but the video itself is still playing. (Happened only on some iOS devices, where video kept playing after completion)
                if (this.paused && !video.paused)
                {
                    this.log("pause due to sync mismatch");
                }
                this._pause();
            }
            else if (!this.paused && !this.completed && !this._nearEnd())
            {
                // video is supposed to be playing, so let's see if it really is
                // Due to apparent errors in iOS reporting an accurate paused state, we'll just rely on the watchdog timer
                // if (video.paused)
                // {
                // 	this._resume("pause mismatch");
                // }
                // else
                {
                    // INV-15 on the mouseup of the initial tap, iOS will pause the video, but not generate a "pause" event,
                    // nor set paused:true in the video element. So we need a second check here, based on whether we've received timeUpdate
                    if (this.wrapper._playTime)
                    {
                        // if we haven't received timeUpdate after a threshold, then we assume the video is stuck
                        var now = new Date().getTime();
                        var watchdogTimer = TGE.RemoteSettings.HasSetting("VideoPlayer_watchdogTimer") ? TGE.RemoteSettings("VideoPlayer_watchdogTimer") : 500;
                        if (now > this.wrapper._playTime + watchdogTimer)
                        {
                            this.log("watchdog playTime: " + this.wrapper._playTime + ", now: " + now);
                            this._play("watchdog");
                        }
                    }
                }
            }
        }
    },

    _createFrameCache: function()
    {
        if (!this.frameCache)
        {
            this.log("creating frameCache at currentTime: " + this.video.currentTime);
            this.frameCache = document.createElement('canvas');
            this.cacheTime = -1;
        }
    },

    _destroyFrameCache: function()
    {
        if (this.frameCache)
        {
            this.log("destroy frameCache");
            this.frameCache.remove();
            this.frameCache = null;
        }
    },

    _updateFrameCache: function()
    {
        var video = this.video;
        var canvas = this.frameCache;

        this.cacheTime = video.currentTime;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ct = canvas.getContext('2d');
        ct.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    },

    _loop: function()
    {
        // send location event if it's within the loop zone, but we didn't reach it yet
        // (which can happen if it's at or near _loopEnd)
        if (this._locationEvent >= 0 && this._locationEvent !== 1 && this._locationEvent <= this._loopEnd)
        {
            this._locationEvent = -1;
            this._sendEvent("location");
        }

        // same thing for progress events at or near the end of the loop zone
        if (this._progressEvent / 100 <= this._loopEnd)
        {
            this._logProgress(this._progressEvent);
        }

        if (!this.getRemoteSetting("audioDuringLoop"))
        {
            // TODO fade-out before we get to this point
            this.volume = 0;
        }
        this._sendEvent("loop");

        // in case the "loop" listener stopped the loop, see if it's still active
        if (this._loopDir > 0)
        {
            // if (!this._loopPingPong)
            {
                this._loopDir = 0;      // disable loop flag during seek, so it won't trigger again
                this._seek(this._loopStart * this.video.duration, function() {
                    // INV-31 #3 need to check if looping is still active, since it could have been cleared before the callback came in
                    if (this._loopEnd > 0)
                    {
                        this._loopDir = 1;
                    }
                }.bind(this));
            }
/*
            else
            {
                // NOTE: Although a -1 playback rate is allowed by the spec, most browsers
                // do not yet support it. Safari did, but performance was considerably worse
                // than the seek-based method implemented here
                this._loopDir = -1;
                this._loopTime = this.video.currentTime;
                this._loopDateStamp = 0;
                this.paused = true;
                this._pause();
                this._stepBackwards();
            }
*/
        }
    },

    /**
     * Implementation of reverse playback via iteratively seeking backwards one step at a time
     * @private
     */
/*
    _stepBackwards: function()
    {
        var start = this._loopStart * this.video.duration;
        if (this._loopTime === start)
        {
            this._loopDir = 1;
            this.paused = false;
            this._resume("loop start");
        }
        else
        {
            var dt = 1 / 24;    // default delta time to step
            var now = +new Date();
            if (this._loopDateStamp)
            {
                var elapsed = (now - this._loopDateStamp) / 1000;
                if (elapsed < dt * 0.95)
                {
                    // when the frame is ready faster than the desired playback rate, we'll wait the difference
                    this.performAction({
                        delay: dt - elapsed,
                        action: this._stepBackwards
                    });
                    return;
                }
                else if (elapsed > dt)
                {
                    dt = Math.min(elapsed, 0.15);    // cap on max step time
                }
            }
            this._loopDateStamp = now;
            this._loopTime = Math.max(this._loopTime - dt, start);
            this._seek(this._loopTime, this._stepBackwards);
        }
    },
*/

    _checkProgress: function()
    {
        // progress analytics
        if (this.video.duration && !this.paused)
        {
            var progress = this.video.currentTime / this.video.duration * 100;
            if (progress > this._progressEvent || (progress < 25 && this._progressEvent === 100))
            {
                this._logProgress(this._progressEvent);
            }
        }

        var currentTime = this.video.currentTime | 0;
        if (currentTime !== this._prevEventTime)
        {
            this._prevEventTime = currentTime;
            this._sendEvent("timeupdate");

            if (!this._skipable && this.skipButton)
            {
                if (currentTime >= this.skipCountdown)
                {
                    this._skipable = true;
                    this._sendEvent("skippable");
                }
                else
                {
                    this._sendEvent("skipcountdown", {countdown: this.skipCountdown - currentTime});
                }
            }
        }
    },

    _logProgress: function(progress)
    {
        if (this.assetId === TGE.VideoPlayer.Analytics)
        {
            TGE.Events.logVideoProgress(progress);
            this._progressEvent = progress + 25;
        }
    },

    _sendEvent: function (type, extraProps)
    {
        var event = {
            type: type,
            video: this.video,
            currentTime: this.video.currentTime,
            duration: this.video.duration
        };

        if (extraProps)
        {
            for (var key in extraProps)
            {
                event[key] = extraProps[key];
            }
        }

        // this.log("video event:", type, event.currentTime);
        this.handleEvent(event);
    },

    /**
     * Called when video playback finishes
     * @private
     */
    _onComplete: function(e)
    {
        // check if there's an active loop
        if (this._loopEnd > 0)
        {
            this._loop();
            return;
        }

        this.completed = true;
        this.paused = true;
        if (e !== true && this._progressEvent === 100)
        {
            this._logProgress(100);
        }
        if (this._locationEvent === 1)
        {
            this._locationEvent = -1;
            this._sendEvent("location");
        }
        this._sendEvent("complete", {skipped: e === true});
    },

    /**
     * Called when removed from the scene
     * @private
     */
    _onRemove: function()
    {
        if (!this.paused)
        {
            this.stop();
        }
        if (this.video)
        {
            this._setCurrentTime(0);
        }
        if (!this.completed && this.suspendOnRemove && !TGE.InCreativeBuilder())
        {
            // when removed before completion, suspend any further loading
            this.suspend();
        }

        if (this.wrapper._videoPlayer === this)
        {
            // clear the VP reference, if it hasn't already been updated by a new instance
            // (which happens on replay, since transitionToWindow makes a new GameScreen before the previous one is removed)
            this.wrapper._videoPlayer = null;
        }

        if (this.blurHelper) this.blurHelper.cleanupCanvases()
    },
};

extend(TGE.VideoPlayer, TGE.DisplayObjectContainer);
