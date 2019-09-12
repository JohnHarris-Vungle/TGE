/**
 * @class A high level class for managing UI screens within a game.
 * @param game {@link TGE.Game} The game instance that the ScreenManager is for.
 * @constructor
 */
TGE.ScreenManager = function(game)
{
    this.mGame = game;
    this.mLayerName = "ScreenManager";
    this.mScreens = new Array();
    this.mFadeIn = null;
    this.mFadeInAlpha = 1;
    this.mFadeInSpeed = 1;
    this.mFadeInColor = null;
}


TGE.ScreenManager.prototype =
{

    Initialize: function(game)
    {
        // Destroy any existing screens
        for (var screen in this.mScreens)
        {
            if(this.mScreens[screen]!=null)
            {
                this.mScreens[screen].Destroy();
                this.mScreens[screen] = null;
            }
        }

        game.CreateLayer(this.mLayerName);
        game.CreateLayer("FadeOverlay");
    },


    setupFadeIn: function(color,speed)
    {
        this.mFadeInSpeed = speed;
        this.mFadeInColor = color;
    },


    CreateUIEntity: function(classType)
    {
        return this.mGame.CreateUIEntity(classType);
    },


    ShowScreen: function(classType,doFade)
    {
        var newScreen = new classType;
        classType.prototype.constructor.apply(newScreen,[this]);

        var screenName = classType["className"] ? classType.className() : classType.name;
        this.mScreens[screenName] = newScreen;

        newScreen.Setup();
        newScreen.Finalize();

        doFade = typeof doFade === "undefined" ? true : doFade;
        if(doFade!=false)
        {
            this.ResetFade();
        }

        return newScreen;
    },


    CloseScreen: function(classType)
    {
        // Find it
        var screenName = classType["className"] ? classType.className() : classType.name;
        var screen = this.mScreens[screenName];
        if(screen == null)
        {
            return;
        }

        screen.Destroy();
        this.mScreens[classType] = null;
    },


    ResetFade: function()
    {
        if(this.mFadeInColor!==null)
        {
            // Setup the fade object if it doesn't exist yet
            if(this.mFadeIn===null)
            {
                this.mFadeIn = new TGE.DisplayObject();
                this.mFadeIn.width = this.mGame.Width();
                this.mFadeIn.height = this.mGame.Height();
                this.mFadeIn.registrationX = 0;
                this.mFadeIn.registrationY = 0;
                this.mFadeIn.backgroundColor = this.mFadeInColor;
                this.mGame.getLayer("FadeOverlay").addChild(this.mFadeIn);
            }

            // Make sure the child is still in the scene
            if(this.mGame.getLayer("FadeOverlay").getChildIndex(this.mFadeIn)===-1)
            {
                this.mGame.getLayer("FadeOverlay").addChild(this.mFadeIn);
            }

            this.mFadeInAlpha = 1;
            this.mFadeIn.alpha = 1;
            this.mFadeIn.visible = true;
        }
    },


    Update: function(elapsedTime)
    {
        if(this.mFadeIn!==null && this.mFadeInColor!==null)
        {
            this.mFadeInAlpha -= elapsedTime/this.mFadeInSpeed;
            if(this.mFadeInAlpha<=0)
            {
                this.mFadeInAlpha = 0;
                this.mFadeIn.visible = false;
            }
            this.mFadeIn.alpha = this.mFadeInAlpha;
        }

        // Update all the screens
        for (var screen in this.mScreens)
        {
            if(this.mScreens[screen]!=null)
            {
                this.mScreens[screen].Update(elapsedTime);
            }
        }
    },


    Game: function()
    {
        return this.mGame;
    },


    XFromPercentage: function(p)
    {
        return this.mGame.Width() * p;
    },


    YFromPercentage: function(p)
    {
        return this.mGame.Height() * p;
    },


    FixedDistanceFromTop: function(d)
    {
        return d;
    },


    FixedDistanceFromBottom: function(d)
    {
        return this.mGame.Height() - d;
    },


    FixedDistanceFromLeft: function(d)
    {
        return d;
    },


    FixedDistanceFromRight: function(d)
    {
        return this.mGame.Width() - d;
    }

}