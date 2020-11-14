/** @ignore */
TGE.WebAudioLoader = function(id, url, url2)
{
	this.loader = null;
	this.audio = {};
	this.id = id;
	this.pollCount = 0;

    // PAN-1363 We always want to load the mp3 version now, so if the backup url ends in .mp3, use that instead
    if (url2 && url2.indexOf(".mp3") === url2.length - 4)
    {
        this.url = url2;
    }
    else
    {
	    // Otherwise, force an mp3 extension to cover the case where ogg/mp3 files may have been included in the same directory
	    var a = url.split(".");
	    a[a.length-1] = "mp3";
	    this.url = a.join(".");
    }

	/** @ignore */
	// called to trigger download
	this.start = function(loader)
	{
        // we need the loader ref so we can notify upon completion
        this.loader = loader;

        // set up event handlers so we send the loader progress updates

        // there are 3 possible events we can tell the loader about:
        // loader.onLoad(this);    // the resource loaded
        // loader.onError(this);   // an error occured
        // loader.onTimeout(this); // timeout while waiting

        var that = this;

        var onDecodeSuccess = function(buffer)
        {
            that.audio.buffer = buffer;
            that.loader.onLoad(that);
        };

        var onDecodeError = function()
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "error decoding audio file: " + that.url);
            that.loader.onError(that);
        };

		var url = this.url;

		// Are audio assets packaged?
		if (window._TREAUDIO)
		{
			var parts = url.split("/");
			var filename = parts[parts.length - 1];

			url = _TREAUDIO[filename];
		}
		else
		{
			url = TGE.AssetManager._sFullPathTransformation(url);
		}

		fetch(url)
			.then(function(response) {
				return response.arrayBuffer();
			})
			.then(function(arrayBuffer) {
				TGE.AudioManager.GetInstance()._mPlugin._mContext.decodeAudioData(arrayBuffer, onDecodeSuccess, onDecodeError);
			})
			.catch(function(error) {
				onDecodeError();
			});
	};

	/** @ignore */
	// called to check status of image (fallback in case
	// the event listeners are not triggered).
	this.checkStatus = function()
	{
		// report any status changes to the loader
		// no need to do anything if nothing has changed
		/*if(this.audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
			this.loader.onError(this);
			return;
		}*/

		if(this.pollCount >= 3) {
			this.loader.onTimeout(this);
			return;
		}

		this.pollCount++;
	};

	/** @ignore */
	// called when it is no longer waiting
	this.onTimeout = function() {
		// must report a status to the loader: load, error, or timeout
		this.loader.onTimeout(this);
	};

	/** @ignore */
	// returns a name for the resource that can be used in logging
	this.getName = function() {
		return this.url;
	}
}