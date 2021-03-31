/**
 * <p>The PromoScreen class is a type of Window used for quickly specifying and displaying user interface elements that most promo screens require.  It also handles common functions that all promo screens do like triggering a generic analytics call and handling clickthrus.</p>
 * @class A type of Window that is used to display common promo screen visuals.
 * @extends TGE.Window
 * @property {String} [type] The type parameter indicates the general classification of the promo screen. Possible examples: "final" (default), "replay", "continue".
 * @property {String} [reason] The reason is an optional parameter added to the analytics call to indicate any extra information that should be relayed.  For example, reason could be either "won" or "lost" for a final promo screen.
 * @property {String} entrance A string specifying which preset entrance animation to use for the popup object.  Possible entrances are:  "fade", "none", "bounce", "grow", and "slide".
 * @property {Number} delayBeforeClickable The amount of time in seconds before the promo screen becomes clickable.
 * @property {Function} pressFunction A function that can override the default click function of linking to the app store. It will trigger when popup is clicked.
 * @property {Object} overlay A javascript object that should define characteristics of an overlay that will be attached to the PromoScreen window.  A TGE.DisplayObjectContainer is created by default, and any parameters inside this object will be passed directly into the overlay TGE.DsplayObjectContainer.
 * @property {Object} popup A javascript object that should define characteristics of the promo popup background that will be attached to the PromoScreen window.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
 * @property {Object} icon A javascript object that should define characteristics of the promo icon sprite that will be attached to popup.  If this property is included, a TGE.Sprite object will be created and any other params inside the object will be passed directly to this TGE.Sprite object.
 * @property {Object} button A javascript object that should define the characteristics of the button object that will be attached to the popup.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
 * @property {Object} buttonText A javascript object that should define the characteristics of the buttonText object that will be attached to the button.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
 * @property {Object} popupText A javascript object that should define the characteristics of the popupText object that will be attached to the popup.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
 * @constructor
 * @ignore
 */
TGE.PromoScreen = function(oldWindow)
{
	if (typeof(oldWindow)!=="object")
	{
		TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.PromoScreen requires gamescreen to be passed into its constructor.  For example, if you were calling this from gamescreen, it'd look like this:\nnew TGE.PromoScreen(this).setup({})");
	}

	TGE.PromoScreen.superclass.constructor.call(this, oldWindow.width, oldWindow.height);

	TGE.Game.SetUpdateRoot(this);

	// Public members
    this.type = TGE.PromoScreen.DefaultType;
    this.reason = TGE.PromoScreen.DefaultReason;
	this.entrance = TGE.PromoScreen.DefaultEntrance;
    this.delayBeforeClickable = TGE.PromoScreen.DefaultDelayBeforeClickable;
    this.pressFunction = this._openAppStore.bind(this);
	this.overlay = null;
	this.popup = null;
	this.icon = null;
	this.button = null;
	this.buttonText = null;
	this.popupText = null;

	// Private members
	this._mPopupBackground = null;
	this._mPossibleEntrances = ["fade", "none", "bounce", "grow", "slide"];
	this._mAcceptingClicks = true;
	this._mOldWindow = oldWindow;

	return this;
}

TGE.PromoScreen.DefaultType = "final";
TGE.PromoScreen.DefaultReason = null;
TGE.PromoScreen.DefaultEntrance = "bounce";
TGE.PromoScreen.DefaultDelayBeforeClickable = 0.5;
TGE.PromoScreen.DefaultDelayBetweenClickable = 3;

TGE.PromoScreen.DefaultOverlayBackgroundColor = "#000";
TGE.PromoScreen.DefaultOverlayAlpha = 0.5;

TGE.PromoScreen.DefaultPopupLayout = {
	xPercentage: 0.5,
	yPercentage: 0.5,
	scaleToWidth: 0.75,
	scaleToHeight: 0.95
};
TGE.PromoScreen.DefaultPopupBackgroundColor = "#1852ae";
TGE.PromoScreen.DefaultPopupWidth = 450;
TGE.PromoScreen.DefaultPopupHeight = 550;

TGE.PromoScreen.DefaultIconY = -145;

TGE.PromoScreen.DefaultButtonBackgroundColor = "#ff0a1b";
TGE.PromoScreen.DefaultButtonY = 150;
TGE.PromoScreen.DefaultButtonWidth = 290;
TGE.PromoScreen.DefaultButtonHeight = 65;

TGE.PromoScreen.DefaultButtonTextText = "GET THE APP";
TGE.PromoScreen.DefaultButtonTextColor = "#fff";
TGE.PromoScreen.DefaultButtonTextFontFamily = "Arial";
TGE.PromoScreen.DefaultButtonTextFontSize = 28;
TGE.PromoScreen.DefaultButtonTextFontWeight = "normal";

TGE.PromoScreen.DefaultPopupTextText = "Put your promo text here. Put your promo text here. Put your promo text here. Put your promo text here";
TGE.PromoScreen.DefaultPopupTextWrapWidthPercentage = 0.8;
TGE.PromoScreen.DefaultPopupTextFontFamily = "Arial";
TGE.PromoScreen.DefaultPopupTextFontSize = 30;
TGE.PromoScreen.DefaultPopupTextFontWeight = "normal";
TGE.PromoScreen.DefaultPopupTextColor = "#fff";
TGE.PromoScreen.DefaultPopupTextY = 20;

TGE.PromoScreen.prototype =
{
	/**
	 * Initializes the TGE.PromoScreen and creates all promo screen objects using the parameters specified.
     * @param {String} [type] The type parameter indicates the general classification of the promo screen. Possible examples: "final" (default), "replay", "continue".
     * @param {String} [reason] The reason is an optional parameter added to the analytics call to indicate any extra information that should be relayed.  For example, reason could be either "won" or "lost" for a final promo screen.
	 * @param {String} entrance A string specifying which preset entrance animation to use for the popup object.  Possible entrances are:  "fade", "none", "bounce", "grow", and "slide".
     * @param {Number} delayBeforeClickable The amount of time in seconds before the promo becomes clickable.
     * @param {Function} pressFunction A function that can override the default click function of linking to the app store. It will trigger when popup is clicked.
     * @param {Object} overlay A javascript object that should define characteristics of an overlay that will be attached to the PromoScreen window.  A TGE.DisplayObjectContainer is created by default, and any parameters inside this object will be passed directly into the overlay TGE.DsplayObjectContainer.
	 * @param {Object} popup A javascript object that should define characteristics of the promo popup background that will be attached to the PromoScreen window.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
	 * @param {Object} icon A javascript object that should define characteristics of the promo icon sprite that will be attached to popup.  If this property is included, a TGE.Sprite object will be created and any other params inside the object will be passed directly to this TGE.Sprite object.
	 * @param {Object} button A javascript object that should define the characteristics of the button object that will be attached to the popup.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
	 * @param {Object} buttonText A javascript object that should define the characteristics of the buttonText object that will be attached to the button.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
	 * @param {Object} popupText A javascript object that should define the characteristics of the popupText object that will be attached to the popup.  If an 'image' param is passed into this object, a TGE.Sprite object will be created and any other params inside the object will be passed directly in to that TGE.Sprite.  Otherwise a TGE.DisplayObjectContainer will be created and any parameters passed into the object will be passed directly into that TGE.DisplayObjectContainer.
	 * @return {TGE.PromoScreen} Returns the window.
	 */
    setup: function(params)
    {
        TGE.PromoScreen.superclass.setup.call(this,params);

        typeof(params.type)==="string" ? this.type = params.type : null;
        typeof(params.reason)==="string" ? this.reason = params.reason : null;
        typeof(params.delayBeforeClickable)==="number" ? this.delayBeforeClickable = params.delayBeforeClickable : null;
        (typeof(params.pressFunction)==="function" || params.pressFunction===null) ? this.pressFunction = params.pressFunction : null;

        // Entrance
        if (typeof(params.entrance)==="string")
        {
            if (this._mPossibleEntrances.indexOf(params.entrance)!==-1)
            {
                this.entrance = params.entrance;
            }
            else
            {
                var entrancesString = "";
                for (var i in this._mPossibleEntrances)
                {
                    entrancesString += this._mPossibleEntrances[i] + (i!=this._mPossibleEntrances.length-1 ? ", " : "");
                }
                TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Not a valid TGE.PromoScreen entrance type. Valid entrances are: " + entrancesString);
            }
        }

        // Make screen objects
        this._makeObjectsAndApplyParams(params);

        // Make promo screen clickable
        if (this.pressFunction!==null)
        {
            this.performAction({
                delay: this.delayBeforeClickable,
                action: this.popup.addEventListener.bind(this.popup, "click", this.pressFunction)
            });
        }

        // Register that the game has reached a completion state
        TGE.Completion(this.reason);

        // Enter popup
        this._transitionIn(this.entrance);

        this.show(this._mOldWindow);

        return this;
    },

	_makeObjectsAndApplyParams: function (params)
	{
		this.overlay = this.addChild(new TGE.Sprite().setup({
			backgroundColor: TGE.PromoScreen.DefaultOverlayBackgroundColor,
			alpha:           TGE.PromoScreen.DefaultOverlayAlpha,
			layout:          "match",
		}));
		if (typeof(params.popup)==="object")
		{
			if (typeof(params.popup.image)==="string")
			{
				this.popup = this.addChild(new TGE.Sprite().setup({
					image:  params.popup.image,
					layout: TGE.PromoScreen.DefaultPopupLayout
				}));
			}
			else
			{
				this.popup = this.addChild(new TGE.DisplayObjectContainer().setup({
					width:  TGE.PromoScreen.DefaultPopupWidth,
					height: TGE.PromoScreen.DefaultPopupHeight,
					layout: TGE.PromoScreen.DefaultPopupLayout
				}));
				this._mPopupBackground = this.popup.addChild(new TGE.DisplayObjectContainer().setup({
					width: 100,
					height: 100,
					backgroundColor: TGE.PromoScreen.DefaultPopupBackgroundColor,
					layout: function() {
						this.width  = this.parent.width;
						this.height = this.parent.height;
					}
				}));
			}
		}
		else
		{
			this.popup = this.addChild(new TGE.DisplayObjectContainer().setup({
				width:  TGE.PromoScreen.DefaultPopupWidth,
				height: TGE.PromoScreen.DefaultPopupHeight,
				layout: TGE.PromoScreen.DefaultPopupLayout
			}));
			this._mPopupBackground = this.popup.addChild(new TGE.DisplayObjectContainer().setup({
				width: 100,
				height: 100,
				layout: function() {
					this.width  = this.parent.width;
					this.height = this.parent.height;
				}
			}));
		}
		if (typeof(params.icon)==="object" && typeof(params.icon.image)==="string")
		{
			this.icon = this.popup.addChild(new TGE.Sprite().setup({
				image: params.icon.image,
				y:     TGE.PromoScreen.DefaultIconY
			}));
		}
		if (typeof(params.button)==="object")
		{
			if (typeof(params.button.image)==="string")
			{
				this.button = this.popup.addChild(new TGE.Sprite().setup({
					image: params.button.image,
					y:     TGE.PromoScreen.DefaultButtonY
				}));
			}
			else if (typeof(params.button.backgroundColor==="string"))
			{
				this.button = this.popup.addChild(new TGE.DisplayObjectContainer().setup({
					backgroundColor: TGE.PromoScreen.DefaultButtonBackgroundColor,
					width:           TGE.PromoScreen.DefaultButtonWidth,
					height:          TGE.PromoScreen.DefaultButtonHeight,
					y:               TGE.PromoScreen.DefaultButtonY
				}));
				this.buttonText = this.button.addChild(new TGE.Text().setup({
					text:       TGE.PromoScreen.DefaultButtonTextText,
					fontFamily: TGE.PromoScreen.DefaultButtonTextFontFamily,
					fontSize:   TGE.PromoScreen.DefaultButtonTextFontSize,
					fontWeight: TGE.PromoScreen.DefaultButtonTextFontWeight,
					color:      TGE.PromoScreen.DefaultButtonTextColor
				}));
			}
		}
		if (typeof(params.buttonText)==="object")
		{
			if (this.buttonText)
			{
				this.buttonText.markForRemoval();
			}
			if (typeof(params.buttonText.image)==="string")
			{
				if (typeof(params.button)==="object")
				{
					this.buttonText = this.button.addChild(new TGE.Sprite().setup({
						image: params.buttonText.image
					}));
				}
				else
				{
					this.buttonText = this.popup.addChild(new TGE.Sprite().setup({
						image: params.buttonText.image,
						y:     TGE.PromoScreen.DefaultButtonY
					}));
				}
			}
			else
			{
				if (typeof(params.button)==="object")
				{
					this.buttonText = this.button.addChild(new TGE.Text().setup({
						text:       TGE.PromoScreen.DefaultButtonTextText,
						fontFamily: TGE.PromoScreen.DefaultButtonTextFontFamily,
						fontSize:   TGE.PromoScreen.DefaultButtonTextFontSize,
						fontWeight: TGE.PromoScreen.DefaultButtonTextFontWeight,
						color:      TGE.PromoScreen.DefaultButtonTextColor
					}));
				}
				else
				{
					this.buttonText = this.popup.addChild(new TGE.Text().setup({
						text:       TGE.PromoScreen.DefaultButtonTextText,
						fontFamily: TGE.PromoScreen.DefaultButtonTextFontFamily,
						fontSize:   TGE.PromoScreen.DefaultButtonTextFontSize,
						fontWeight: TGE.PromoScreen.DefaultButtonTextFontWeight,
						color:      TGE.PromoScreen.DefaultButtonTextColor,
						y:          TGE.PromoScreen.DefaultButtonY
					}));
				}
			}
		}
		if (typeof(params.popupText)==="object")
		{
			if (typeof(params.popupText.image)==="string")
			{
				this.popupText = this.popup.addChild(new TGE.Sprite().setup({
					image: params.popupText.image,
					y:     TGE.PromoScreen.DefaultPopupTextY
				}));
			}
			else
			{
				this.popupText = this.popup.addChild(new TGE.Text().setup({
					text:       TGE.PromoScreen.DefaultPopupTextText,
					wrapWidth:  TGE.PromoScreen.DefaultPopupTextWrapWidthPercentage * this.popup.width,
					fontFamily: TGE.PromoScreen.DefaultPopupTextFontFamily,
					fontSize:   TGE.PromoScreen.DefaultPopupTextFontSize,
					fontWeight: TGE.PromoScreen.DefaultPopupTextFontWeight,
					color:      TGE.PromoScreen.DefaultPopupTextColor,
					y:          TGE.PromoScreen.DefaultPopupTextY
				}));
			}
		}

		if (typeof(params.overlay)==="object")
		{
			for (var property in params.overlay)
			{
				if (params.overlay.hasOwnProperty(property))
				{
					this.overlay[property] = params.overlay[property];
				}
			}
		}
		if (typeof(params.popup)==="object")
		{
			for (var property in params.popup)
			{
				if (params.popup.hasOwnProperty(property) && property!=="image")
				{
					if (property==="backgroundColor" || property==="backgroundGradient" || property==="alpha")
					{
						if (this._mPopupBackground!==null)
						{
							this._mPopupBackground[property] = params.popup[property];
						}
					}
					else
					{
						this.popup[property] = params.popup[property];

						if (this._mPopupBackground && (property==="width" || property==="height"))
						{
							this._mPopupBackground[property] = params.popup[property];
						}
					}
				}

				// necessary because of a bug in TGE:  TGE should call a resize event
				if (params.popup.hasOwnProperty(property) && property==="width" || property==="height")
				{
					this.popup.handleEvent(TGE._ResizeEvent);
				}

				if (property==="scale")
				{
					TGE.Debug.Log(TGE.Debug.LOG_WARNING,"Scale is not a valid parameter for PromoScreen popup.  Since popup is a responsive object, use a layout parameter to manipulate its size.");
				}
			}
		}
		if (typeof(params.icon)==="object")
		{
			for (var property in params.icon)
			{
				if (params.icon.hasOwnProperty(property) && property!=="image")
				{
					this.icon[property] = params.icon[property];
				}
			}
		}
		if (typeof(params.button)==="object")
		{
			for (var property in params.button)
			{
				if (params.button.hasOwnProperty(property) && property!=="image")
				{
					this.button[property] = params.button[property];
				}
			}
		}
		if (typeof(params.buttonText)==="object")
		{
			for (var property in params.buttonText)
			{
				if (params.buttonText.hasOwnProperty(property))
				{
					this.buttonText[property] = params.buttonText[property];
				}
			}
		}
		if (typeof(params.popupText)==="object")
		{
			for (var property in params.popupText)
			{
				if (params.popupText.hasOwnProperty(property) && property!=="image")
				{
					this.popupText[property] = params.popupText[property];
				}
			}
		}
	},

	_openAppStore: function ()
	{
		if (this._mAcceptingClicks)
		{
            // After a certain amount of time, make promoscreen clickable again
            this._mAcceptingClicks = false;
            this.performAction({
                delay: TGE.PromoScreen.DefaultDelayBetweenClickable,
                action: function () {
                    this._mAcceptingClicks = true;
                }.bind(this)
            });

            TGE.Game.AppstoreClickthrough();
		}
	},

	_transitionIn: function (entrance)
	{
		if (entrance!=="none")
		{
			this.overlay.tweenFrom({
				alpha: 0,
				duration: 0.2
			});
		}
		if (entrance==="none")
		{
			//do nothing
		}
		else if (entrance==="bounce")
		{
			this.popup.tweenFrom({
				duration: 1,
				y: -this.height/2,
				easing: TGE.Tween.Bounce.Out
			});
		}
		else if (entrance==="slide")
		{
			this.popup.tweenFrom({
				x: -this.width/2,
				duration: 0.4,
				easing: TGE.Tween.Back.Out
			});
		}
		else if (entrance==="grow")
		{
			this.popup.tweenFrom({
				scale: 0,
				duration: 0.3,
				easing: TGE.Tween.Back.Out
			});
		}
		else if (entrance==="fade")
		{
			this.popup.tweenFrom({
				alpha: 0,
				duration: 0.5
			});
		}
	}
}
extend(TGE.PromoScreen,TGE.Window);