
/* This class is internally used by AudioManger */
/** @ignore */
TGE.NoAudio = function()
{
	TGE.Debug.Log(TGE.Debug.LOG_INFO, "NoAudio...");
	_mSoundInstances = [];
};

TGE.NoAudio.prototype =
{
	type: function()
	{
		return "NoAudio";
	},

	playSound: function(id,volume,looping)
	{
		return new TGE.NoAudioSoundInstance();
	},

	mute: function(on,volume)
	{
	},

	stopAll: function()
	{
	},

	pauseAll: function()
	{
	},

	resumeAll: function()
	{
	},

	soundDuration: function(id)
	{
		return 0;
	}

};

/** @ignore */
TGE.NoAudioLoader = function(id, url, url2, tags, priority) {
	this.loader = null;
	this.complete = false;

	/** @ignore */
	// called to trigger download
	this.start = function(loader) {
		this.loader = loader;
		this.complete = true;
		loader.onLoad(this);        // return loaded immediately
	};

	/** @ignore */
	// called to check status of image (fallback in case
	// the event listeners are not triggered).
	this.checkStatus = function() {
		if(this.complete === true)
		{
			this.loader.onLoad(self);
		}
	};

	/** @ignore */
	// returns a name for the resource that can be used in logging
	this.getName = function() {
		return url;
	}
};

// PAN-1120
/** @ignore */
// a dummy sound instance with placeholder functions 
// so games work normally when audio is disabled
TGE.NoAudioSoundInstance = function()
{

};

TGE.NoAudioSoundInstance.prototype = {
	init: function (id, looping)
	{
		return true;
	},
	play: function (volume, loop)
	{

	},
    resume: function ()
    {
    },
	restart: function()
	{
	},
	seek: function (offset)
	{

	},
	stop: function ()
	{

	},
	pause: function ()
	{

	},

	mute: function()
	{

	},

	unmute: function (volume)
	{

	},

	duration: function()
	{
		return 0;
	},

	_cleanup: function (removeInstance)
	{

	}
};
