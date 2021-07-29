/**
 * The TGE.AssetManager is used to load and manage batches of game assets such as images, audio files, and scripts.
 * Typically assets required by the game are added to named categories called 'asset lists' using the addAssets or addAsset methods.
 * Some asset lists like in the "loading" and "required" categories are loaded automatically. Others can be loaded on demand using the loadAssetList method.
 * @class
 * @param {Boolean} loadAudio If set to false, audio loading will be completely disabled. Subsequently, no audio will work in the game.
 * @property {Boolean} useSpriteSheets Whether or not the 'sheet' tag will be respected in asset lists. Useful if you want to temporarily disable the use of texture packed sprite sheets in order to test art changes.
 * @property {String} languagesFolder By default, localized assets will be assumed to be in a "languages" folder contained at the root level of the TGE.AssetManager's root location (typically the "assets" folder). Use the languagesFolder property to change where the language sub-folders are located. For instance, if you want the language folders to be in "assets/translations/", you would set languagesFolder to "translations".
 * @constructor
 */
TGE.AssetManager = function(loadAudio)
{
    // Do we already have an instance?
    if(TGE.AssetManager.sAssetManagerInstance!==null)
    {
        return TGE.AssetManager.sAssetManagerInstance;
    }
    TGE.AssetManager.sAssetManagerInstance = this;

    if(loadAudio === undefined)
    {
        loadAudio = true;
    }

    // Public members
	this.useSpriteSheets = true;
    this.loadAudio = loadAudio;
    this.allLoaded = false;

	// PAN-466 Allow games to specify where the languages folder is
	this.languagesFolder = "languages";

    // Private members
    this._mSpriteSheets = {};
	this._mAssetLists = {};
	this._mLoadingOrder = [];       // assetList entries, in the order they get loaded
	this._mAssetCache = {};
	this._mRendererTextures = {};
    this._mGroupToListKey = null;
    this._mListToGroupKey = null;
    this._mLoadedAssetsCallback = null;
    this._mLoadedAssets = [];       // array of URLs for all loaded assets
    this._mRootLocation = null;

    // Setup the default asset lists
    this._verifyAssetListExists("loading");
    this._verifyAssetListExists("required");

	// Enable TGE.AssetManager.TrackAssets if trackassets is set to 1 in the querystring
	if(getQueryString()["trackassets"]==="1" || getQueryString()["trackassets"]==="true" || getQueryString()["tgedebug"]==="3")
	{
		TGE.AssetManager.TrackAssets = true;
	}

	// Parse GamConfig.ASSETS object, if legacy support is included
	if (this._parseAssets)
	{
		this._parseAssets();
	}

    return this;
}

/**
 * Set TGE.AssetManager.TrackAssets to true to enable tracking of number of assets loaded, total file size, and the largest image dimension.
 * Note that enabling this incurs significant additional overhead during the asset loading phase. Assets will only begin to be tracked after
 * this property is enabled. Set 'trackassets=1' in the querystring to enable it automatically on game load.
 * @constant
 */
TGE.AssetManager.TrackAssets = false;

/** @ignore */
TGE.AssetManager.SpriteSheets = {};

/** @ignore */
TGE.AssetManager.sAssetManagerInstance = null;

/** @ignore */
TGE.AssetManager._sTotalFonts = 0;

/** @ignore */
TGE.AssetManager._sTotalImagesLoadedBeforeStart = 0;
TGE.AssetManager._sTotalImagesLoadedAfterStart = 0;
TGE.AssetManager._sTotalFontsLoadedBeforeStart = 0;
TGE.AssetManager._sTotalFontsLoadedAfterStart = 0;

/** @ignore */
TGE.AssetManager._sTotalAssetFootprint = 0;
TGE.AssetManager._sTotalAssetFootprintBeforeStart = 0;
TGE.AssetManager._sTotalAssetsOverFootprintLimit = 0;

/** @ignore */
TGE.AssetManager._sLargestImageDimension = 0;

/** @ignore */
TGE.AssetManager._sFullPathTransformation = function(str)
{
    return str;
}

/**
 * Set a function that will be applied to an asset's full path right before it is fetched.
 * @param {Function } func The function should accept a string (the full path) as an argument, and return the transformed path.
 */
TGE.AssetManager.SetFullPathTransformation = function(func)
{
    TGE.AssetManager._sFullPathTransformation = func;
}

/**
 * Retrieves the asset object associated with the specified asset id. This function returns null and logs a TGE error event to the console if the asset associated with the specified id cannot be found.
 * @param {String} id The id representing the asset as defined in the original asset list.
 * @returns {HTMLImageElement|Object|null} Returns the requested asset, or null if no such asset exists.
 */
TGE.AssetManager.Get = function(id)
{
	return TGE.AssetManager.sAssetManagerInstance===null ? null : TGE.AssetManager.sAssetManagerInstance.getAsset(id);
}

/**
 * Indicates whether a specified asset is available in the asset manager.
 * @param {String} id The id representing the asset as defined in the original asset list.
 * @returns {Boolean} True if there is an asset associated with the specified id that was successfully loaded, or false otherwise.
 */
TGE.AssetManager.Exists = function(id)
{
    return (TGE.AssetManager.sAssetManagerInstance===null ? false : TGE.AssetManager.sAssetManagerInstance.getAsset(id, false)!==null);
}

/** @ignore */
TGE.AssetManager.GetTexture = function(id)
{
	return TGE.AssetManager.sAssetManagerInstance===null ? null : TGE.AssetManager.sAssetManagerInstance.getTexture(id);
}

/**
 * Returns (via callback) the complete list of assets that were loaded by the game.
 * If called before the loading of all asset lists is complete, then it waits until completion before making the callback.
 * The callback function will be passed one argument, an Array of the asset URLs.
 * @param {Function} callback
 */
TGE.AssetManager.GetLoadedAssets = function(callback)
{
     var assetManager = TGE.AssetManager.sAssetManagerInstance;
     if (assetManager)
     {
         assetManager._mLoadedAssetsCallback = callback;
         if (assetManager.allLoaded)
         {
             callback(assetManager._mLoadedAssets);
         }
     }
};

/** @ignore */
TGE.AssetManager.LoadFontScript = function(family, preloaded, loadCallback)
{
	// The font needs to exist in the _TREFONTS global object
	if (!window._TREFONTS || !_TREFONTS[family])
	{
	    // Special case we need to check for here where the font family name actually had underscores in it
        var usName = family.replace(/ /g, "_");
        if (!window._TREFONTS || !_TREFONTS[usName])
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "inlined font '" + family + "' was not found");
            return;
        }

		family = usName;
	}

	var fontObj = _TREFONTS[family];

	// We're assuming version 1 for now

	// If the data parameter is a string then this is a single base64 font. If it's an object then it's a dictionary of weights.
	if (typeof(fontObj.data)==="string")
	{
        preloaded ?
            TGE.AssetManager.WaitForFont(family, null, loadCallback) :
		    TGE.AssetManager.LoadFontData(family, fontObj.data);
	}
	else if (typeof(fontObj.data)==="object")
	{
	    // For preloaded fonts where we need to fire a callback, we have to wait for all the weights to
        // be loaded, and not fire the callback for each weight.
        var numLoaded = 0;
        var numRequired = Object.keys(fontObj.data).length;

		for (var weight in fontObj.data)
		{
			if (fontObj.data.hasOwnProperty(weight)) 
			{
			    preloaded ?
                    TGE.AssetManager.WaitForFont(family, weight, function() {
                        numLoaded++;
                        if (numLoaded === numRequired)
                        {
                            loadCallback();
                        }
                    }) :
				    TGE.AssetManager.LoadFontData(family, fontObj.data[weight], weight);
			}
		}
	}

	return fontObj;
}

/** @ignore */
TGE.AssetManager.LoadFontData = function(family, url, weight, loadCallback)
{
	// Create a style node to load the font with the desired ID and url
	var styleNode = document.createElement('style');
	var weightStr = weight ? ("font-weight: " + weight + ";") : "";
	styleNode.appendChild(document.createTextNode("@font-face {font-family: '" + family + "'; " + weightStr + " src: url('" + url + "');}"));

	// Setup the observer to notify us when the load is complete
    TGE.AssetManager.WaitForFont(family, weight, loadCallback);

	// Kick it off
	document.head.appendChild(styleNode);
};

/** @ignore */
TGE.AssetManager.WaitForFont = function(family, weight, loadCallback)
{
    // Setup the observer to notify us when the load is complete
    var weightObj = weight ? { weight: weight } : null;
    var font = new FontFaceObserver(family, weightObj);
    var softTimeout = 1000;
    font.load(null, softTimeout).then(
        function() { loadCallback && loadCallback(); },
        function() {
            // We'll treat the FontFaceObserver's aggressive timeout as a warning.
            // The AssetLoader's more linient 3s timeout will produce an error.
            TGE.Debug.Log(TGE.Debug.LOG_WARNING, "could not load '" + family + (weight ? (":" + weight) : "") + "' font within " + softTimeout + "ms, is it too big?");
        }
    );
};


TGE.AssetManager.prototype =
{
    /**
     * The game will set the root path for the asset manager as soon as the ad container informs it of what it is.
     * @ignore
     */
    _setRootLocation: function(path)
    {
        this._mRootLocation = path;

        // At this point we shoul also add in the list of potential manually loaded assets.
        if (window.GameConfig && GameConfig.PACKAGE_ASSETS)
        {
            GameConfig.PACKAGE_ASSETS.forEach((function(asset) {
                this._recordAsset(this._mRootLocation + asset);
            }).bind(this));
        }
    },

    /**
     * Converts an asset list number to an asset list name
     * @param {Number} listNumber list number you want to convert to a list name, Ex. 2
     * @returns {String} the asset list name
     */
    getAssetListFromNumber: function (listNumber)
    {
        return "required" + (listNumber > 1 ? listNumber : "");
    },

	/** @ignore */
	_assetListExists: function(assetListName)
	{
		return this._mAssetLists.hasOwnProperty(assetListName);
	},

	/** @ignore */
	_verifyAssetListExists: function(assetListName)
	{
		// Create an entry for the asset list if it doesn't exist yet
		if(!this._assetListExists(assetListName))
		{
			this._mAssetLists[assetListName] = {loaded: false, list: []};
		}
	},

    /**
     * Used to create a list of unique assets required by the game for packaging.
     * @ignore
     */
    _recordAsset: function(assetLocation)
    {
        if (this._mLoadedAssets.indexOf(assetLocation)===-1)
        {
            this._mLoadedAssets.push(assetLocation);
        }
    },

    /**
     * Sets the loading order for named asset lists, such as ["required", "engagement", "2x", "promo"]
     * @param {Array} assetListArray
     */
    registerAssetLists: function(assetListArray)
    {
        if (!Array.isArray(assetListArray) || assetListArray[0] !== "required")
        {
            TGE.Debug.Log(TGE.Debug.LOG_ERROR, "registerAssetLists must be called with an Array, and the first entry must be \"required\"");
            return;
        }

        // validate all of the list names exist
        for (var i = assetListArray.length; --i >= 0; )
        {
            if (!this._assetListExists(assetListArray[i]))
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "assetList '" + assetListArray[i] + "', listed in registerAssetLists, does not exist");
            }
        }

        this._mLoadingOrder = assetListArray.slice();
    },

	/**
	 * Adds an array of asset definition objects to an asset list. An example of an asset definition object is {id:'logo', url:'images/logo.png'}
	 * @param {String} assetListName The name of the asset list to add the new assets to. If an asset list with this name does not exist already, one will be created.
	 * @param {Array} assetArray An array of asset definition objects to add to the specified asset list.
	 */
    addAssets: function(assetListName,assetArray)
    {
        this._verifyAssetListExists(assetListName);
        if (Array.isArray(assetArray))
        {
            for (var i = 0; i < assetArray.length; ++i)
            {
                this.addAsset(assetListName, assetArray[i]);
            }
        }
        else
        {
            // PAN-1518 some games used addAssets with a single asset, so just pass that through
            this.addAsset(assetListName, assetArray);
        }
    },

	/**
	 * Adds a single asset definition object to an asset list. An example of an asset definition object is {id:'logo', url:'images/logo.png'}
	 * @param {String} assetListName The name of the asset list to add the new assets to. If an asset list with this name does not exist already, one will be created.
	 * @param {Object} assetObj The asset definition object to add to the asset list, ie: {id:'logo', url:'images/logo.png'}
	 */
    addAsset: function(assetListName,assetObj)
    {
	    this._verifyAssetListExists(assetListName);
        if (!assetObj.id && assetObj.url)
        {
            assetObj.id = trimmedFilename(assetObj.url);
        }
        this._mAssetLists[assetListName].list.push(assetObj);
    },

	/**
	 * Allows you to use a <a href="https://developer.tresensa.com/using-texturepacker-with-tge/">TexturePacker sprite sheet</a> to define a list of images to add to an asset list.
	 * Using this method you can add new image assets to the asset manager simply by adding them to a sprite sheet and re-publishing.
	 * @param {String} assetListName The name of the asset list to add the new assets to. If an asset list with this name does not exist already, one will be created.
	 * @param {String} sheetURL The local path to the sprite sheet to load the images from.
	 * @param {String} [layoutURL] The local path to the sprite sheet's js layout file. If the file is not specified here it must be included in the core js source for the game.
	 * @param {Boolean} [localized=false] If true, indicates that the sheet, and by definition all sub-images, should be treated as localized assets. If localized is true, a layoutURL *must* be provided.
	 */
	addSheetImages: function(assetListName,sheetURL,layoutURL,localized)
	{
		var subsheetURL;
		if (typeof sheetURL === "object")
		{
			subsheetURL = sheetURL.subsheetURL;
			layoutURL = layoutURL || sheetURL.layoutURL;
			localized = localized !== undefined ? localized : (sheetURL.localized || false);
			sheetURL = sheetURL.sheetURL || sheetURL.url;
		}

		// PAN-910 Progressive Loading Update
        if (parseInt(getQueryString()["testbuffering"])==2)
        {
            assetListName = "required";
        }

        this._verifyAssetListExists(assetListName);

        var assetList = this._mAssetLists[assetListName];

		// (this is deprecated) PAN-594 If the sheet is localized we need to reassign the layout file, but we have to wait until
		// the point where the list is loaded and the final language has been set. That is also when we'll add
		// the individual assets to the asset list (they may differ between languages due to TFX).
		if(typeof layoutURL === "boolean" && layoutURL) // This is from a deprecated version of the call where this argument was a boolean
		{
			assetList.localizedSheets = assetList.localizedSheets || [];
			assetList.localizedSheets.push(sheetURL);
		}
		else if (typeof layoutURL === "string" || subsheetURL)
		{
			assetList.layoutFiles = assetList.layoutFiles || [];
			assetList.layoutFiles.push({sheetURL:sheetURL, subsheetURL:subsheetURL, layoutURL:layoutURL, localized:localized});
		}
		else
		{
			this._addSheetImagesToAssetList(assetList,sheetURL,localized);
		}
	},

	/**
	 * Adds subsheet definitions to the main sheet, and gets called once the parent and subsheet definitions are both loaded
	 * @param {String} subsheetName the name of the subsheet asset
	 * @param {String} sheetName the name of the parent sheet that contains it
	 * @ignore
	 */
	_prepSubsheet: function(subsheetName, sheetName)
	{
		var sheet = TGE.AssetManager.SpriteSheets[sheetName];
		if (sheet)
		{
			var subsheet = TGE.AssetManager.SpriteSheets[subsheetName];
			if (subsheet)
			{
				var sheetAsset = sheet[subsheetName];
				if (sheetAsset)
				{
					for (var assetName in subsheet)
					{
						var asset = subsheet[assetName].slice();    // make copy of the asset
						asset[0] += sheetAsset[0];                  // add the x/y offset of the main sheet image
						asset[1] += sheetAsset[1];
						sheet[assetName] = asset;                   // add the asset to the main sheet
					}
					// PAN-1317 remove the subsheet from the global array when we're finished with it, so it doesn't trigger "duplicate asset" warnings
					delete TGE.AssetManager.SpriteSheets[subsheetName];
				}
				else
				{
					TGE.Debug.Log(TGE.Debug.LOG_ERROR, "subsheet '" + subsheetName + "' not found in main sheet " + sheetName);
				}
			}
			else
			{
				TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager can't find subsheet '" + subsheetName + "'");
			}
		}
	},

	/**
	 * Adds all of the required images used by TFX animations to the asset manager for loading.
	 * @param {String} assetListName The name of the asset list to add the new assets to. If an asset list with this name does not exist already, one will be created.
	 * @param {Array} tfxAssetArray An array of tfx asset definition objects to add to the specified asset list.
	 * An example of a tfx asset definition object is: {tfxClass: MyAnimations, imagePath: 'images/tfx'}, where tfxClass is the class created by the TFX exporter, and imagePath is the location of the exported images.
	 * Optional parameters are also 'sheet', for defining a sprite sheet that contains the required images, and 'imageSet', which can be used to specify an alternate set of images to use for an animation.
	 */
	addTFXImages: function(assetListName,tfxAssetArray)
	{
		this._verifyAssetListExists(assetListName);

		for(var t=0; t<tfxAssetArray.length; t++)
		{
			var tfxParams = tfxAssetArray[t];
			tfxParams.imageList = this._mAssetLists[assetListName].list;
			tfxParams.tfxClass.AddRequiredImagesToAssetList(tfxParams);
		}
	},

	/**
	 * Goofed up the name of this one in PAN-277. Going to keep it around for backward compatibility and a day when we can figure out how to load TFX images+js together
	 * @ignore
	 */
	addTFXAssets: function(assetListName,tfxAssetArray)
	{
		this.addTFXImages(assetListName,tfxAssetArray);
	},

	/**
	 * Loads all of the assets in the specified asset list. If the asset list has already been loaded, it will not be loaded again and the completeCallback will be fired immediately.
	 * @param {String} assetListName The name of the asset list to load.
	 * @param {Function} [updateCallback] An optional callback function that will be fired throughout the loading process to indicate percentage of completeness. The callback function will include a single argument which is the percentage complete (ie: 0.5 = 50% complete).
	 * @param {Function} [completeCallback] An optional callback function that will be fired when the asset manager is finished attempting to load the list. This callback will be fired even if there were errors in downloading, or if the asset list was already loaded.
	 * The callback will contain a response object with a boolean 'errors' property. This can be used to determine whether all the assets were loaded successfully or not.
	 */
    loadAssetList: function(assetListName,updateCallback,completeCallback)
    {
        var assetList = this._mAssetLists[assetListName];
	    if(assetList)
	    {
		    this._loadAssetList(assetList,updateCallback,completeCallback);
	    }
	    else
	    {
		    // Asset list was not found, fire the callback right away
		    TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager could not locate asset list '" + assetListName + "'");
		    if(completeCallback)
		    {
			    completeCallback({errors:false}); // Technically there were no errors in loading...
		    }
	    }
    },

	/**
     * PAN-277 - use addLoadedAsset instead
     * @ignore
	 */
    addImage: function(id,image)
    {
        this.addLoadedAsset(id,image);
    },

	/**
	 * Adds an already loaded asset to the asset manager so it can be retrieved later using the specified id.
	 * @param {String} id A unique id used for future lookup of the asset.
	 * @param {Object} asset The asset to add to the asset manager.
	 */
	addLoadedAsset: function(id,asset)
	{
		this._mAssetCache[id] = asset;
	},

	/**
	 * Trim pixels from the edges of an asset, to fix artifacts when scaling by large amounts.
	 * (Scaling filters blend the transparent pixels adjacent to the asset in the sprite sheet,
	 * so this ensures same-color pixels always exist outside the asset boundaries).
	 * @param {String} id asset id
	 * @param {String} [whichEdges=all] a string containing one or more of "top", "bottom", "left", or "right"
	 */
	trimAsset: function(id, whichEdges)
	{
		if (typeof whichEdges !== "string")
		{
			whichEdges = "top bottom left right";
		}
		var asset = this.getAsset(id);
		if (asset.spriteSheet)
		{
			if (whichEdges.indexOf("top") >= 0)
			{
				++asset.y;
				--asset.height;
			}
			if (whichEdges.indexOf("bottom") >= 0)
			{
				--asset.height;
			}
			if (whichEdges.indexOf("left") >= 0)
			{
				++asset.x;
				--asset.width;
			}
			if (whichEdges.indexOf("right") >= 0)
			{
				--asset.width;
			}
		}
	},

	/**
	 * Retrieves the asset object associated with the specified asset id.
	 * @param {String} id The id representing the asset as defined in the original asset list.
	 * @param {Boolean} [errorCheck=true] Indicates whether or not to output a TGE console error message if the asset could not be found.
	 * @returns {HTMLImageElement|Object|null} Returns the requested asset, or null if no such asset exists.
	 */
	getAsset: function(id,errorCheck)
	{
		errorCheck = typeof errorCheck === "undefined" ? true : errorCheck;
		var asset = this._mAssetCache[id];
		if(errorCheck && id!=null && !asset)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager.getAsset could not find the asset '" + id + "'");
		}

		return asset || null;
	},

	/** @ignore */
	getTexture: function(id,errorCheck)
	{
		errorCheck = typeof errorCheck === "undefined" ? true : errorCheck;
		var texture = this._mRendererTextures[id];
		if(errorCheck && id!=null && !texture)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager.getTexture could not find a texture for '" + id + "'");
		}

		return texture || null;
	},

	/**
     * PAN-277 - this method wasn't consistent with other AssetManager naming, use addSheetImages instead
     * @ignore
	 */
	addSheetImagesToAssetList: function(assetListName,sheetURL)
    {
        this.addSheetImages(assetListName,sheetURL);
    },

	/**
	 * Returns the total size of all assets loaded in bytes.
 	 * @param {Boolean} beforeStart Indicates whether to calculate only assets loaded up until the "required" asset list is finished.
	 * @returns {Number} The total footprint of all assets loaded in bytes.
	 */
	totalAssetFootprint: function(beforeStart)
	{
		return beforeStart ? TGE.AssetManager._sTotalAssetFootprintBeforeStart : TGE.AssetManager._sTotalAssetFootprint;
	},

    /**
     * Returns the total number of individual image files loaded before the game starts.
     * @returns {Number} The total number of images loaded before start.
     */
    totalImagesLoadedBeforeStart: function ()
    {
        return TGE.AssetManager._sTotalImagesLoadedBeforeStart;
    },

    /**
     * Returns the total number of individual image files loaded after the game starts.
     * @returns {Number} The total number of images loaded after start.
     */
    totalImagesLoadedAfterStart: function ()
    {
        return TGE.AssetManager._sTotalImagesLoadedAfterStart;
    },

    /**
     * Returns the total number of individual font files loaded before the game starts.
     * @returns {Number} The total number of fonts loaded before start.
     */
    totalFontsLoadedBeforeStart: function ()
    {
        return TGE.AssetManager._sTotalFontsLoadedBeforeStart;
    },

    /**
     * Returns the total number of individual font files loaded after the game starts.
     * @returns {Number} The total number of fonts loaded after start.
     */
    totalFontsLoadedAfterStart: function ()
    {
        return TGE.AssetManager._sTotalFontsLoadedAfterStart;
    },

	/**
	 * Returns the largest dimension of all images loaded.
	 * @returns {Number} The total footprint of all assets loaded in bytes.
	 */
	largestImageDimension: function()
	{
		return TGE.AssetManager._sLargestImageDimension;
	},

	/** @ignore */
	_addSheetImagesToAssetList: function(assetList,sheetURL,localized)
	{
		var sheetName = trimmedFilename(sheetURL);

		// Locate the sheet descriptor
		var sheet = TGE.AssetManager.SpriteSheets[sheetName];
		if(!sheet)
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager.addSheetImages could not locate sheet '" + sheetURL + "'");
			return;
		}

		// Push each image in the sprite sheet descriptor into the asset list
		for(var asset in sheet)
		{
			if(sheet.hasOwnProperty(asset))
			{
				// url parameter is bogus, but it doesn't get used
				assetList.list.push({id: asset, url: asset+".png", sheet: sheetURL, localized: localized===true});

				// PAN-1038 PAN-1238 for localized and dynamically-loaded sheets, we need to see if the game was waiting for one of these asset names
				if (assetList.layoutFiles)
				{
					var game = TGE.Game.GetInstance();
					var waitingList = game._mWaitingForAssets;
					for (var i = waitingList.length; --i >= 0; )
					{
						var w = waitingList[i];
						if (w.id === asset || w.id === sheetName)
						{
							// need to find the assetList name for this assetList
							for (var listName in this._mAssetLists)
							{
								if (this._mAssetLists[listName] === assetList)
								{
									game.waitForAssetList(listName, w.callback, w.showBuffering);
									waitingList.splice(i, 1);   // remove this item from waiting list
								}
							}
						}
					}
				}
			}
		}
	},

	/**
	 * Helper for loadAssetList, takes actual asset list as argument
	 * @ignore
	 */
	_loadAssetList: function(assetList,updateCallback,completeCallback)
	{
		// Is this asset list already loaded?
		if(assetList.loaded===true && assetList.errors!==true)
		{
			if(updateCallback)
			{
				updateCallback(1);
			}

			if(completeCallback)
			{
				completeCallback({errors:false});
			}
		}
		else
		{
            var currentLanguage = TGE.RemoteSettings("lang");

			// (deprecated) PAN-594 If the list contains any localized sheets we need to reassign their layout files
			if(assetList.localizedSheets)
			{
				for(var al=0; al<assetList.localizedSheets.length; al++)
				{
					var sheetURL = assetList.localizedSheets[al];
					var trimmedName = trimmedFilename(sheetURL);
					var localizedTrimmedName = trimmedName + (currentLanguage!=="en" ?  ("_" + currentLanguage) : "");
					var localizedLayout = TGE.AssetManager.SpriteSheets[localizedTrimmedName];
					if(localizedLayout)
					{
						TGE.AssetManager.SpriteSheets[trimmedName] = localizedLayout;

						// Add the individual images now
						this._addSheetImagesToAssetList(assetList,assetList.localizedSheets[al],true);
					}
					else
					{
						TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AssetManager.addSheetImages could not locate localized layout file '" + localizedTrimmedName + ".js'");
					}
				}
			}

			// PAN-596 We have to load sprite sheet layout files before we can load the associated images
			if(assetList.layoutFiles)
			{
				var layoutsAssetList = {loaded: false, list: []};
				for(var lf=0; lf<assetList.layoutFiles.length; lf++)
				{
					var entry = assetList.layoutFiles[lf];
					if (entry.subsheetURL)
					{
						if (Array.isArray(entry.subsheetURL))
						{
							// push each array entry
							for (var i = entry.subsheetURL.length; --i >= 0; )
							{
                                pushSubsheetURL(layoutsAssetList, entry.subsheetURL[i]);
							}
						}
						else
						{
                            pushSubsheetURL(layoutsAssetList, entry.subsheetURL);
						}
					}
					if (entry.layoutURL)
					{
						layoutsAssetList.list.push({url:entry.layoutURL, localized:entry.localized});
					}
				}

				// Load all the layout files, when that's done we can continue with the regular load.
				this._loadAssetList(layoutsAssetList,null,this._processSheetLayouts.bind(this,assetList,updateCallback,completeCallback));
			}
			else
			{
				// Load all the assets in the list
				var assetLoader = new TGE.AssetLoader();
				assetLoader.loadAssetList(this,assetList,this._mRootLocation,this.languagesFolder,currentLanguage,updateCallback,completeCallback);
			}
		}

        function pushSubsheetURL(layoutsAssetList, subsheetURL)
        {
            if (!TGE.AssetManager.SpriteSheets[trimmedFilename(subsheetURL)])
            {
                layoutsAssetList.list.push({url:subsheetURL});
            }
        }
	},

	/** @ignore */
	_processSheetLayouts: function(assetList,updateCallback,completeCallback)
	{
		// Load each of the images in each of the sheets
		for(var lf=0; lf<assetList.layoutFiles.length; lf++)
		{
			var entry = assetList.layoutFiles[lf];
			if (entry.subsheetURL)
			{
				if (Array.isArray(entry.subsheetURL))
				{
					// push each array entry
					for (var i = entry.subsheetURL.length; --i >= 0; )
					{
						this._prepSubsheet(trimmedFilename(entry.subsheetURL[i]), trimmedFilename(entry.sheetURL));
					}
				}
				else
				{
					this._prepSubsheet(trimmedFilename(entry.subsheetURL), trimmedFilename(entry.sheetURL));
				}
			}
			this._addSheetImagesToAssetList(assetList, entry.sheetURL, entry.localized);
		}

        // Now finally load the asset list
		var assetLoader = new TGE.AssetLoader();
		assetLoader.loadAssetList(this,assetList,this._mRootLocation,this.languagesFolder,TGE.RemoteSettings("lang"),updateCallback,completeCallback);

		// When testbuffering, if we still have unresolved _mWaitingForAssets, we need to queue up the next assetList load
        var game = TGE.Game.GetInstance();
        if (game._mTestBuffering === 1 && game._mWaitingForAssets.length)
		{
			game._loadNextAssetList();
		}
	}
}
