/**
 *
 * @param video
 * @param muted
 * @constructor
 */
TGE.VideoWrapper = function(video, muted)
{
    this._video = video;
    this._videoPlayer = null;
    this.muted = muted;        // whether the mute is specified in the GameConstructor asset load

    // Initialized to zero for each event type, and counts up as each event is received.
    // For LoadEvents that only happen once, this can be used to determine if the event has already happened.
    this.eventCounts = {};
    this._initEvents(TGE.VideoPlayer.LoadEvents);
    this._initEvents(TGE.VideoPlayer.PlayEvents);

    // INV-15 on the mouseup of the initial tap, iOS will pause the video, but not generate a "pause" event,
    // nor set paused:true in the video element. So we set up a watchdog timer for timeUpdate events
    this._playTime = 0;

    this._deactivateTime = -1;

};

TGE.VideoWrapper.prototype = {
    _initEvents: function(events)
    {
        for (var i = events.length; --i >= 0; )
        {
            if (events[i] !== "rendered")   // "rendered" is generated from the VP _drawVideo
            {
                this._video.addEventListener(events[i], this._onVideoEvent.bind(this));
            }
        }
        this._clearEventCounts(events);
    },

    _clearEventCounts: function(events)
    {
        for (var i = events.length; --i >= 0; )
        {
            this.eventCounts[events[i]] = 0;
        }
    },

    _onVideoEvent: function(e) {
        var orgCount = this.eventCounts[e.type]++;

        if (!TGE) return;	// ignore events during dashboard preview restart

        // internal load event handling
        switch (e.type)
        {
            case "canplay":
                if (!orgCount)
                {
                    // PAN-1550 need to set muted property on "canplay" event, due to Chrome bug
                    var game = TGE.Game.GetInstance();
                    this._video.muted = this.muted !== undefined ? this.muted : TGE.AudioManager._sMuted || (TGE.InCreativeBuilder() && game && !game.timeSinceLastInteraction());

                    // initial mute status should represent how the video got loaded, such as the PAN-1550 or PAN-1569 adjustments
                    TGE.VideoPlayer.State.muted = this._video.muted;
                    if (this._videoPlayer)
                    {
                        this._videoPlayer.handleEvent({type: "mute", muted: TGE.VideoPlayer.State.muted});
                    }
                }
                break;

        }

        // if there's an active VideoPlayer instance, then process those events
        if (this._videoPlayer)
        {
            if (e.type !== "timeupdate")
            {
                this._videoPlayer.log(e.type + " global callback");
            }

            switch (e.type)
            {
                case "loadstart":
                    // detect video uploads in CB, which restart the video element
                    if (TGE.InCreativeBuilder() && orgCount)
                    {
                        // ignore local session restore
                        if (orgCount === 1 && window.__isLocal && window._CB_SESSION_ && _CB_SESSION_.video[this._videoPlayer.assetId])
                        {
                            break;
                        }

                        // VMG-3 need to unpause the VideoPlayer to show the new upload (if we're not suspended)
                        if (this._video.getAttribute("preload") !== "none")
                        {
                            this._videoPlayer.paused = false;
                        }
                    }
                    break;

                case "metadata":
                    // update layout for new video
                    this._videoPlayer.reapplyLayout();
                    break;

                case "timeupdate":
                    this._playTime = new Date().getTime();
                    break;

                case "ended":
                    this._videoPlayer._onComplete();
                    break;
            }

            this._videoPlayer.dispatchEvent({type: e.type});
        }
    },

    _onDeactivate: function (e) {
        if (!TGE || !this._videoPlayer) return;	// ignore events during dashboard preview restart

        // VID-35 iOS bug resets currentTime to 0, and won't restore it correctly, so need to cache it if the video is at the end
        var vp = this._videoPlayer;
        if ((TGE.BrowserDetect.oniOS || TGE.BrowserDetect.browser==="Safari") && vp.completed && !vp.frameCache)
        {
            vp._createFrameCache();
            vp._updateFrameCache();
        }
        this._deactivateTime = this._video.currentTime;
        if (!this._videoPlayer.paused)
        {
            this._video.pause();
        }
    },
    _onActivate: function (e) {
        if (!TGE || !this._videoPlayer) return;	// ignore events during dashboard preview restart

        if (this._deactivateTime >= 0)
        {
            this._videoPlayer.log("setting currentTime to: " + this._deactivateTime);
            this._video.currentTime = this._deactivateTime;
            this._deactivateTime = -1;
        }

        this._videoPlayer._playPromise = null;	// VID-63 clear any pending promise
        if (!this._videoPlayer.paused)
        {
            this._videoPlayer._resume("activate");
        }
    },
};
