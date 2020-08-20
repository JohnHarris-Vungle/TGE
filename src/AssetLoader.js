/**
 * @ignore
 * @class Used to specify groups of assets that can be loaded at different points within your game. For example, loading level-specific assets.
 * @constructor
 */
TGE.AssetLoader = function ()
{
    this.mAssetList = null;
    this.mUpdateCallback = null;
    this.mCompleteCallback = null;
    return this;
}

TGE.AssetLoader.prototype = {

	getAssetURL: function(asset, rootLocation, languagesFolder)
	{
		var useRootLocation = !(asset.absolutePath===true);
		return (useRootLocation ? rootLocation : "") + (asset.localized ? languagesFolder : "") + asset.url;
	},

	loadAssetFromAssetList: function (assetManager, loader, asset, url, wereErrors, loadAudio)
	{
		var root;
        var extension = asset.url ? asset.url.split('.').pop().toLowerCase() : null;
        var isAudio = asset.assetType === "audio" || extension==="ogg" || extension==="mp3";

		if (url)
		{
            root = url.slice(0, -asset.url.length);
        }

        var newAsset = null;
        if(isAudio)
        {
            if(loadAudio)
            {
                newAsset = loader.addAudio(asset.id, url, root+asset.backup_url);
            }
        }
        else if(asset.googleFamilies)
        {
            newAsset = loader.addFont(asset.googleFamilies);
        }
        else if(asset.assetType === "font" || extension==="ttf" || extension==="woff" || extension==="woff2" || extension==="otf")
        {
            newAsset = loader.addFont(asset.id, url);
        }
        else if(extension === "js")
        {
            newAsset = loader.addJavascript(url);
        }
        else if(extension === "json")
        {
	        if (asset.id !== trimmedFilename(url))
	        {
		        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "id field not supported for JSON asssets");
	        }
            newAsset = loader.addJSON(url);
        }
        else if(extension === "mp4")
        {
            newAsset = loader.addVideo(url, asset);
        }
        else if(assetManager.useSpriteSheets && asset.sheet)
		{
			var sheetPath = asset.sheet;
			var spriteSheet = assetManager._mSpriteSheets[sheetPath];

			// New sprite sheet?
			if(!spriteSheet || wereErrors)
			{
				spriteSheet = loader.addImage(root+asset.sheet);
				if(spriteSheet !== null)
				{
					// PAN-1122 add the sheet image as an asset under its own name
					assetManager.addLoadedAsset(trimmedFilename(asset.sheet), spriteSheet);
				}
				assetManager._mSpriteSheets[asset.sheet] = spriteSheet;
			}

			// Look up the coordinates
			var sheetData = TGE.AssetManager.SpriteSheets[trimmedFilename(sheetPath)];
			if(sheetData)
			{
				var imageData = sheetData[trimmedFilename(url)];
				if(imageData)
				{
					// Instead of adding an image, we add an object with the sprite sheet and its coordinates
					newAsset = {spriteSheet:spriteSheet,x:imageData[0],y:imageData[1],width:imageData[2],height:imageData[3]};
					if(imageData.length > 4)
					{
						newAsset.offsetX = imageData[4];
						newAsset.offsetY = imageData[5];
						newAsset.drawWidth = newAsset.width;
						newAsset.drawHeight = newAsset.height;
						if(imageData.length > 6)		// if TP trim mode is 'trim', we maintain the original w/h in the Sprite
						{
							newAsset.width = imageData[6];
							newAsset.height = imageData[7];
						}
					}
				}
			}
		}
		else
		{
                newAsset = loader.addImage(url);
        }

        // newAsset could be null at this point if an audio asset is being loaded but
        // loadAudio is false.
        if(newAsset !== null)
        {
            assetManager.addLoadedAsset(asset.id, newAsset);
        }
	},

    /** @ignore */
    loadAssetList: function(assetManager, assetList, rootLocation, languagesFolder, language, updateCallback, completeCallback)
    {
		rootLocation = rootLocation || assetManager._mRootLocation;

		// Check if this is being called too early. We can't load assets until TGE.Game.launch() has been called, as this
		// specifies the root location, which is often dependent on the distribution platform.
		if (rootLocation === null)
		{
			TGE.Debug.Log(TGE.Debug.LOG_WARNING, "asset list manually loaded before game launch, will be deferred until after all required assets have loaded");

			// Cue this up for after all other assets have loaded
			TGE.Game.AddEventListener("tgeAssetListsLoaded", this.loadAssetList.bind(this, assetManager, assetList,
				rootLocation, languagesFolder, language, updateCallback, completeCallback));

			return;
		}

	    var wereErrors = assetList.errors===true;

	    assetList.errors = false;
	    assetList.loaded = false;

        // If the list is empty we're done
        if(assetList.list.length===0)
        {
            if(updateCallback)
            {
                // Technically we are 100% loaded, we should broadcast this
                updateCallback(1);
            }
            if(completeCallback)
            {
                // Nothing to load, so skip right to the complete callback
                completeCallback({errors:false});
            }
            return;
        }
		
		// Make sure the root location parameter is valid (not sure this is necessary...)
        rootLocation = _validPath(rootLocation, "");

	    // Make sure the languageFolder parameter is valid
	    languagesFolder = _validPath(languagesFolder, rootLocation.length>0 ? "/" : "");

	    // Append the current language folder
	    languagesFolder += language + "/";

        this.mAssetList = assetList;
        this.mUpdateCallback = updateCallback;
        this.mCompleteCallback = completeCallback;

        var loader = new TGE.Loader({statusInterval:3000});
	    var loadingNewAsset = false;

        for(var i=0; i<assetList.list.length; i++)
        {
            var asset = assetList.list[i];

            // Skip loading assets that already exist. Allows images to be pre-defined in a sprite sheet, and subsequent
            // file loads then get skipped. If there were errors in previous attempts to load this list, force it to retry.
            if(!wereErrors && assetManager._mAssetCache[asset.id])
            {
                continue;
            }

            var extension = asset.url ? asset.url.split('.').pop().toLowerCase() : null;
            var isAudio = asset.assetType === "audio" || extension==="ogg" || extension==="mp3";
            var url = (asset.url ? this.getAssetURL(asset, rootLocation, languagesFolder) : null);

            this.loadAssetFromAssetList(assetManager, loader, asset, url, wereErrors, assetManager.loadAudio);

            loadingNewAsset = true;
        }

	    // Every asset in the asset list has already been loaded
	    if (!loadingNewAsset)
	    {
		    if(updateCallback)
		    {
			    // Technically we are 100% loaded, we should broadcast this
			    updateCallback(1);
		    }
		    if(completeCallback)
		    {
			    // Nothing to load, so skip right to the complete callback
			    completeCallback({errors:false});
		    }
	    }

        loader.addProgressListener(TGE.AssetLoader.prototype._loaderCallback.bind(this));
        loader.addCompletionListener(TGE.AssetLoader.prototype._completeCallback.bind(this));
        loader.start();

	    function _validPath(path, defaultPath)
	    {
		    path = typeof path === "string" ? path : defaultPath;
		    return (path.length > 0 && path.charAt(path.length - 1) !== "/") ? path + "/" : path;
	    }

    },

    _loaderCallback: function(e)
    {
        // Check for an error
        if(e.error)
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "could not load asset '" + e.resource.getName() + "'");
	        this.mAssetList.errors = true;
        }
	    else if(TGE.AssetManager.TrackAssets)
        {
            var beforeStart = !TGE.Game.GetInstance().assetManager._mAssetLists["required"].loaded;
            var isImage = e.resource && e.resource.img;
            var isFont = e.resource && e.resource.font;

            // Asset totals
            if (isImage)
            {
                if (beforeStart)
                {
                    TGE.AssetManager._sTotalImagesLoadedBeforeStart++;
                }
                else
                {
                    TGE.AssetManager._sTotalImagesLoadedAfterStart++;
                }
            }
            else if (isFont)
            {
                if (beforeStart)
                {

                    TGE.AssetManager._sTotalFontsLoadedBeforeStart++;
                }
                else
                {
                    TGE.AssetManager._sTotalFontsLoadedAfterStart++;
                }
            }

            // Image dimensions
	        if(e.resource && e.resource.img)
	        {
		        var biggest = Math.max(e.resource.img.width, e.resource.img.height);
		        if(biggest>TGE.AssetManager._sLargestImageDimension)
		        {
			        TGE.AssetManager._sLargestImageDimension = biggest;
		        }
	        }

	        // Get the filesize
            this._trackFilesize(e.resource, beforeStart);
        }

        // If there is a level loading callback, call it
        if(this.mUpdateCallback)
        {
            var percentComplete = e.completedCount / e.totalCount;
            this.mUpdateCallback(percentComplete);
        }
    },

    _completeCallback: function()
    {
	    // Create renderer specific textures
	    var assetManager = TGE.Game.GetInstance().assetManager;
	    var renderer = TGE.Game.GetInstance()._mFullStage._mRenderer;
	    for(var i=0; i<this.mAssetList.list.length; i++)
	    {
		    var asset = this.mAssetList.list[i];
		    if(!asset.assetType)
		    {
			    var imageAsset = assetManager.getAsset(asset.id,false);
			    if(imageAsset && (imageAsset.src || imageAsset.spriteSheet))
			    {
				    var texture = renderer.processImage(imageAsset.spriteSheet? imageAsset.spriteSheet : imageAsset,
					    imageAsset.spriteSheet ? true : false);

				    // Track it via the asset name
				    if(texture)
				    {
					    assetManager._mRendererTextures[asset.id] = texture;
				    }
			    }
		    }
	    }

	    var errors = false;

        // Mark this list as being loaded
        if(this.mAssetList !== null)
        {
            this.mAssetList.loaded = true;
	        errors = this.mAssetList.errors;
            this.mAssetList = null;
        }

        // If there is a level loading callback, call it
        if(this.mCompleteCallback)
        {
            this.mCompleteCallback({errors:errors});
        }
    },

    _trackFilesize: function (resource, beforeStart) {
        // From http://stackoverflow.com/questions/17416274/ajax-get-size-of-file-before-downloading
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", resource.getName(), true); // Notice "HEAD" instead of "GET",
        // Get only the header
        xhr.onreadystatechange = function () {
            if (this.readyState == this.DONE) {
                var length = parseInt(xhr.getResponseHeader("Content-Length"));
                TGE.AssetManager._sTotalAssetFootprint += length;
                if (beforeStart) {
                    TGE.AssetManager._sTotalAssetFootprintBeforeStart += length;
                }

                // Tests if image is over 400KB, if so, flags it as possibly not being tinyPNG'ed
                var isOverLimit = length / 1024 > 400;
                var isImage = resource.img;
                if (isOverLimit && isImage) {
                    TGE.AssetManager._sTotalAssetsOverFootprintLimit++;
                }
            }
        };
        xhr.send();
    }
}

/**
 * Font Loading
 * @ignore
 */
TGE.FontLoader = function(id, url)
{
	this.loader = null;
	this.font = null;
	this.id = id;
	this.url = url;
	this.pollCount = 0;

	// called by TGE.Loader to trigger download
	/** @ignore */
	this.start = function(loader)
	{
		// we need the loader ref so we can notify upon completion
		this.loader = loader;

		// set up event handlers so we send the loader progress updates

		// there are 3 possible events we can tell the loader about:
		// loader.onLoad(this);    // the resource loaded
		// loader.onError(this);   // an error occurred
		// loader.onTimeout(this); // timeout while waiting

		var that = this;

		// PAN-652 - removing this feature as it should be using a local copy of the third party lib (googleapis webfont.js)
		// If the id property is an array, this is meant to be loaded by the Google Font API
        if(Object.prototype.toString.call(this.id) === '[object Array]')
		{
			// Set the "url" for error messaging
			this.url = this.id;

			// If _TREFONTS exists we want to loop throught the strings in the familes array and load each entry.
			// Each entry could itself contain multiple weights, each a separate font that needs to be loaded.
			// For example: ["Oswald:400,700", "Roboto:400"]
			if (window._TREFONTS)
			{
				// We can't fire success until all entries have been loaded
				var nop = function() {};

				for (var i=0; i<this.id.length; i++)
				{
					var error = false;
					var errorMsg = "could not parse Google Font entry";
					var parts = this.id[i].split(":");
					var family = parts[0];
					if (parts.length<=2)
					{
						errorMsg = "no inlined font found for '" + family + "'";
						if (_TREFONTS[family])
						{
							if (parts.length===1)
							{
								TGE.AssetManager.LoadFontData(family, _TREFONTS[family].data, null, nop);
							}
							else
							{
								var weights = parts[1].split(",");
								for (var w=0; w<weights.length; w++)
								{
									if (_TREFONTS[family].data[weights[w]])
									{
										TGE.AssetManager.LoadFontData(family, _TREFONTS[family].data[weights[w]], parseInt(weights[w]), nop);
									}
									else
									{
										error = true;
										errorMsg += " weight " + weights[w];
									}
								}
							}
						}
						else
						{
							error = true;
						}
					}
					else
					{
						error = true;
					}

					if (error)
					{
						TGE.Debug.Log(TGE.Debug.LOG_ERROR, errorMsg);
						this.loader.onError(this);
					}
				}
				
				that.loader.onLoad(that);
			}
			else
			{
				WebFontConfig = {
					google: { families: this.id }, // In this case this.id is the "families" parameter (an array)
					active: function() { that.loader.onLoad(that); },
					fontinactive: function() { that.loader.onError(that); }
				};

				var wf = document.createElement('script');
				wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
					'://googleapis.tresensa.com/ajax/libs/webfont/1/webfont.js';
				wf.type = 'text/javascript';
				wf.async = 'true';
				var s = document.getElementsByTagName('script')[0];
				s.parentNode.insertBefore(wf, s);
			}
		}
		else
        {
            TGE.AssetManager._sTotalFonts++;

            try
            {
				// For packaged builds that require inlined assets (ie: Facebook), we will check for 
				// the existence of a global dictionary of asset names to base64 strings
				var url = this.url;
	            if (window._TREFONTS && _TREFONTS[filename])
				{
					var parts = this.url.split("/");
					var filename = parts[parts.length-1];
					url = _TREFONTS[filename];
				}

				TGE.AssetManager.LoadFontData(this.id, url, null, that.loader.onLoad.bind(that.loader, that));
            }
            catch(e)
            {
                that.loader.onError(that);
                return;
            }
        }

	};

	// called to check status of image (fallback in case
	// the event listeners are not triggered).
	/** @ignore */
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

	// called when it is no longer waiting
	/** @ignore */
	this.onTimeout = function() {
		// must report a status to the loader: load, error, or timeout
		this.loader.onTimeout(this);
	};

	// returns a name for the resource that can be used in logging
	/** @ignore */
	this.getName = function() {
		return this.url;
	}
}

/**
 * Javascript Loading
 * @ignore
 */
TGE.ScriptLoader = function(url)
{
	this.loader = null;
	this.scriptNode = null;
	this.url = url;
	this.pollCount = 0;

	this.scriptLoaded = function()
	{
		if (this.scriptNode)
		{
			this.scriptNode.onreadystatechange = null;
			this.scriptNode.onload = null;

			// Is this actually a font asset?
			if (this.url.indexOf("assets/fonts/") !== -1)
			{
				// Get the family name from the url as well
				var family = this.url.match(/([^\/]+)(?=\.\w+$)/)[0];

				// We don't want to fire onLoad here, because we don't actually know if the font has been made
				// available to the browser yet. Use our typical font loading path and pass in this callback.
				TGE.AssetManager.LoadFontScript(family, true, this.loader.onLoad.bind(this.loader, this));
				return;
			}
		}		
		this.loader.onLoad(this);
	};

	// called to trigger download
	this.start = function(loader)
	{
		// we need the loader ref so we can notify upon completion
		this.loader = loader;

		// Check if we're loading the scripts as inlined assets
		if (window._TRESCRIPTS)
		{
			var parts = this.url.split("/");
			var filename = parts[parts.length-1];
			var script = _TRESCRIPTS[filename];
			
			// Evaluate the requested script
			if (script)
			{
				try
				{
					// Execute the script. Use window.Function instead of eval() based on recommendations here:
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
					window.Function ?
						Function('"use strict";return (' + script + ')')() :
						eval(script);

					this.scriptLoaded();
				}
				catch(e)
				{
					this.loader.onError(this);
				}
			}
			else
			{
				this.loader.onError(this);
			}			
		}
		else
		{
			var h = document.getElementsByTagName("head")[0];
			this.scriptNode = document.createElement("script");
			this.scriptNode.type = "text/javascript";
			this.scriptNode.src = this.url;
			this.scriptNode.onreadystatechange = this.scriptLoaded.bind(this);
			this.scriptNode.onload = this.scriptLoaded.bind(this);
			h.appendChild(this.scriptNode);
		}
	};

	// called to check status of image (fallback in case
	// the event listeners are not triggered).
	/** @ignore */
	this.checkStatus = function()
	{
		if(this.pollCount >= 3) {
			this.loader.onTimeout(this);
			return;
		}

		this.pollCount++;
	};

	// called when it is no longer waiting
	/** @ignore */
	this.onTimeout = function() {
		// must report a status to the loader: load, error, or timeout
		this.loader.onTimeout(this);
	};

	// returns a name for the resource that can be used in logging
	/** @ignore */
	this.getName = function()
	{
		return this.url;
	}
}
/**
 * JSON Loading
 * @ignore
 */
TGE.JSONLoader = function(url)
{
	this.loader = null;
	this.json = {};
	this.url = url;
	this.pollCount = 0;

	// called to trigger download
	this.start = function(loader)
	{
		// we need the loader ref so we can notify upon completion
		this.loader = loader;

		// Check if we're loading as inlined assets
		if (window._TREJSON)
		{
			var parts = this.url.split("/");
			var filename = parts[parts.length-1];
			var json = _TREJSON[filename];
			if (json)
			{
				this.jsonData(json);
			}
			else
			{
				this.loader.onError(this);
			}
		}
		else
		{
			var self = this;
			fetch(url)
				.then(function(response) {
					return response.json();
				})
				.then(self.jsonData.bind(self))
				.catch(function(error) {
					TGE.Debug.Log(TGE.Debug.LOG_ERROR, error);
					self.loader.onError(self);
				});
		}
	};

	this.jsonData = function(data)
	{
		TGE.DeepCopy(data, this.json);
		this.loader.onLoad(this);
	};

	// called to check status of image (fallback in case
	// the event listeners are not triggered).
	/** @ignore */
	this.checkStatus = function()
	{
		if(this.pollCount >= 3) {
			this.loader.onTimeout(this);
			return;
		}

		this.pollCount++;
	};

	// called when it is no longer waiting
	/** @ignore */
	this.onTimeout = function() {
		// must report a status to the loader: load, error, or timeout
		this.loader.onTimeout(this);
	};

	// returns a name for the resource that can be used in logging
	/** @ignore */
	this.getName = function()
	{
		return this.url;
	}
}


if(typeof(TGE.Loader)==="function")
{
	TGE.Loader.prototype.addFont = function(id, url) {
		var fontLoader = new TGE.FontLoader(id, url);
		this.add(fontLoader);
		return fontLoader.font;
	};

	TGE.Loader.prototype.addJSON = function(url) {
		var jsonLoader = new TGE.JSONLoader(url);
		this.add(jsonLoader);
		return jsonLoader.json;
	};

	TGE.Loader.prototype.addJavascript = function(url) {
		var scriptLoader = new TGE.ScriptLoader(url);
		this.add(scriptLoader);
		return scriptLoader.scriptNode;
	};
};
