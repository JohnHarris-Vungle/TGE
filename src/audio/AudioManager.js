
/**
 * The TGE.AudioManager is used to playback sounds in your game. The audio manager is created automatically by the TGE.Game instance.
 * @constructor
 */
TGE.AudioManager = function()
{
	// Assign the singleton
	if(TGE.AudioManager._sInstance!==null)
	{
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "you can only create one instance of the TGE.AudioManager");
		return this;
	}
	TGE.AudioManager._sInstance = this;

	// PAN-1120
	// Enabled based on remote setting
	this.enabled = TGE.RemoteSettings ("audio");

 	// PAN-964
    // Public master volume getter/setter
	this._mVolume = 1;
	Object.defineProperty(this, "volume", {
	    get: function () {
	        return this._mVolume;
        },
        set:function(vol)
        {
            this._mVolume = vol;
            if (this._mPlugin)
            {
            	this._mPlugin.volume = vol;
            }
        }
    });	

    // Private members
	this._mMuted = false;
	this._mPlugin = null;

	this._initPlugin();

	// Setup the audio loading plugin to be used by TGE.Loader (if it exists!)
	if(typeof(TGE.Loader)==="function")
	{
		if( this.enabled && this.pluginType()==="WebAudioAPI")
		{
			TGE.Loader.prototype.addAudio = function(id, url1, url2) {
				var soundLoader = new TGE.WebAudioLoader(id, url1, url2);
				this.add(soundLoader);
				return soundLoader.audio;
			};
		}
		else
		{
			TGE.Loader.prototype.addAudio = function(id, url1, url2) {
				var soundLoader = new TGE.NoAudioLoader(id, url1, url2);
				this.add(soundLoader);
				return null;
			};
		}
	}

    return this;
}


TGE.AudioManager._sInstance = null;

/**
 * Returns the single instance of the TGE.AudioManager object. The audio manager is created automatically by the TGE.Game class.
 * The audio manager follows the <a href="http://en.wikipedia.org/wiki/Singleton_pattern">singleton pattern</a>.
 * Using TGE.AudioManager.GetInstance() allows you to retrieve the audio manager from anywhere in the code.
 * @returns {TGE.AudioManager|null} The single instance of the TGE.AudioManager object, or null if an instance of the game has not been created yet.
 */
TGE.AudioManager.GetInstance = function()
{
	return TGE.AudioManager._sInstance;
}

TGE.AudioManager.prototype =
{
	mute: function(on)
	{
		if(on===this._mMuted)
		{
			return;
		}

		this._mMuted = on;
		this._mPlugin.mute(on,this.volume);
	},

	toggleMute: function()
	{
		this.mute(!this._mMuted);
	},

	isMuted: function()
	{
		return this._mMuted;
	},

	playSound: function(id,looping,volume)
	{
        //PAN-564
        if(window.GameConfig && GameConfig.NATIVE_APP && TGE.BrowserDetect.onAndroid && TGE.BrowserDetect.OSversion == "4.2")
        {
            return;
        }
        
		looping = typeof looping === "undefined" ? false : looping;

        //PAN-964
        volume = typeof volume === "number" ? volume : 1;
        
		var instance = this._mPlugin.playSound(id, volume, looping);

		return instance;
	},

	pause: function()
	{
		this._mPlugin.pauseAll();
	},

	resume: function()
	{
		this._mPlugin.resumeAll();
	},

	stop: function()
	{
		this._mPlugin.stopAll();
	},

	pluginType: function()
	{
		return this._mPlugin.type();
	},

	soundDuration: function(id)
	{
		return this._mPlugin.soundDuration(id);
	},

	/**
	 * Creates the audio plugin we'll use to handle sounds and playback
	 * @ignore
	 */
	_initPlugin: function()
	{
		// Try to make a WebAudio plugin
		// PAN-1120 use NoAudio plugin if audio is not enabled
		if( this.enabled && (window.AudioContext || window.webkitAudioContext))
		{
			this._mPlugin = new TGE.WebAudioAPIPlugin();

			// PAN-964
			this._mPlugin.volume = this.volume;
		}
		else
		{
			this._mPlugin = new TGE.NoAudio();
		}
	},

	/**
	 * Stops the sound and destroys any related objects used for playback by the plugin.
	 * @ignore
	 */
	_cleanupSound: function(instance)
	{
		instance._cleanup();
	},

	// PAN-574
	/**
	 * Unlock web audio on iOS touch.
	 * Must be called after stage is created so that a valid object exists to capture touch events.
	 * Because AudioManager is created before the stage, this is called in TGE.Game upon stage creation.
	 * @ignore
	 */
	_unlockAudioOnTouch: function()
	{
		if (this._mPlugin instanceof TGE.WebAudioAPIPlugin)
		{
			this._mPlugin.unlockAudioOnTouch();
		}
	},

	// PAN-574, PAN-1194
	/**
	 * Check if audio is supported, and has been unlocked by user interaction
	 * @returns {boolean}
	 */
	canPlayAudio: function()
	{
		if (this._mPlugin instanceof TGE.WebAudioAPIPlugin)
		{
			return this._mPlugin._mUnlockedAudio === true;
		}
		return false;
	},
	
	// ******************************************************************************************************
	// Deprecated methods used by the old AudioManager - kept alive here for backward compatibility

	/**
	 * Deprecated - use playSound instead.
	 * @ignore
	 */
	Play: function(params)
	{
		// Make the loop parameter a boolean
		params.loop = (params.loop===true || params.loop==="1" || params.loop===1);

		// TODO: need to handle params.callbackFunction
		if(params.callbackFunction)
		{

		}

		this.playSound(params.id,params.loop);
	},

	/**
	 * Deprecated - use soundInstance.pause() instead.
	 * @ignore
	 */
	Pause: function(id)
	{
		// This is pretty hackish for now, it implies there's only one instance per sound, yet the SDK doesn't enforce that
		for(var i=0; i<this._mPlugin._mSoundInstances.length; i++)
		{
			if(this._mPlugin._mSoundInstances[i]._mID===id)
			{
				this._mPlugin._mSoundInstances[i].stop();
				return;
			}
		}

		TGE.Debug.Log(TGE.Debug.LOG_WARNING, "could not find audio to pause: " + id);
	},

	/**
	 * Deprecated - use mute(true/false) instead.
	 * @ignore
	 */
	Mute: function()
	{
		this.mute(true);
	},

	/**
	 * Deprecated - use mute(true/false) instead.
	 * @ignore
	 */
	Unmute: function()
	{
		this.mute(false);
	},

	/**
	 * Deprecated - use toggleMute instead.
	 * @ignore
	 */
	ToggleMute: function()
	{
		this.toggleMute();
	},

	/**
	 * Deprecated - use stop instead.
	 * @ignore
	 */
	StopAll: function()
	{
		this.stop();
	},

	/**
	 * Deprecated - use pause instead.
	 * @ignore
	 */
	PauseAll: function()
	{
		this.pause();
	},

	/**
	 * Deprecated - use resume instead.
	 * @ignore
	 */
	ResumeAll: function()
	{
		this.resume();
	}
}

/**
 * Deprecated - some old games are directly accessing the old mMuted property
 * @ignore
 */
Object.defineProperty(TGE.AudioManager.prototype, 'mMuted', {
	get: function()
	{
		return this.isMuted();
	},

	set: function(value)
	{
		this.mute(value);
	}
});