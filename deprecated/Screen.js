/**
 * @class A class used to represent a UI screen within the game, ie: main menu, pause screen, game over screen, etc.
 * @param game {@link TGE.ScreenManager} The ScreenManager object that manages this screen.
 * @constructor
 */
TGE.Screen = function(screenManager)
{
    this.mScreenManager = screenManager;
    this.mBackground = null;
    this.mUIElements = new Array();
    this.mDestroyed = false;
}


TGE.Screen.prototype =
{

    Setup: function()
    {
        // Override to setup your screen
    },


    Close: function()
    {
       this.mScreenManager.CloseScreen( this.constructor );
    },


    Game: function()
    {
        return this.mScreenManager.Game();
    },


    CreateUIEntity: function(classType)
    {
        var obj = this.mScreenManager.CreateUIEntity(classType);
        this.mUIElements.push(obj);

        return obj;
    },


    DisplayNumber: function(number,x,y,image,spacing,alignment,useCommas,layer)
    {
        var host = this.CreateUIEntity(TGE.ScreenEntity).Setup(x,y,null,layer);

        var numberString = number.toString();
        var commaSpacing = 24;
        var commaTweak = 2;
        var stringWidth = numberString.length*spacing;

        // Add commas to stringWidth
        if(useCommas)
        {
            var numCommas = Math.floor((numberString.length-1)/3);
            stringWidth += numCommas * commaSpacing;
            stringWidth -= numCommas * commaTweak;
        }

        var iconX = alignment=="center" ? stringWidth/2 + spacing/2 : stringWidth;
        iconX -= spacing;
        var iconY = 0;

        var c = 0;
        for(i=numberString.length-1; i>=0; i--)
        {
            // Do we need a comma?
            if(useCommas && c==3)
            {
                iconX += commaTweak;
                var comma = new TGE.Sprite();
                comma.setImage("big_digits_comma");
                comma.x = iconX; comma.y = iconY;
                host.addChild(comma);
                iconX -= commaSpacing;
                c = 0;
            }

            var digit = new TGE.Sprite();
            digit.setImage(image,1,10);
            digit.setSpriteIndex(numberString.charCodeAt(i)-48);
            digit.x = iconX; digit.y = iconY;
            host.addChild(digit);

            iconX -= spacing;
            c++;
        }

        return host;
    },


    FillBackground: function(color)
    {
        this.mBackground = this.mScreenManager.Game().CreateUIEntity(TGE.ScreenEntity);
        this.mBackground.Setup(0,0,null,this.mScreenManager.mLayerName);
        this.mBackground.registrationX = 0;
        this.mBackground.registrationY = 0;
        this.mBackground.width = this.mScreenManager.Game().Width();
        this.mBackground.height = this.mScreenManager.Game().Height();
        this.mBackground.backgroundColor = color;
    },


    Finalize: function()
    {

    },


    ShowAll: function()
    {
        for(var i=0; i<this.mUIElements.length; i++)
        {
            this.mUIElements[i].visible = true;
        }
    },


    HideAll: function()
    {
        for(var i=0; i<this.mUIElements.length; i++)
        {
            this.mUIElements[i].visible = false;
        }
    },


    Update: function(elapsedTime)
    {

    },


    Destroy: function()
    {
        // Remove the background
        if(this.mBackground!=null)
        {
            this.mBackground.markForRemoval();
        }

        // Remove any UI objects
        for(var i=0; i<this.mUIElements.length; i++)
        {
            // Tell the object to destroy itself
            this.mUIElements[i].markForRemoval();
        }

        this.mDestroyed = true;
    },

    // Dummy function to support functionality in 0.4
    handleEvent: function(event)
    {

    }

}