/**
 <p>The Sprite class is a display object that can be represented by an image, and can also contain children.</p>
 * @class
 * @extends TGE.DisplayObjectContainer
 * @constructor
 */
TGE.Sprite = function()
{
    TGE.Sprite.superclass.constructor.call(this);

    // Private members
    this._mRendererTexture = null;
    this._mCellWidth = 0;
    this._mCellHeight = 0;
    this._mSpriteIndex = 0;
    this._mOffsetX = 0;
    this._mOffsetY = 0;
    this._mCoordinateCache = null;
    this._mColorize = null;

    // This is deprecated, but keep it around in case game code is referencing it
    this._mImage = null;

    // PAN-406 Need to support old (incorrect) way of splitting up the rows and columns. If
    if(TGE.Sprite.UseCorrectGridCuts)
    {
        this._mSplitFunc1 = function(a) { return a; };
        this._mSplitFunc2 = function(a) { return Math.round(a); };
        this._mSplitFunc3 = function(a) { return Math.round(a); };
    }
    else
    {
        this._mSplitFunc1 = function(a) { return Math.floor(a); };
        this._mSplitFunc2 = function(a) { return a; };
        this._mSplitFunc3 = function(a) { return Math.floor(a); };
    }

    return this;
}

/**
 * TGE version 1.0.x and below used a method of dividing the rows and columns in even grid sprite sheets that wouldn't
 * produce correct results when the image size wasn't evenly divisible by the row and column counts. To correct this
 * problem set TGE.Sprite.UseCorrectGridCuts = true. This value will remain set to false by default for backward
 * compatibility until the next major release of TGE.
 * @constant
 */
TGE.Sprite.UseCorrectGridCuts = true;

TGE.Sprite.prototype =
    {
        /**
         * The setup method can be used initialize multiple parameters of an object with a single call. The setup method travels up the class hierarchy, so any properties that can be set in superclasses can be included in this param object as well.
         * @param {Object} params Information used to initialize the object.
         * @param {String|HTMLImageElement} [params.image] An image id string indicating the desired image to load from the {@link TGE.AssetManager} singleton, or an HTMLImageElement to use directly.
         * @param {String} [params.colorize] An html-style color attribute to colorize monochrome images.
         * @return {TGE.Sprite} Returns this object.
         */
        setup: function(params)
        {
            TGE.Sprite.superclass.setup.call(this,params);

            // Image
            typeof(params.image)!=="undefined" ? this.setSizedImage(params.image, params.width, params.height) : null;

            if (params.colorize)
            {
                this.colorize(params.colorize);
            }
            return this;
        },

        /**
         * Assigns the specified image to the sprite object with a width/height
         * @param {String} image An image id string indicating the desired image to load from the {@link TGE.AssetManager} singleton
         * @param {Number} The width the image must be drawn at, if different from the actual image width.
         * @param {Number} The height the image must be drawn, if different from the actual image height.
         */
        setSizedImage: function (image, width, height)
        {
            this.setImage(image, 1, 1, width, height);
        },

        /**
         * Assigns the specified image to the sprite object. The image can be a "sprite sheet" comprised of equally sized cells that can be specified for drawing using the setSpriteIndex function.
         * @param {String|HTMLImageElement} image An image id string indicating the desired image to load from the {@link TGE.AssetManager} singleton, or an HTMLImageElement to use directly.
         * @param {Number} [rows=1] The number of rows in the sprite sheet, or default of 1 if this is a single image.
         * @param {Number} [columns=1] The number of columns in the sprite sheet, or default of 1 if this is a single image.
         * @see TGE.Sprite#setSpriteIndex
         */
        setImage: function(arg1,rows,columns,width,height)
        {
            rows = typeof rows === "undefined" ? 1 : rows;
            columns = typeof columns === "undefined" ? 1 : columns;
            width = typeof width === "number" ? width : null;
            height = typeof height === "number" ? height : null;

            this._mSourceImage = arg1;
            this._mNumRows = rows;
            this._mNumColumns = columns;
            this._mOffsetX = 0;
            this._mOffsetY = 0;
            this._mRendererTexture = null;

            // arg1 can be 2 things:
            // 1) a string representing an asset id (which could be an HTMLImageElement or a spritesheet info object)
            // 2) an actual HTMLImageElement object

            // Is the image specified an actual image asset or the id string?
            if(typeof arg1 === "string")
            {
                this._mRendererTexture = TGE.AssetManager.GetTexture(arg1);
            }
            else if(arg1 instanceof Image)
            {
                this._mRendererTexture = this.stage._mRenderer.processImage(arg1,false);
            }
            else if(arg1 && arg1.spriteSheet instanceof Image)
            {
                // PAN-642 The TGE 0.3 bridge passes the sprite sheet info object as arg1 when it's a sprite sheet asset
                this._mRendererTexture = this.stage._mRenderer.processImage(arg1.spriteSheet,true);
                var sheetInfo = arg1;
            }

            if(this._mRendererTexture)
            {
                // Is it from a sprite sheet?
                if (this._mRendererTexture.spriteSheet)
                {
                    var spriteSheetInfo = sheetInfo ? sheetInfo : TGE.AssetManager.Get(arg1);

                    this._mCellWidth = this._mSplitFunc1(spriteSheetInfo.width/columns);
                    this._mCellHeight = this._mSplitFunc1(spriteSheetInfo.height/rows);

                    this._mCoordinateCache = [];

                    var tx,ty;
                    for(var i=0; i<rows*columns; i++)
                    {
                        tx = this._mSplitFunc2(spriteSheetInfo.x + ((i % columns)|0) * this._mCellWidth);
                        ty = this._mSplitFunc2(spriteSheetInfo.y + ((i / columns)|0) * this._mCellHeight);
                        this._mCoordinateCache.push([tx,ty]);
                    }

                    this._mDrawWidth = this._mOriginalWidth = this._mSplitFunc2(this._mCellWidth);
                    this._mDrawHeight = this._mOriginalHeight = this._mSplitFunc2(this._mCellHeight);

                    if(spriteSheetInfo.hasOwnProperty("offsetX"))
                    {
                        this._mOffsetX = spriteSheetInfo.offsetX;
                        this._mOffsetY = spriteSheetInfo.offsetY;
                        this._mDrawWidth = spriteSheetInfo.drawWidth/columns;
                        this._mDrawHeight = spriteSheetInfo.drawHeight/rows;
                    }
                }
                else
                {
                    this._mDrawWidth = this._mOriginalWidth = this._mSplitFunc3(this._mRendererTexture.htmlImageWidth/columns);
                    this._mDrawHeight = this._mOriginalHeight = this._mSplitFunc3(this._mRendererTexture.htmlImageHeight/rows);
                    this._resetCoordinateCache();
                }

                this.width = width ? width : this._mOriginalWidth;
                this.height = height ? height : this._mOriginalHeight;

                // Verify that the image object is valid
                if(this._mRendererTexture.htmlImageWidth<=0 || this._mRendererTexture.htmlImageHeight<=0)
                {
                    TGE.Debug.Log(TGE.Debug.LOG_ERROR, "TGE.Sprite.setImage: HTMLImageElement has invalid dimensions ("+
                        this._mRendererTexture.htmlImageWidth+"x"+this._mRendererTexture.htmlImageHeight+"), image likely did not load");
                    this._mRendererTexture = null;
                }
            }

            this._mSpriteIndex = 0;

            // In case there is deprecated code referencing _mImage
            this._mImage = this._mRendererTexture ? this._mRendererTexture.htmlImageElement : null;

            // If this object is cached, refresh the contents thereof
            this.updateCache();

            if (this.parent)
            {
                this.dispatchEvent(TGE._ResizeEvent);
            }
        },

        /**
         * Indicates which cell of the image to use for drawing. Only applicable if the image is a sprite sheet.
         * @param {Number} index A zero-indexed number indicating which cell of the sprite sheet to use for drawing.
         */
        setSpriteIndex: function(index)
        {
            // Make sure there is actually an image...
            if(this._mRendererTexture===null)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Attempt to call TGE.Sprite.setSpriteIndex on null image");
                return;
            }

            this._mSpriteIndex = index;

            // Error check
            if(this._mSpriteIndex>=this._mCoordinateCache.length)
            {
                TGE.Debug.Log(TGE.Debug.LOG_ERROR, "Attempt to call TGE.Sprite.setSpriteIndex with an out of range index (" + index.toString() + ")");
                this._mSpriteIndex = 0;
            }
        },

        /**
         * Fills the image with a solid color, while maintaining the alpha from the original image.
         * It's good for monochrome images like text, frames, UI widgets, etc.
         * NOTE: This requires the Sprite to be cached, and will do so if not done already.
         * @param {string} color standard html color attribute, like "#f00", etc.
         */
        colorize: function(color)
        {
            if (color != this._mColorize)
            {
                if (!color)
                {
	                this._mCacheDirty = true;   // need to make sure the object is re-cached when removing the color
                }
                this._mColorize = color;
                this.cache((this.isCached() && !this._mCacheDirty) ? this : undefined);     // we reuse the same cache if it already exists
            }
        },

        /**
         * Override of the cache function, that handles
         * @param {TGE.DisplayObjectContainer} [obj]
         */
        cache: function(obj)
        {
            TGE.Sprite.superclass.cache.call(this, obj);

            if (this._mColorize && this.canvas)
            {
                var ctx = this.offscreenRenderer.getCanvasContext();
                ctx.save();
                ctx.globalCompositeOperation = 'source-atop';
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = this._mColorize;
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.restore();
            }
        },

        /**
         * If this gets modified, there is a good chance that _drawClass needs to be modified as well!!
         * @ignore
         */
        _objectDraw: function(renderer)
        {
            // Draw the image on the canvas
            if(this._mRendererTexture!==null && !this._mCached)
            {
                var scaleX = this.width / this._mOriginalWidth;
                var scaleY = this.height / this._mOriginalHeight;

                var sx = (this._mCoordinateCache[this._mSpriteIndex][0]>>0);
                var sy = (this._mCoordinateCache[this._mSpriteIndex][1]>>0);
                var dx = this._mOffsetX * scaleX;
                var dy = this._mOffsetY * scaleY;
                var dWidth = this._mDrawWidth * scaleX;
                var dHeight = this._mDrawHeight * scaleY;

                renderer.drawImage(this._mRendererTexture,sx,sy,this._mDrawWidth,this._mDrawHeight,dx,dy,dWidth,dHeight);
            }

            // Do the DisplayObjectContainer drawing
            TGE.Sprite.superclass._objectDraw.call(this,renderer);
        },

        /**
         * @ignore
         */
        _resetCoordinateCache: function()
        {
            this._mCellWidth = this._mSplitFunc1(this._mRendererTexture.htmlImageWidth/this._mNumColumns);
            this._mCellHeight = this._mSplitFunc1(this._mRendererTexture.htmlImageHeight/this._mNumRows);
            this._mCoordinateCache = [];

            var tx,ty;
            for(var i=0; i<this._mNumRows*this._mNumColumns; i++)
            {
                tx = this._mSplitFunc2(((i % this._mNumColumns)|0) * this._mCellWidth);
                ty = this._mSplitFunc2(((i / this._mNumColumns)|0) * this._mCellHeight);
                this._mCoordinateCache.push([tx,ty]);
            }
        }
    }
extend(TGE.Sprite, TGE.DisplayObjectContainer);

Object.defineProperty(TGE.Sprite.prototype, 'image', {
    get: function()
    {
        return this._mSourceImage;
    },
    set: function(image)
    {
        if (image !== this.image)
        {
            this.setImage(image);
        }
    }
});

Object.defineProperty(TGE.Sprite.prototype, 'originalWidth', {
    get: function()
    {
        return this._mOriginalWidth;
    },
});

Object.defineProperty(TGE.Sprite.prototype, 'originalHeight', {
    get: function()
    {
        return this._mOriginalHeight;
    },
});