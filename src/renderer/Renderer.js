
TGE.Renderer = function(canvas)
{
	this.isTGERenderer = true;
	this.deprecatedDrawCycle = false;
	this.textures = [];
	this.imageToTextureMap = {};

    return this;
}


TGE.Renderer.prototype =
{
	type: function()
	{
		return "Abstract";
	},

	functional: function()
	{
		return false;
	},

	getCanvasContext: function()
	{
		return null;
	},

	resizedGameDiv: function()
	{

	},

	processImage: function(htmlImageElement,spritesheet)
	{
		// Was this image already processed?
		var textureID = this.imageToTextureMap[htmlImageElement.src];
		if(typeof textureID === "number")
		{
			return this.textures[textureID];
		}

		var texture = this.createTexture();
		texture.htmlImageElement = htmlImageElement;
		texture.htmlImageWidth = htmlImageElement.width;
		texture.htmlImageHeight = htmlImageElement.height;
		texture.spriteSheet = spritesheet;

		// Handle any renderer specific stuff
		this.rendererProcessImage(texture,htmlImageElement,spritesheet);

		// Keep track of the image to id mapping, we need it to make sure we don't process this image again
		this.imageToTextureMap[htmlImageElement.src] = texture.id;

		return texture;
	},

	rendererProcessImage: function(texture,htmlImageElement,spritesheet)
	{

	},

	getImageSize: function(size)
	{
		return size;
	},

    beginScene: function(backgroundColor)
    {

    },

	endScene: function()
	{

	},

	setWorldTransform: function(transform,stageScale)
	{

	},

	setAlpha: function(alpha)
	{

	},

	fillRectangle: function(x,y,width,height,color)
	{

	},

	gradientFill: function(direction,color1,color2,transitionPoint,width,height)
	{

	},

	drawImage: function(texture,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight)
	{

	},

	alphamapOffscreenText: function()
	{
		return false;
	},

	updateTextImage: function(texture,offscreenCanvas)
	{
		return null;
	},

	drawTextImage: function(texture,color,width,height,cachePadding,tx,ty)
	{

	},

	createTexture: function()
	{
		var newTexture = new TGE.Renderer.Texture();
		this.textures[newTexture.id] = newTexture;
		return newTexture;
	},

	getTextureByID: function(id)
	{
		return this.textures[id];
	}
}


TGE.Renderer.Texture = function()
{
	// Unique numerical id
	this.id = TGE.Renderer.Texture._sNextID++;

	// The html image element often used by both Canvas and WebGL renderers (optional)
	this.htmlImageElement = null;
	this.htmlImageWidth = 0;
	this.htmlImageHeight = 0;

	// The GL texture used by the WebGL renderer (optional)
	this.glTexture = null;

	// Whether or not this texture is used as a spritesheet (contains multiple images)
	this.spriteSheet = false;

	return this;
}

TGE.Renderer.Texture._sNextID = 0;