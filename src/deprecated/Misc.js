
TGE.Text.prototype.Setup = function(x,y,text,font,hAlign,vAlign,color,layerID)
{
    this.x = x;
    this.y = y;

    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    this.mLayer = layerID;
    if(this.stage)
    {
        var layer = this.stage.getChildByName(this.mLayer,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    this.text = text;
    this.font = font;
    this.hAlign = hAlign;
    this.vAlign = vAlign;
    this.textColor = color;

    return this;
}

// This one is necessary to fix the weird text offsets seen when using CWTween with TGE.Text
TGE.Text.prototype._calculateDimensions = function(canvasContext)
{

}


TGE.Button.prototype.Setup = function(x,y,imageID,pressFunction,numStates,layerID)
{
    this.x = x;
    this.y = y;

    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    this.mLayer = layerID;
    if(this.stage)
    {
        var layer = this.stage.getChildByName(this.mLayer,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    this._mNumStates = numStates;

    // Setup the image specifying it's multiple states
    this.setImage(imageID,1,numStates);

    // Set the press event listener
    this.pressFunction = pressFunction;

    this._setButtonState("idle");

    return this;
}


TGE.ParallaxPane.prototype.Setup = function(oy,tracking,image,layerID,vertical)
{
    // This is a hack to be backwards compatible with TGE 0.3 and below. In this case Setup will only be called
    // after an initial call to TGE.Game.CreateUIEntity or TGE.Game.CreateWorldEntity. We'll make sure those
    // functions set this object's stage to the root, so it can retrieve a layer itself
    if(this.stage)
    {
        var layer = this.stage.getChildByName(layerID,false);
        layer = layer===null ? this.stage : layer;
        layer.addChild(this);
    }
    else
    {
        TGE.log("***** ERROR: objects created with TGE 0.3 and below must be instantiated with TGE.CreateWorldObject or TGE.CreateUIObject")
    }

    // Now call the new setup....
    vertical = (typeof vertical==="undefined" ? false : vertical);
    return this.setup({
        worldY:oy,
        image:image,
        trackingSpeed:tracking,
        vertical:vertical
    });
}


TGE.ParallaxPane.prototype.SetHorizontalOffset = function(x)
{
    this.offset = x;
}


TGE.Sprite.prototype.SetImage = function(imageName,rows,columns)
{
	this.setImage(imageName,rows,columns);
}