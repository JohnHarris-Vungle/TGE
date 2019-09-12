
/* This class is internally used by AudioManger */
/** @ignore */
TGE.WebAudioAPIPlugin = function()
{
	TGE.Debug.Log(TGE.Debug.LOG_INFO, "creating WebAudioAPIPlugin...");

	this._mSoundInstances = [];
    this._mFunctioning = false;

	// PAN-574
    this._mUnlockedAudio = !TGE.BrowserDetect.oniOS;

	// Create the context
	this._mContext = null;
	try
	{
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		this._mContext = new AudioContext();

		// FOR TESTING simulate new autoplay policy
		// this._mContext.suspend();

		// PAN-1194 Chrome autoplay policy will create the AudioContext in a suspended state, and needs to unlock on touch event
		if (this._mContext.state === "suspended")
		{
			this._mUnlockedAudio = false;
		}

		// Maintain backward compatibility with older versions of web audio API
        this._backwardCompatibility();

        // Create master volume gain and compressor nodes that all audio will travel through
        this._mMasterCompressorNode = this._mContext.createDynamicsCompressor();
        this._mMasterCompressorNode.connect(this._mContext.destination);
        this._mMasterGainNode = this._mContext.createGain();
        this._mMasterGainNode.connect(this._mMasterCompressorNode);

        this._mVolume = 1;

        // PAN-964
		Object.defineProperty(this, "volume", {
		    get: function () {
		        return this._mVolume;
	        },
	        set:function(vol)
	        {
	            this._mVolume = vol;
	            if (this._mMasterGainNode)
	            {
	                this._mMasterGainNode.gain.value = vol;
	            }
	        }
	    });

        this._mFunctioning = true;
	}
	catch(e)
	{
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "error creating WebAudio context: " + e.toString());
		return;
	}
}


TGE.WebAudioAPIPlugin.prototype =
{
	type: function()
	{
		return "WebAudioAPI";
	},

    playSound: function(id,volume,looping)
    {
        if(!this._mFunctioning)
        {
            return;
        }

        // Create it
        var soundInstance = new TGE.WebAudioAPIPlugin.SoundInstance(this);
	    if(!soundInstance.init(id,looping))
        {
            return null;
        }

	    // Track it
	    this._mSoundInstances.push(soundInstance);

	    // Play it
	    soundInstance.play(volume,looping);

	    // If the sound isn't looping, we want to clean it up as soon as it's done
	    if(!looping)
	    {
		    soundInstance._mTimeout = setTimeout(soundInstance._cleanup.bind(soundInstance),soundInstance._mBuffer.duration*1000);
	    }

	    return soundInstance;
    },

    mute: function(on,volume)
    {
        if(!this._mFunctioning)
        {
            return;
        }
        
	    this._mMasterGainNode.gain.value = on ? 0 : volume;
    },

	stopAll: function()
	{
		for(var i=0; i<this._mSoundInstances.length; i++)
		{
			this._mSoundInstances[i]._cleanup(false);
		}
		this._mSoundInstances = [];
	},

	pauseAll: function()
	{
		for(var i=0; i<this._mSoundInstances.length; i++)
		{
			this._mSoundInstances[i].pause();
		}
	},

	resumeAll: function()
	{
		for(var i=0; i<this._mSoundInstances.length; i++)
		{
			this._mSoundInstances[i].resume();
		}
	},

	soundDuration: function(id)
	{
		var audioNode = TGE.AssetManager.Get(id);
		var buffer = audioNode ? audioNode.buffer : null;
		return buffer ? buffer.duration : 0;
	},

	// begin PAN-574
	// cannot be called until the stage exists
	// because AudioManager is created before the stage, this is called in TGE.Game upon stage creation
	unlockAudioOnTouch: function()
	{
		this._mTouchListenerDown = TGE.Game.GetInstance().stage.addEventListener ( "mousedown", this.testUnlock.bind ( this ) );
		this._mTouchListenerUp = TGE.Game.GetInstance().stage.addEventListener ( "mouseup", this.testUnlock.bind ( this ) );
	},

	testUnlock: function ()
	{
		if ( this._mUnlockedAudio )
		{
			return;
		}

		if (TGE.BrowserDetect.oniOS)
		{
			// create empty buffer and play it
			var buffer = this._mContext.createBuffer ( 1, 1, 22050 );
			var testSource = this._mContext.createBufferSource ();
			testSource.onended = this.unlockAudio.bind ( this );
			testSource.buffer = buffer;
			testSource.connect ( this._mContext.destination );
			testSource.start ( 0 );
		}
		else if (this._mContext.state === "suspended")
		{
			var self = this;
			this._mContext.resume().then(function() {
				// console.log("audio unlocked");
				self.unlockAudio();
			}).catch(function(e) {
				TGE.Debug.Log(TGE.Debug.LOG_WARNING,"AudioContext.resume() failed: " + e);
			});
		}
	},

	unlockAudio: function ()
	{
		this._mUnlockedAudio = true;
		if (this._mTouchListenerUp)
		{
			TGE.Game.GetInstance().stage.removeEventListener ( "mousedown", this._mTouchListenerDown );
			TGE.Game.GetInstance().stage.removeEventListener ( "mouseup", this._mTouchListenerUp );
			this._mTouchListenerUp = null;
			this._mTouchListenerDown = null;
		}
	},
	// end PAN-574

	_removeInstance: function(instance)
	{
		// Find it and splice it out
		for(var i=0; i<this._mSoundInstances.length; i++)
		{
			if(this._mSoundInstances[i]===instance)
			{
				this._mSoundInstances.splice(i,1);
				return;
			}
		}
	},

	_backwardCompatibility: function()
	{
		// If we're using the new API there's nothing to do
		if(this._mContext.createGain)
		{
			return;
		}

        // Check for uncommon potential failures
        if(!this._mContext || !this._mContext.createGainNode || !this._mContext.createBufferSource)
        {
            TGE.Debug.Log(TGE.Debug.LOG_INFO, "unable to setup WebAudio API backward compatibility mode");
            return;
        }

		TGE.Debug.Log(TGE.Debug.LOG_INFO, "deprecated WebAudio API detected - using backward compatibility mode");

		// Consolidate the createGain method name
		this._mContext.createGain = this._mContext.createGainNode;

		// Add the start/stop methods to the buffer source prototype
		var bufferSource = this._mContext.createBufferSource();
		bufferSource.__proto__.start = bufferSource.__proto__.noteGrainOn;
		bufferSource.__proto__.stop = bufferSource.__proto__.noteOff;
	}
}

/* This class is internally used by AudioManger */
/** @ignore */
TGE.WebAudioAPIPlugin.SoundInstance = function(plugin)
{
	this._mID = null;
	this._mPlugin = plugin;
	this._mBuffer = null;
	this._mAudioNode = null;
	this._mTimeout = null;
	this._mStartedAt = null;
	this._mPausedAt = null;
	this._mVolume = 1;
	this._mLoop = false;

	// PAN-964
	Object.defineProperty(this, "volume", {
	    get: function () {
	        return this._mVolume;
        },
        set:function(vol)
        {
            this._mVolume = vol;
            if (this._mGainNode)
            {
                this._mGainNode.gain.value = vol;
            }
        }
    });
}

TGE.WebAudioAPIPlugin.SoundInstance.prototype =
{
	init: function(id,looping)
	{
		if(!TGE.AssetManager.Exists(id))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Unknown audio id: " + id);
			return false;
		}

		this._mBuffer = TGE.AssetManager.Get(id).buffer;

		if(!this._mBuffer)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Trying to play a sound that didn't load correctly: " + id);
			return false;
		}

		this._mID = id;

		return true;
	},

	play: function(volume,loop)
	{
		this._mVolume = volume;
		this._mLoop = loop;

		try
		{
			this._mAudioNode = this._mPlugin._mContext.createBufferSource();
			this._mAudioNode.buffer = this._mBuffer;
			this._mAudioNode.loop = this._mLoop;

		   // PAN-964
			this._mGainNode = this._mPlugin._mContext.createGain();
            this._mGainNode.gain.value = volume;
			this._mAudioNode.connect(this._mGainNode);
			this._mGainNode.connect(this._mPlugin._mMasterGainNode);

			if(this._mPausedAt)
			{
				this._mAudioNode.start(0,this._mPausedAt,loop ? 3600 : this._mBuffer.duration-this._mPausedAt); // PAN-588, PAN-606
				this._mStartedAt = Date.now()/1000 - this._mPausedAt;
			}
			else
			{
				// Have to pass in all deprecated noteGrainOn arguments to start (iOS8 needs 2, iOS6 needs all 3)
				// And apparently Safari on Mac doesn't work without the default arguments either (PAN-633)
				if(TGE.BrowserDetect.oniOS || TGE.BrowserDetect.browser==="Safari")
				{
					this._mAudioNode.start(0,0,this._mBuffer.duration);
				}
				else
				{
					// This should really be all we need, but only work reliably on Chrome
					this._mAudioNode.start();
				}

				this._mStartedAt = Date.now()/1000;
			}

			this._mPausedAt = null;
		}
		catch(e)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "error playing webaudio buffer: " + e.toString());
		}
	},

	seek: function(offset)
	{
		if (offset > this._mBuffer.duration)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "AudioManager.seek offset > sound duration");
			return;
		}

		if (this._mPausedAt)
		{
			this._mPausedAt = offset;
		}
		else
		{
			this.pause();
			this._mPausedAt = offset;
			this.play();
		}
	},

	stop: function()
	{
		this._cleanup();
	},

	restart: function()
	{
		this._cleanup(false);
		this.play(this._mVolume,this._mLoop);
	},

	pause: function()
	{
		this._mPausedAt = Date.now()/1000 - this._mStartedAt;

		// Account for loops (PAN-606)
		if(this._mPausedAt>this._mBuffer.duration)
		{
			this._mPausedAt = this._mPausedAt - Math.floor(this._mPausedAt/this._mBuffer.duration)*this._mBuffer.duration;
		}

		this._cleanup(false);
	},

	resume: function()
	{
		if(this._mPausedAt)
		{
			this.play(this._mVolume,this._mLoop);
		}
	},

	mute: function()
	{

	},

	unmute: function(volume)
	{

	},

	duration: function()
	{
		return this._mBuffer.duration;
	},

	_cleanup: function(removeInstance)
	{
		// Instance is removed by default
		removeInstance = typeof removeInstance === "undefined" ? true : removeInstance;

		if(this._mAudioNode)
		{
			this._mAudioNode.stop(0);
			this._mAudioNode.disconnect(0);
			this._mAudioNode = null;
		}

		// PAN-964
		if(this._mGainNode)
		{
			this._mGainNode.disconnect(0);
			this._mGainNode = null;
		}

		if(this._mTimeout!==null)
		{
			clearTimeout(this._mTimeout);
			this._mTimeout = null;
		}

		// Remove the instance
		if(removeInstance)
		{
			this._mPlugin._removeInstance(this);
		}
	}
}

