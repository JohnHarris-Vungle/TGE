/**
 * <p>Use the Text object to display text onscreen. The Text object is a version of the DisplayObjectContainer and includes all its properties as well as unique properties such as font, color and--of course--text.</p>
 * @class A display object that is used to display html text on the game canvas.
 * @extends TGE.DisplayObjectContainer
 * @property {String} text The text to be displayed.
 * @property {String} textID When using translated strings, textID is the lookup key for the desired text to be used. This property overrides the 'text' property.
 * @property {String} fontFamily Indicates the font used for rendering the text. For example, "Arial", "Tahoma", etc.
 * @property {Array} fontFallbacks An array of fonts (as Strings) that will be used if the font specified for fontFamily is not supported by the environment.  Each font in the fontFallback array will be tried in order until one is supported.
 * @property {String} fontSize Indicates font size.  Specify as an int. For Example, 12, 40, etc.
 * @property {String} fontWeight Indicates thickness of the font.  Can be specified as "normal", "bold", "bolder", "lighter", or as any number value.
 * @property {String} fontStyle Indicates style of the font.  Can be specified as "normal" or "italic".
 * @property {String} hAlign Indicates the desired horizontal alignment of the text. Accepted values are "left", "center", "right", and "justify".
 * @property {String} vAlign Indicates the desired vertical alignment of the text. Accepted values are "top", "middle", and "bottom".
 * @property {String} textColor The color to apply to the text. Accepts standard html font color attribute styles, ie: "red", "#f00", "#ff0000", "rgb(255,0,0)", etc. If a text color is not specified, and strokeWidth is non-zero, then the text will not be filled. If strokeWidth is zero or unspecified, the text color will default to black.
 * @property {Number} wrapWidth If specified, the text will 'wrap' according to the indicated wrap width (in pixels), ie: when a single line of text reaches the wrap length, it will automatically break to a new line.
 * @property {Number} lineSpacing The vertical spacing added between lines in multiline text. The value is a percentage of the font height. Default is 0.05 (5%).
 * @property {Number} strokeWidth The text stroke width (outlining). If 0, text stroke will be disabled.
 * @property {String} strokeColor The color to apply to the text stroke. Accepts standard html font color attribute styles, ie: "red", "#f00", "#ff0000", "rgb(255,0,0)", etc.
 * @constructor
 */
TGE.Text = function()
{
	TGE.Text.superclass.constructor.call(this);

	// Public members
	this.text = "";
	this.textID = "";
	this.fontFamily = "Arial";
	this.fontSize = 20;
	this.fontWeight = "normal";
	this.fontStyle = "normal";
	this.hAlign = "center";
	this.vAlign = "middle";
	this.textColor = null;
	this.wrapWidth = -1;
	this.lineSpacing = 0.05;
	this.strokeWidth = 0;
	this.strokeColor = null;
	this.cacheAsBitmap = TGE.Text.CacheByDefault;
	this.cacheBitmapScale = 1;

	// Private members
	this._mPreviousText = null;
	this._mPreviousTextID = null;
	this._mPreviousFont = null;
	this._mPreviousWrapWidth = null;
	this._mPreviousLineSpacing = 0;
	this._mLines = [];
	this._mLineHeight = 0;
	this._mLineSpace = 0;
	this._mCachePadding = 0;
    this._mFontFallbacks = [];
	this._mVerticalPosition = 0;

    // Cached keyboard image
	this._mOffscreenCanvas = null;
	this._mOffscreenContext = null;
	this._mTx = 1;
	this._mTy = 1;

	// Some renderers (like WebGL) require their own image of the text for rendering
	this._mRendererImage = null;

	// Caching? (just in case setup isn't called and we're defaulting to true - WebGL)
	if(this.cacheAsBitmap)
	{
		this._mOffscreenCanvas = document.createElement('canvas');
		this._mOffscreenContext = this._mOffscreenCanvas.getContext('2d');
	}

	return this;
}

TGE.Text.CacheByDefault = false;
TGE.Text.DefaultBitmapScale = 2.0;
TGE.Text.CachePaddingPercent = 0.4; // Percent of line height
TGE.Text.LoggedFontDeprecated = false;

/** @ignore */
TGE.Text._sAsianLanguages = ["ja","zh","tw","ko","th"];

/** @ignore */
TGE.Text._sRightToLeftLangages =  ["ar", "he", "he-il", "ar-ae", "ar-bh", "ar-dz", "ar-eg", "ar-iq", "ar-jo", "ar-sa"];

/**
 * The TGE.Text.TextIDs object is used to define translations for textID values.
 * @constant
 */
TGE.Text.TextIDs = null;

/** @ignore deprecated, but we're keeping this around just in case an old game references it */
TGE.Text.Language = "en";

/**
 * TGE.Text.TextIDs replaced TGE.Text.LocalizedStrings
 * @ignore
 * @deprecated
 */
TGE.Text.LocalizedStrings = null;

/* An example of a valid localized string table would look like this:

 TGE.Text.TextIDs =
 {
	 "greeting": {
		 "en": "Hello!",
		 "it": "Ciao!",
		 "nl": "Hallo!"
	 },

	 "question1": {
		 "en": "How are you?",
		 "it": "Come stai?",
		 "nl": "Hoe gaat het?"
	 },
 	"tutorialText": "Click the space here!"
 };
 */

/**
 * TGE.Text.GetString will return the translated version of a string specified by the textID key. The key and translation must exist in the TGE.Text.TextIDs object.
 * If a translation is not provided for the specified key, the English version will be returned. If the key does not exist in the table at all, an empty string is returned.
 * @param {String} textID The lookup key for the desired text to be translated.
 * @returns {String} The localized string for the specified key.
 */
TGE.Text.GetString = function(textID)
{
    TGE.Text.TextIDs = TGE.Text.LocalizedStrings = TGE.Text.LocalizedStrings || TGE.Text.TextIDs || {};

    var translations = TGE.Text.TextIDs[textID];
    if(!translations)
    {
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.Text.TextIDs has no translations for id '" + textID + "'");
		return "";
    }

    // Use English if we can't find the localized version we want
    if (typeof translations === "string")
    {
        return translations;
    }
    else
    {
        return translations[TGE.RemoteSettings("lang")] || translations["en"] || "";
    }
}


TGE.Text.prototype =
{
	/**
	 * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
	 * @param {Object} params Information used to initialize the object.
	 * @param {String} [params.text] The text to be displayed.
	 * @param {String} [params.textID] When using localized strings, textID is the lookup key for the desired text to be used. This parameter overrides the 'text' parameter.
	 * @param {String} [params.textDef] Gets properties for this object from GameConfig.TEXT_DEFS
	 * @param {String} [params.fontFamily] Indicates the font used for rendering the text. For example, "Arial", "Tahoma", etc.
     * @param {Array} [params.fontFallbacks] An array of fonts (as Strings) that will be used if the font specified for fontFamily is not supported by the environment.  Each font in the fontFallback array will be tried in order until one is supported.
     * @param {String} [params.fontSize] Indicates font size.  Specify as an int. For Example, 12, 40, etc.
	 * @param {String} [params.fontWeight] Indicates thickness of the font.  Can be specified as "normal", "bold", "bolder", "lighter", or as any number value.
	 * @param {String} [params.fontStyle] Indicates style of the font.  Can be specified as "normal" or "italic".
	 * @param {String} [params.hAlign] Indicates the desired horizontal alignment of the text. Accepted values are "left", "center", "right", and "justify".
	 * @param {String} [params.vAlign] Indicates the desired vertical alignment of the text. Accepted values are "top", "middle", and "down".
	 * @param {String} [params.textColor] The fill color to apply to the text. Accepts standard html font color attribute styles, ie: "red", "#f00", "#ff0000", "rgb(255,0,0)", etc. If a text color is not specified, and strokeWidth is non-zero, then the text will not be filled. If strokeWidth is zero or unspecified, the text color will default to black.
	 * @param {Number} [params.wrapWidth] If specified, the text will 'wrap' according to the indicated wrap width (in pixels), ie: when a single line of text reaches the wrap length, it will automatically break to a new line.
	 * @param {Number} [params.lineSpacing] The vertical spacing added between lines in multiline text. The value is a percentage of the font height. Default is 0.05 (5%).
	 * @param {Number} [params.strokeWidth=0] The text stroke width (outlining) to use. If 0, text stroke will be disabled.
	 * @param {String} [params.strokeColor] The color to apply to the text stroke. Accepts standard html font color attribute styles, ie: "red", "#f00", "#ff0000", "rgb(255,0,0)", etc.
	 * @return {TGE.Text} Returns this object.
	 */
	setup: function(params)
	{
		TGE.Text.superclass.setup.call(this,params);

		this.textDef = params.textDef || null;
		typeof(params.text)==="string" || typeof(params.text)==="number" ? this.text = params.text : null;
		typeof(params.textID)==="string" ? this.textID = params.textID : null;
		typeof(params.fontFamily)==="string" ? this.fontFamily = params.fontFamily : null;
		typeof(params.fontSize)==="number" ? this.fontSize = params.fontSize : null;
		typeof(params.fontStyle)==="string" ? this.fontStyle = params.fontStyle : null;
		typeof(params.hAlign)==="string" ? this.hAlign = params.hAlign : null;
		typeof(params.vAlign)==="string" ? this.vAlign = params.vAlign : null;
		typeof(params.color)==="string" ? this.textColor = params.color : null; // Deprecated (PAN-447)
		typeof(params.textColor)==="string" ? this.textColor = params.textColor : null;
		typeof(params.wrapWidth)==="number" ? this.wrapWidth = params.wrapWidth : -1;
		typeof(params.lineSpacing)==="number" ? this.lineSpacing = params.lineSpacing : 0.05;
		typeof(params.strokeWidth)==="number" ? this.strokeWidth = params.strokeWidth : 0;
		typeof(params.strokeColor)==="string" ? this.strokeColor = params.strokeColor : null;
		this.cacheAsBitmap = typeof(params.cacheAsBitmap)==="boolean" ? params.cacheAsBitmap : TGE.Text.CacheByDefault;
		this.cacheBitmapScale = typeof(params.cacheBitmapScale)==="number" ? params.cacheBitmapScale : TGE.Text.DefaultBitmapScale;
		Array.isArray(params.fontFallbacks) ? this.fontFallbacks = params.fontFallbacks : null;

		// Check if fontWeight is valid input
		if (typeof(params.fontWeight)==="string" && (params.fontWeight==="bold" || params.fontWeight==="bolder"
			|| params.fontWeight==="lighter" || params.fontWeight==="normal"))
		{
			this.fontWeight = params.fontWeight;
		}
		else if (typeof(params.fontWeight)==="number")
		{
			var fw = parseInt(this.fontWeight);
			if (fw && (fw<100 || fw>900))
			{
				TGE.Debug.Log(TGE.Debug.LOG_ERROR, "fontWeight must be bold, bolder, lighter, normal, or an int between 100 and 900");
			}
			else
			{
				this.fontWeight = params.fontWeight;
			}
		}

		// Split up old font property into parts
		if (typeof(params.font)==="string")
		{
			this._splitUpFont(params.font);
		}

		// Check if textDef is valid
		if (typeof(params.textDef)==="string")
		{
			if (GameConfig.TEXT_DEFS && GameConfig.TEXT_DEFS[params.textDef])
			{
				// PAN-1483 apply the textDef before initial call to _textChanged()
				this._applyTextDef(params.textDef);
			}
			else
			{
				TGE.Debug.Log(TGE.Debug.LOG_ERROR, "GameConfig.TEXT_DEFS is missing entry for: " + params.textDef);
			}
		}

		// Caching?
		if(this.cacheAsBitmap && !this._mOffscreenCanvas)
		{
			this._mOffscreenCanvas = document.createElement('canvas');
			this._mOffscreenContext = this._mOffscreenCanvas.getContext('2d');
		}

        this.text = this._getText(); // PAN-601

		this._textChanged();

		//if this is a rtl lang, we need to reverse the punctuation
		this.text = this._rtlLanguage() ? this._reverseSymbols() : this.text;

		this._textChanged();

		return this;
    },

	/** @ignore */
    _getText: function()
    {
        // Is this text meant to be translated?
        if (this.textID)
        {
           return TGE.Text.GetString(this.textID);
        }

        // Use .toString because of PFF-11
        return this.text.toString();
    },

	/** @ignore */
	_textChanged: function(renderer)
	{
		// PAN-604 Old TGE 0.3 games that use the bridge were overriding _calculateDimensions to a nop in order to work
		// around a bizarre tweening error. However this results in no text if you're using WebGL or offscreen caching.
		// As a workaround that doesn't involve updating the bridge lib, the _calculateDimensions method has been renamed
		// _textChanged. The existence of TGE.GameWorldEntity means that the bridge is being used and the original hack is required.
		if(TGE["GameWorldEntity"] && !this._mOffscreenCanvas)
		{
			return;
		}

		var canvasContext = this._mOffscreenContext ? this._mOffscreenContext : this._mFullStage._mRenderer.getCanvasContext();

		canvasContext.save();

		canvasContext.font = this.font;
		this._mLines = [];

		// Determine the height (this is not accurate - but it's not critical anyways)
		this._mLineHeight = 30;
		this._mLineSpace = 0;
		try
		{
			var pos = this.font.indexOf("px");
			var ss =  this.font.substring(0,pos).replace(/[^\d.]/g, '');
			this._mLineHeight = parseInt(ss,10);
			this._mLineSpace = (this._mLineHeight*this.lineSpacing)>>0;
			this._mLineHeight += this._mLineSpace;
		}
		catch(e) {}

		// Will there be line breaks?
		if(this.wrapWidth>0 || this.text.indexOf("\n")!==-1)
		{
			var asian = this._asianLanguage();

			// Figure out the width of a whitespace if we want justified text
			var whitespaceWidth = 1;
			if(this.hAlign==="justify")
			{
				var whitespaceWidth = canvasContext.measureText("     ").width/5;
			}

			this.width = this.wrapWidth;
			var wrapWidth = this.wrapWidth>0 ? this.wrapWidth : Number.MAX_VALUE;
			this.textWidth = 0;

			var lines = this.text.split("\n");
			for(var l=0; l<lines.length; ++l)
			{
				var words = this._splitLine(lines[l]);
				var line = words[0];
				var lineWidth = canvasContext.measureText(line).width;
				var textDimensions;
				for(var w=1; w<words.length; w++)
				{
					var newLine = line + (asian ? "" : " ") + words[w];
					textDimensions = canvasContext.measureText(newLine);
					if(textDimensions.width>wrapWidth)
					{
						// New line
						this._addLine(line,lineWidth,whitespaceWidth,false);
						line = words[w];
						lineWidth = canvasContext.measureText(line).width;
					}
					else
					{
						line = newLine;
						lineWidth = textDimensions.width;
					}
				}
				this._addLine(line,lineWidth,whitespaceWidth,true);
			}
		}
		else
		{
			this._mLines.push(this.text);
			var textDimensions = canvasContext.measureText(this.text);
			this.textWidth = this.width = textDimensions.width;
		}
		this.height = this._mLineHeight*this._mLines.length - this._mLineSpace; // PAN-505

		// Set the registration points to match the text alignment settings
		this.registrationX = this.hAlign===null || this.hAlign==="center" ? 0.5 : (this.hAlign==="left" || this.hAlign==="justify" ? 0 : 1);
		this.registrationY = this.vAlign===null || this.vAlign==="middle" ? 0.5 : (this.vAlign==="top" ? 0 : 1);
		this._mLocalTransformDirty = true;

		// Determine where to begin vertically
		this._mVerticalPosition = 0;

		if(this.vAlign==="top")
		{
			var textMetrics = this.measureTextAdvanced(canvasContext, this._mLines[0]);
			this._mVerticalPosition = textMetrics.actualBoundingBoxAscent;
		}
		else if(this.vAlign==="middle")
		{
			var height = (this._mLines.length - 1) * this._mLineHeight;
			var textMetrics = this.measureTextAdvanced(canvasContext, this._mLines[this._mLines.length - 1]);
			this._mVerticalPosition = (-height / 2) + textMetrics.actualBoundingBoxAscent / 2;
		}
		else if(this.vAlign==="bottom")
		{
			var height = (this._mLines.length - 1) * this._mLineHeight;
			var textMetrics = this.measureTextAdvanced(canvasContext, this._mLines[this._mLines.length - 1]);
			height += textMetrics.actualBoundingBoxDescent;
			this._mVerticalPosition = -height;
		}

		canvasContext.restore();

		// Update the bitmap cache
		if(this.cacheAsBitmap)
		{
			if(renderer)
			{
				this._mCachePadding = this._mLineHeight*TGE.Text.CachePaddingPercent;

				// Hack to clear matrix stack
				this._mOffscreenCanvas.width = 0;

				// New size
				var w = (this.width+this._mCachePadding*2)*this.cacheBitmapScale;
				var h = (this.height+this._mCachePadding*2)*this.cacheBitmapScale;
				var w2 = renderer.getImageSize(w);
				var h2 = renderer.getImageSize(h);
				this._mTx = w/w2;
				this._mTy = h/h2;

				this._mOffscreenCanvas.width = w2;
				this._mOffscreenCanvas.height = h2;

				// Clear the canvas so we're not re-drawing the text
				this._mOffscreenContext.clearRect(0,0,this._mOffscreenCanvas.width,this._mOffscreenCanvas.height);

				// Some renderers (WebGL) require an opaque black and white text image. This is because rendering the
				// text with an alpha background leads to grey edges. Instead we use a custom shader to ensure the
				// edges are smooth by using the color channel as the alpha.
				if(renderer.alphamapOffscreenText())
				{
					// Black background
					this._mOffscreenContext.fillStyle = "#000";
					this._mOffscreenContext.fillRect(0,0,this._mOffscreenCanvas.width,this._mOffscreenCanvas.height);

					// White text
					var oc = this.textColor;
					this.textColor = "#fff";
					this._objectDraw(null,this._mOffscreenContext);
					this.textColor = oc;
				}
				else
				{
					// Draw it normally
					this._objectDraw(null,this._mOffscreenContext);
				}

				// Update the renderer specific version of the text image
				this._mRendererImage = renderer.updateTextImage(this._mRendererImage,this._mOffscreenCanvas);
			}
			else
			{
				// We don't have a renderer yet (must be from the setup call). ????
				this._mPreviousText = this._mPreviousTextID = null;
			}
		}

        // PAN-717 changing text almost certainly will affect the width of the object, so the responsive properties should be re-evaluated
        if(this.parent)
        {
            this.handleEvent(TGE._ResizeEvent);
        }
	},
	/** @ignore */
	_rtlLanguage: function()
	{
		return TGE.Text._sRightToLeftLangages.indexOf(TGE.RemoteSettings("lang"))!==-1 && this._endPunctuation();
	},
	/** @ignore */
	_asianLanguage: function()
	{
	    var coreLang = TGE.RemoteSettings("lang").split("-")[0];
		return TGE.Text._sAsianLanguages.indexOf(coreLang)!==-1;
	},
	/** @ignore */
	_endPunctuation: function()
	{
		if(this.text[this.text.length-1] == "!" || this.text[this.text.length-1] == "." || this.text[this.text.length-1] == "?" || this.text[this.text.length-1] == ":")
		{
			return true;
		}
	},
	/** @ignore */
	_reverseSymbols: function()
	{

		var replacement = "";
		var line = this._mLines[this._mLines.length-1];
		var curString = "";
		var punc = this.text[this.text.length-1];

		for(var i = 0; i < line.length-1; i ++)
		{
			replacement+=line[i];
		}

		for(var i = 0; i < this._mLines.length; i ++)
		{
			if(i != this._mLines.length-1)
			{
				curString += this._mLines[i];
				curString += " ";
			}
		}

		return curString + punc + replacement;
	},
	/** @ignore */
	_splitLine: function(line)
	{
		// If we wanted to be really correct about this we would combine characters in asian strings that are beside
		// characters which cannot be on the beginning or end of a line. See:
		// https://msdn.microsoft.com/en-us/goglobal/bb688158.aspx
		// https://en.wikipedia.org/wiki/Line_breaking_rules_in_East_Asian_languages
		return this._asianLanguage() ? line : line.split(" ");
	},

	/** @ignore */
	_addLine: function(line,lineWidth,whitespaceWidth,lastLine)
	{
		// If we're using justified alignment, insert whitespaces to make the line fit
		if(this.wrapWidth>0 && this.hAlign==="justify" && !lastLine)
		{
			var needed = this.wrapWidth-lineWidth;
			var numSpaces = Math.round(needed/whitespaceWidth);

			var words = line.split(" ");
			var numWords = words.length;
			if(numWords>1)
			{
				var spaces = [];
				for(var w=1; w<=numWords-1; w++)
				{
					var minExtra = Math.floor(numSpaces/(numWords-1));
					var spacesStr = Array(minExtra+2).join(" ");
					spaces.push(spacesStr);
				}

				// Deal with any leftover that we couldn't evenly distribute
				var numLeftover = numSpaces - minExtra*spaces.length;
				if(numLeftover>0)
				{
					var indices = [];
					var len = spaces.length;
					for(var i=0; i<len; i++) { indices.push(i); }
					for(i=0; i<len; i++)
					{
						var ri = Math.floor(Math.random()*len);
						var t = indices[i];
						indices[i] = indices[ri];
						indices[ri] = t;
					}
					for(i=0; i<numLeftover; i++)
					{
						spaces[indices[i]] = spaces[indices[i]]+" ";
					}
				}

				// Rebuild the line
				line = "";
				for(var w=0; w<numWords-1; w++)
				{
					line = line.concat(words[w]);
					line = line.concat(spaces[w]);
				}
				line = line.concat(words[w]);
			}

			lineWidth += numSpaces*whitespaceWidth;
		}

		this._mLines.push(line);
		this.width = Math.max(this.width,lineWidth);
		this.textWidth = Math.max(this.textWidth,lineWidth);
	},

	_applyTextDef: function(textDef)
	{
		var def = textDef;
		var localizedDef;

		if (typeof textDef === "string")
		{
			if (GameConfig.TEXT_DEFS)
			{
				def = GameConfig.TEXT_DEFS[textDef];
				localizedDef = GameConfig.TEXT_DEFS[textDef + "_" + TGE.RemoteSettings("lang")];
				// make sure we don't generate an infinite recursion, which happened with orbitvenice (using the same naming convention, but in a different way)
				if (localizedDef && localizedDef.textDef === textDef)
				{
					localizedDef = null;
				}
			}
			else
			{
				def = null;
			}
		}

        if (def)
        {
            // apply derived textDefs first, in case they get overridden
            if (def.textDef)
            {
                this._applyTextDef(def.textDef);
            }

	        if (def.pickTextDef)
	        {
		        var subDef = def.pickTextDef.call(this, this.stage.height/this.stage.width);
		        if (def[subDef])
		        {
			        this._applyTextDef(def[subDef]);
		        }
		        else
		        {
			        TGE.Debug.Log(TGE.Debug.LOG_ERROR, subDef + " sub-object is not defined for textDef: " + textDef);
		        }
	        }
	        else if (def.portrait)
            {
	            this._applyTextDef(this.stage.isLandscape() ? def.landscape : def.portrait);
            }
            else
            {
	            for (var prop in def)
	            {
		            if (prop !== "textDef" && def[prop] != null)
		            {
			            this[prop] = def[prop];
		            }
	            }
	            // also apply localized props
				if (localizedDef)
				{
					for (prop in localizedDef)
					{
						if (prop !== "textDef" && localizedDef[prop] != null)
						{
							this[prop] = localizedDef[prop];
						}
					}
				}
            }
        }
    },

	/** @ignore */
	_objectDraw: function(renderer,offscreenContext)
	{
		if (this.textDef)
		{
			this._applyTextDef(this.textDef);
		}

		// Anything to draw?
		if(!this.textID && (this.text===null || this.text===""))
		{
			return;
		}

		// Check for property changes that require the dimensions to be recalculated
		if(this._mPreviousText!==this._getText() || this._mPreviousTextID!==this.textID || this._mPreviousLineSpacing!==this.lineSpacing ||
			this._mPreviousFont!==this.font || this._mPreviousWrapWidth!==this.wrapWidth)
		{
			this._mPreviousTextID = this.textID;
			this._mPreviousText = this.text = this._getText();
			this._mPreviousLineSpacing = this.lineSpacing;
			this._mPreviousFont = this.font;
			this._mPreviousWrapWidth = this.wrapWidth;
			this._mLines = []; // <-- Another catch for 0.3 games (PAN-310)

			// No need to call _textChanged if an offscreen canvas was passed in (means we came from _textChanged)
			if(!offscreenContext)
			{
				this._textChanged(renderer);
			}
		}

		// Catch for 0.3 games
		if(this._mLines.length===0)
		{
			this._mLines.push(this.text);
		}

		// Cached bitmap or canvas text?
		if(this.cacheAsBitmap && !offscreenContext)
		{
			// Make sure we have a renderer specific image
			if(!this._mRendererImage)
			{
				this._mRendererImage = renderer.updateTextImage(this._mRendererImage,this._mOffscreenCanvas)
			}

			renderer.drawTextImage(this._mRendererImage,this.textColor,this.width,this.height,this._mCachePadding,this._mTx,this._mTy);
		}
		else
		{
			// If we got here without an offscreenContext passed in, then we must be using a canvas renderer
			var canvasContext = offscreenContext ? offscreenContext : renderer.getCanvasContext();

			// Re-apply the world transform, but without the registration settings (this is handled automatically
			// by the text alignment settings)
			if(offscreenContext)
			{
				var x = this.hAlign === "center" ? this.width / 2 : (this.hAlign==="justify" || this.hAlign==="left" ? 0 : this.width);
				x += this._mCachePadding;
				x *= this.cacheBitmapScale;
				var y = (this.height / 2 + this._mCachePadding) * this.cacheBitmapScale;
				canvasContext.setTransform(this.cacheBitmapScale, 0, 0, this.cacheBitmapScale, x, y);
			}
			else
			{
				var stageScale = (this._mFullStage!==null && this._mFullStage._mScale!==1) ? this._mFullStage._mScale : 1;
				renderer.setWorldTransform(this._mWorldTransformNoReg,stageScale);
			}

			// Set the horizontal alignment
			canvasContext.textAlign = this.hAlign!==null ? (this.hAlign==="justify" ? "left" : this.hAlign) : "center";

			// We're always going to use alphabetic baseline, because it is the most consistent between browsers/platforms
			canvasContext.textBaseline = "alphabetic";

			// Load the text properties
			canvasContext.font = this.font!==null ? this.font : "Arial";
			canvasContext.fillStyle = this.textColor!==null ? this.textColor : "#000";

			// Stroke?
			if(this.strokeWidth>0)
			{
				canvasContext.lineWidth = this.strokeWidth;
				canvasContext.strokeStyle = this.strokeColor!==null ? this.strokeColor : "#fff";
				canvasContext.lineJoin = "round"; // PAN-602 Eliminate the crazy spikes when the stroke is large
			}

			// Draw the text
			var y = this._mVerticalPosition;
			for(var i=0; i<this._mLines.length; i++)
			{
				// PAN-602 It looks better to call fill after stroke, otherwise the stroke overlays the letters
				if(this.strokeWidth>0)
				{
					canvasContext.strokeText(this._mLines[i],0,y);
				}

				if(this.textColor!==null || this.strokeWidth===0)
				{
					canvasContext.fillText(this._mLines[i],0,y);
				}

				y += this._mLineHeight;
			}

			// PAN-602 Default back to miter since we're not fully aware of the implications in leaving it
			// as round from the stroke text
			if(this.strokeWidth>0)
			{
				canvasContext.lineJoin = "miter";
			}
		}
	},

	/** @ignore */
	measureTextAdvanced: function(canvasContext, text)
	{
		// We use this function when we need actualBoundingBoxAscent and actualBoundingBoxDescent

		// See if we get it natively, that's the best case
		var metrics = canvasContext.measureText(text);

		// Test whether we have everything we need
		if (typeof metrics.actualBoundingBoxAscent === "number" && typeof metrics.actualBoundingBoxDescent === "number")
		{
			return metrics;
		}

		// We're going to need to calculate them manually...
		var canvasWidth = Math.ceil(metrics.width);
		var canvasHeight = this._mLineHeight * 2;

		// Setup a canvas for rendering the characters to
		var canvas = document.createElement("canvas");

		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		var ctx = canvas.getContext('2d');

		// Fill the canvas with white
		ctx.beginPath();
		ctx.rect(0, 0, canvasWidth, canvasHeight);
		ctx.fillStyle = "white";
		ctx.fill();

		var drawX = Math.floor(canvasWidth / 2);
		var drawY = Math.floor(canvasHeight / 2);
		ctx.font = this.font;
		ctx.fillStyle = "black";
		ctx.textAlign = "center";
		ctx.textBaseline = "alphabetic";
		ctx.fillText(text, drawX, drawY);

		// Find the top and bottom of the text (instances of black as we scan top-down)
		var top = drawX;
		var bottom = drawY;

		var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
		for (var y = 0; y < canvasHeight; y++)
		{
			for (var x = 0; x < canvasWidth; x++)
			{
				var redIndex = y * (canvasWidth * 4) + x * 4;
				if ((imageData.data[redIndex]) <= 100) // is black
				{
					// See if we extended any of our ranges
					if (y < top)
					{
						top = y;
					}
					if (y > bottom)
					{
						bottom = y;
					}
				}
			}
		}

		// Create a new object to return
		var newMetrics = {
			width: metrics.width,
			actualBoundingBoxAscent: drawY - top,
			actualBoundingBoxDescent: bottom - drawY
		};

		return newMetrics;
	},

	/** @ignore */
	_splitUpFont: function(font)
	{
		// Show warning if syntax isn't perfect
		// Corect syntax is:  [fontStyle](optional) [fontWeight](optional) [fontSize]px [fontFamily]
		// fontStyle:  (normal\s|italic\s|)
		// fontWeight: (bolder\s|bold\s|lighter\s|normal\s|[0-9]{1,3}\s|)
		// fontSize:   [0-9]+\.?[0-9]*(px|pt)\s
		// fontFamily: [A-z0-9-,\s]+
		var correctFormatRegex = /^(normal\s|italic\s|)(bolder\s|bold\s|lighter\s|normal\s|[0-9]{3}\s|)[0-9]+\.?[0-9]*(px|pt)\s[A-z0-9-,\s]+$/;
		var otherCorrectFormatRegex = /^(bolder\s|bold\s|lighter\s|normal\s|)(normal\s|italic\s|[0-9]{3}\s|)[0-9]+\.?[0-9]*(px|pt)\s[A-z0-9-,\s]+$/;


		if (!font.match(correctFormatRegex) && !font.match(otherCorrectFormatRegex))
		{
			TGE.Debug.Log(TGE.Debug.LOG_ERROR, font + " is incorrect font format. Correct format is: [fontStyle](optional) [fontWeight](optional) [fontSize]px [fontFamily]");
		}

		// Show warning because font property is deprecated
		if (!TGE.Text.LoggedFontDeprecated)
		{
			TGE.Text.LoggedFontDeprecated = true;
			TGE.Debug.Log(TGE.Debug.LOG_WARNING, "Font property is deprecated. Use fontFamily, fontSize, fontWeight, and fontStyle.");
		}

		// Get fontStyle
		var fontStyleRegex = /\bitalic\b/;
		var fontStyle = font.match(fontStyleRegex);
		fontStyle ? this.fontStyle = fontStyle[0] : null;

		// Get fontWeight
		var fontWeightRegex = /\b(bolder|bold|lighter|[0-9]{1,3})(?=\s)/g;
		var fontWeight = font.match(fontWeightRegex);
		fontWeight ? this.fontWeight = (!isNaN(fontWeight[0]) ? parseFloat(fontWeight[0]) : fontWeight[0]) : null;

		// Get fontSize
		var fontSizeRegex = /[0-9]+\.?[0-9]*(?=(px|pt))/g;
		var fontSize = font.match(fontSizeRegex);
		fontSize ? this.fontSize = parseFloat(fontSize[0]) : null;

		// Get fontFamily
		var fontFamilyRegex = /(?:px\s|pt\s)([A-z0-9-,\s]+)$/;
		var fontFamily = font.match(fontFamilyRegex);
		fontFamily ? this.fontFamily = fontFamily[1] : null;
	}
}
extend(TGE.Text,TGE.DisplayObjectContainer);

/**
 * PAN-537 Deprecate 'font' property
 * @ignore
 * */
Object.defineProperty(TGE.Text.prototype, 'font', {

	get: function()
	{
		var fontDef = window._TREFONTS && _TREFONTS[this.fontFamily]; // We can only be sure we don't have bold if it's a TreFont
		var iosBoldHack = TGE.BrowserDetect.oniOS && // Only an iOS issue
			this.fontWeight==="bold" && fontDef && // Only a problem when bold is set
			(typeof(fontDef.data)==="string" || // If the data object is the dataURL, then we only have the one (regular) weight
			 typeof(fontDef.data["700"])==="undefined"); // Or if we have weight objects but nothing for 700
		
		return this.fontStyle + " " + (iosBoldHack ? "" : (this.fontWeight + " ")) + this.fontSize + "px '" + this.fontFamily + "'" + this.fontFallbacks + ", sans-serif";
	},

	set: function(font)
	{
		this._splitUpFont(font);
	}
});

/**
 * PAN-695 Allow 'color' to be used as a property to set textColor
 * @ignore
 * */
Object.defineProperty(TGE.Text.prototype, 'color', {
    get: function()
    {
        return this.textColor;
    },

    set: function(color)
    {
        this.textColor = color;
    }
});

/**
 * PAN-946 Create fontFallbacks param that allows default fallback font overrides
 * @ignore
* */
Object.defineProperty(TGE.Text.prototype, 'fontFallbacks', {
	get: function()
	{
		var fontFallbacks = "";
		for (var i in this._mFontFallbacks)
		{
			fontFallbacks += ", '" + this._mFontFallbacks[i] + "'";
		}
		return fontFallbacks;
	},

	set: function(fallbacks)
	{
		this._mFontFallbacks = fallbacks;
	}
});

// NOTE: if we add any additional setters here, be advised that _applyTextDef() can result
// in properties being set twice, as it applies base and localized textDefs in sequence
