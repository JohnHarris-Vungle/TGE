/**
 * <p>The TGE.AdCloseButton is <strong>not</strong> meant to be instantiated by game code, if it is required it will be created by the ad container and available for customization via game code through the TGE.AdCloseButton.GetInstance() singleton.</p>
 * @class
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.AdHeader = function()
{
    // Assign the singleton
    if(TGE.AdHeader._sInstance!==null)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "there can be only one instance of a TGE.AdHeader object");
        return TGE.AdHeader._sInstance;
    }
    TGE.AdHeader._sInstance = this;

    TGE.AdHeader.superclass.constructor.call(this);

    this.closeButtonImage = null;
    this.closeFunction = null;

    // Default size
    this.width = this.height = 100;
}

/** @ignore */
TGE.AdHeader._sInstance = null;

/** @ignore */
TGE.AdHeader._sCustomSettings = {};

/** @ignore */
TGE.AdHeader._sButtonSize = 100;

/**
 * Creates an instance of the TGE.AdHeader object and adds it to the scene. This function should probably never be called by a game directly, it should only be called by the ad container.
 * @param {Function} callback The callback function that should be fired when the close button is clicked/tapped.
 * @returns {TGE.AdHeader|null} The instance of the TGE.AdHeader object, or null if it was too early to add it to the scene.
 */
TGE.AdHeader.Create = function(callback,closeButtonVisible)
{
    // We want this function to also add the button to the scene, so make sure the scene is ready
    if(!TGE.Game.GetInstance() || !TGE.Game.GetInstance().stage)
    {
        TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.AdHeader.Create was called too early - wait until the TGE game object has been launched");
        return null;
    }

    // If this is being called twice, nuke the old one
    if(TGE.AdHeader._sInstance!==null)
    {
        TGE.AdHeader._sInstance.markForRemoval();
        TGE.AdHeader._sInstance = null;
    }

    // Create the instance and add it to the full stage. On the full stage the game won't ever be able to cover it or remove it.
    var adHeader = TGE.Game.GetInstance()._mFullStage.addChild(new TGE.AdHeader().setup({
        //backgroundColor: "pink",
        registrationX: 0,
        registrationY: 0,
        width: 125,
        height: 125,
        layout: function() {
            // When we lock orientation we still want the close button (and ad header) to behave as if it's NOT
            // orientation locked, ie: if the device is in portrait, the close button should always be in the
            // upper right, even if the game is locked to landscape.
            if (TGE.GameStage._sOrientationLock.active)
            {
                this.width = this.stage.width;
                this.height = this.stage.height;

                var lockObj = TGE.GameStage._sOrientationLock;
                if (lockObj.gameHeight < lockObj.gameWidth)
                {
                    // Game is locked to landscape
                    this.rotation = -90;
                    this.y = this.stage.width;
                }
                else
                {
                    // Game is locked to portrait
                    this.rotation = 90;
                    this.x = this.stage.height;
                }
            }
            else
            {
                this.rotation = 0;
                this.x = this.y = 0;
                this.width = this.stage.width;
                this.height = this.stage.height;
            }
        }
    }));

    adHeader.header = adHeader.addChild(new TGE.DisplayObjectContainer().setup({
        //backgroundColor: "#f00",
        registrationX: 0,
        registrationY: 0,
        width: 125,
        height: 125,
        layout: function() {
            this.x = this.y = 0;
            this.width = this.stage.width;
            this.height = Math.min(this.stage.width*0.1,this.stage.height*0.1);
        }
    }));

    // Add a touch target for the close button
    adHeader.closeButton = adHeader.header.addChild(new TGE.DisplayObjectContainer().setup({
        //backgroundColor: "#0f0",
        width: TGE.AdHeader._sButtonSize,
        height: TGE.AdHeader._sButtonSize,
        layout: {
            topAnchor: 0,
            rightAnchor: 0,
            scaleToHeight: 1
        },
        visible: closeButtonVisible===true
    }));
    adHeader.closeFunction = callback;
    adHeader.closeButton.addEventListener("mousedown",callback);
    adHeader.closeButton.addEventListener("drawbegin", function(event)
    {
        // Don't draw anything if we're using a custom image
        if(this.parent.parent.closeButtonImage)
        {
            return;
        }

        var context = event.canvasContext;

        context.save();

        // Create the button in an offscreen canvas so we can draw it at reduced opacity and not have the drop shadow show through
        if(!this.offscreenContext)
        {
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenContext = this.offscreenCanvas.getContext('2d');
            this.offscreenCanvas.width = 0;
            this.offscreenCanvas.width = 100;
            this.offscreenCanvas.height = 100;

            this.offscreenContext.strokeStyle = "white";
            this.offscreenContext.lineWidth = 16;
            this.offscreenContext.lineCap = "round";
            this.offscreenContext.shadowColor = 'black';
            this.offscreenContext.shadowBlur = 21;
            this.offscreenContext.moveTo(25, 25);
            this.offscreenContext.lineTo(75, 75);
            this.offscreenContext.moveTo(75, 25);
            this.offscreenContext.lineTo(25, 75);
            this.offscreenContext.stroke();
        }

        // Draw our cached close button image at 30% opacity
        context.globalAlpha = 0.3 * this.alpha;
        context.drawImage(this.offscreenCanvas, 22, 22, 57, 57);

        context.restore();
    });

    adHeader.applyCustomSettings();
}

/**
 * Returns the single instance of the TGE.AdHeader object.
 * @returns {TGE.AdHeader|null} The single instance of the TGE.AdHeader object, or null if an instance of the button has not been created yet.
 */
TGE.AdHeader.GetInstance = function()
{
    return TGE.AdHeader._sInstance;
}

/**
 * Displays the close button in the upper right.
 */
TGE.AdHeader.ShowClose = function()
{
    if(TGE.AdHeader._sInstance)
    {
        TGE.AdHeader._sInstance.showCloseButton();
    }
}

/**
 * Displays the close button countdown timer in the upper left.
 */
TGE.AdHeader.ShowCountdown = function(seconds)
{
    if(TGE.AdHeader._sInstance && seconds>0)
    {
        TGE.AdHeader._sInstance.showCountdown(seconds);
    }
}

TGE.AdHeader.ShowRewardedPlayableOverlay = function()
{
    if(TGE.AdHeader._sInstance)
    {
        TGE.AdHeader._sInstance.showRewardedPlayableOverlay();
    }
}

TGE.AdHeader.CustomSettings = function(params)
{
    TGE.AdHeader._sCustomSettings = params;

    // If the header isn't ready the settings will get applied when it's created
    if(TGE.AdHeader._sInstance)
    {
        TGE.AdHeader._sInstance.applyCustomSettings();
    }
}

TGE.AdHeader.prototype =
{
    // This method should never be called more than once
    applyCustomSettings: function()
    {
        var settings = TGE.AdHeader._sCustomSettings;

        // Custom button image
        if(settings.closeImage)
        {
            this.closeButtonImage = this.closeButton.addChild(new TGE.Sprite().setup({
                image: settings.closeImage,
                scale: settings.closeImageScale ? settings.closeImageScale : 1
            }));
        }

        // Button scale and position offsets
        this.closeButton.layout = {
            topAnchor: settings.closeBoxTop ? settings.closeBoxTop : 0,
            rightAnchor: settings.closeBoxRight ? settings.closeBoxRight : 0,
            scaleToHeight: settings.closeBoxScale ? settings.closeBoxScale : 1
        }
    },

    showCloseButton: function()
    {
        if(this.closeButton.visible)
        {
            return;
        }

        this.closeButton.visible = true;
        this.closeButton.tweenFrom({
            alpha: 0,
            duration: 1.0
        });
    },

    showCountdown: function(seconds)
    {
        if(this.closeButton.visible)
        {
            return;
        }

        this.countdown = seconds;
        this.countdownText = this.header.addChild(new TGE.Text().setup({
            //backgroundColor: "#0f0",
            text: seconds.toString(),
            fontFamily: "Arial",
            fontSize: 25,
            fontWeight: "bold",
            fontStyle: "normal",
            textColor: "#fff",
            hAlign: "left",
            vAlign: "top",
            layout: {
                topAnchor: 0.013,
                leftAnchor: 0.017,
                scaleToHeight: 0.6
            }
        }));

        this.countdownText.addEventListener("drawbegin", function(event) {
            var context = event.canvasContext;
            context.save();
            context.shadowColor = "rgba(0, 0, 0, 1)";
            context.shadowBlur = 4 * this.scaleY;
        });

        this.countdownText.addEventListener("drawend", function(event) {
            event.canvasContext.restore();
        });

        this._countdownSecond();
    },

    showRewardedPlayableOverlay: function()
    {
        // Rewarded overlay
        this.rewardedOverlay = this.addChild(new TGE.DisplayObjectContainer().setup({
            registrationX: 0,
            registrationY: 0,
            width: 125,
            height: 125,
            layout: function () {
                this.x = this.y = 0;
                this.width = this.stage.width;
                this.height = this.stage.height;
            }
        }));
        this.rewardedOverlay.sendToBack();

        // Variables
        this.rewardedOverlay.timeVisible = 3;
        this.rewardedOverlay.timer = 0;

        // Destroy touch listener
        this.rewardedOverlay.addEventListener("mousedown", function() {
            this.exitRewardedPlayableOverlay();
        }.bind(this));

        // Destroy timer
        this.rewardedOverlay.addEventListener("update", function(event) {
            this.rewardedOverlay.timer += event.elapsedTime;
            if (this.rewardedOverlay.timer >= this.rewardedOverlay.timeVisible)
            {
                this.exitRewardedPlayableOverlay();
            }
        }.bind(this));

        // Background
        var background = this.rewardedOverlay.addChild(new TGE.DisplayObjectContainer().setup({
            backgroundColor: "black",
            alpha: 0.8,
            width: 125,
            height: 125,
            layout: "match"
        }));

        // Play button
        var playButton = this.rewardedOverlay.addChild(new TGE.DisplayObjectContainer().setup({
            width: 65,
            height: 15,
            layout: {
                xPercentage: 0.5,
                yPercentage: 0.59,
                scaleToWidth: 0.25,
                scaleToHeight: 0.08
            }
        }));
        playButton.fillStyle = "#5c8c43";
        playButton.strokeStyle = "white";

        // Message text
        var messageText = playButton.addChild(new TGE.Text().setup({
            text: "Play this game to earn your reward!",
            fontFamily: "Arial",
            fontSize: 20,
            color: "white",
            layout: {
                xPercentage: 0,
                yPercentage: -2,
                scaleToWidth: 3,
                scaleToHeight: 1
            }
        }));

        // Play button text
        var buttonText = playButton.addChild(new TGE.Text().setup({
            text: "Play Now",
            fontFamily: "Arial",
            fontSize: 8,
            color: "white",
            layout: {
                xPercentage: 0.07,
                yPercentage: 0.05,
                scaleToWidth: 0.5,
                scaleToHeight: 0.7
            }
        }));

        // Play button arrow
        var arrow = playButton.addChild(new TGE.DisplayObjectContainer().setup({
            width: 40,
            height: 50,
            layout: {
                anchorLeft: -0.35,
                yPercentage: 0,
                scaleToWidth: 0.2,
                scaleToHeight: 0.6
            }
        }));

        // Tresensa banner
        var banner = this.rewardedOverlay.addChild(new TGE.DisplayObjectContainer().setup({
            width: 240,
            height: 30,
            layout: {
                anchorLeft: 0,
                anchorBottom: 0,
                scaleToWidth: 0.4,
                scaleToHeight: 0.05
            }
        }));

        // Tresensa banner text
        banner.addChild(new TGE.Text().setup({
            text: "Playable Ads by",
            fontFamily: "Arial",
            fontSize: 16,
            color: "white",
            y: -15,
            x: 65,
            scaleX: 0.9
        }));

        // Tresensa banner text
        banner.addChild(new TGE.Text().setup({
            text: "TRESENSA",
            fontFamily: "Arial",
            fontSize: 16,
            fontStyle: "bold",
            color: "white",
            y: -15,
            x: 160,
            scaleX: 0.9
        }));

        playButton.addEventListener("drawbegin", function(event)
        {
            // Curved Rectangle
            this.cornerRadius = 1;
            var ctx = event.canvasContext;
            var x = 0;
            var y = 0;
            var w = this.width;
            var h = this.height;
            var r = this.cornerRadius;
            if ( w < 2 * r ) r = w / 2;
            if ( h < 2 * r ) r = h / 2;
            ctx.beginPath ();
            ctx.moveTo ( x + r, y );
            ctx.arcTo ( x + w, y, x + w, y + h, r );
            ctx.arcTo ( x + w, y + h, x, y + h, r );
            ctx.arcTo ( x, y + h, x, y, r );
            ctx.arcTo ( x, y, x + w, y, r );
            ctx.closePath ();
            ctx.fillStyle = this.fillStyle;
            ctx.strokeStyle = this.strokeStyle;
            ctx.lineWidth = 2;
            ctx.stroke ();
            ctx.fill ();
        });

        arrow.addEventListener("drawbegin", function(event)
        {
            // Triangle
            var w = this.width;
            var h = this.height;
            var ctx = event.canvasContext;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, h);
            ctx.lineTo(w, h/2);
            ctx.closePath();
            ctx.fillStyle = "white";
            ctx.fill ();
        });

        banner.addEventListener("drawbegin", function(event)
        {
            // Banner Shape
            var w = this.width;
            var h = this.height;
            var d = 20;
            var ctx = event.canvasContext;
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(0, 0);
            ctx.lineTo(w, 0);
            ctx.lineTo(w-d, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = "#ef2e24";
            ctx.fill ();
        });

        // Apply settings
        var settings = TGE.AdHeader._sCustomSettings;
        settings.rewardedOverlayMessageText ? messageText.text = settings.rewardedOverlayMessageText : null;
        settings.rewardedOverlayButtonText ? buttonText.text = settings.rewardedOverlayButtonText : null;
        settings.rewardedOverlayButtonColor ? playButton.fillStyle = settings.rewardedOverlayButtonColor : null;
        settings.rewardedOverlayBackgroundColor ? background.backgroundColor = settings.rewardedOverlayBackgroundColor : null;
        settings.rewardedOverlayBackgroundOpacity ? background.alpha = settings.rewardedOverlayBackgroundOpacity : null;
        settings.rewardedOverlayTimeVisible ? this.rewardedOverlay.timeVisible = settings.rewardedOverlayTimeVisible : null;

        // Enter
        this.enterRewardedPlayableOverlay();
    },

    enterRewardedPlayableOverlay: function()
    {
        this.rewardedOverlay.tweenFrom({
            alpha: 0,
            duration: 0.3
        });
    },

    exitRewardedPlayableOverlay: function()
    {
        this.rewardedOverlay.tweenTo({
            y: this.rewardedOverlay.height,
            duration: 0.8,
            easing: TGE.Tween.Back.Out
        });
    },

    _countdownSecond: function()
    {
        if(this.countdown<=0)
        {
            this.countdownText.markForRemoval();
            this.countdownText = null;
        }
        else
        {
            this.countdownText.text = this.countdown;
            this.countdownText.clearTweens();
            this.countdownText.alpha = 1;

            this.countdownText.tweenTo({
                alpha: 0,
                delay: 0.7,
                duration: 0.25
            });

            this.performAction({
                delay: 1,
                action: this._countdownSecond
            });
        }

        this.countdown--;
    }
}
extend(TGE.AdHeader,TGE.DisplayObjectContainer);