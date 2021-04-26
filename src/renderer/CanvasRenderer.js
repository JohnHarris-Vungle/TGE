
TGE.CanvasRenderer = function(canvas,alpha)
{
	alpha = alpha===false ? false : true;

	TGE.CanvasRenderer.superclass.constructor.call(this);
	TGE.CanvasRenderer._sNumInstances++;

	this._mFunctional = false;

	if(canvas)
	{
		this._mCanvasContext = canvas.getContext('2d', {alpha:alpha});
		this._mFunctional = true;
	}

    return this;
}


TGE.CanvasRenderer._sNumInstances = 0;

TGE.CanvasRenderer.prototype =
{
	type: function()
	{
		return "Canvas";
	},

	functional: function()
	{
		return this._mFunctional;
	},

	swapContext: function(context)
	{
		this._mCanvasContext = context;
		this._mFunctional = true;
		this.deprecatedDrawCycle = false;
	},

	getCanvasContext: function()
	{
		return this._mCanvasContext;
	},

	beginScene: function(backgroundColor)
	{
		this._mCanvasContext.globalAlpha = 1;
		this._mCanvasContext.globalCompositeOperation = 'source-over';
	},

	setWorldTransform: function(transform,stageScale)
	{
		// Apply the transformation to the canvas context
		var m = transform._internal;

		// If an orientation lock is being applied, it means we exchanged the width and height of the game stage.
		// To fit the game stage into the full stage it needs to be rotated 90 degrees and translated into place.
		// If this is done using the standard rotation/x/y properties of the GameStage, it will introduce those
		// transformations into the world transform stack and confuse game code that does anything related to stage
		// coordinates (in particular transforming between local to stage and vise versa).
		//
		// To get around this problem we will "secretly" apply the necessary transformations here in the CanvasRenderer
		// when the world transformation is applied for rendering.
		if (TGE.GameStage._sOrientationLock.active && TGE.Renderer._sIgnoreOrientationLock !== true)
		{
			var orientationLockAdjustment = new TGE.Matrix();
			var m = orientationLockAdjustment._internal;

			// Apply the translation and rotation to fit the game stage into the full stage
			var lockObj = TGE.GameStage._sOrientationLock;
			if (lockObj.gameHeight < lockObj.gameWidth)
			{
				// Game is locked to landscape
				m[2] = lockObj.gameHeight;
				orientationLockAdjustment.rotate(90);
			}
			else
			{
				// Game is locked to portrait
				m[5] = lockObj.gameWidth;
				orientationLockAdjustment.rotate(-90);
			}

			// Apply this to the transformation we're supposed to apply
			orientationLockAdjustment.concat(transform);
		}

		if(stageScale!==1)
		{
			this._mCanvasContext.setTransform(m[0]*stageScale, m[3]*stageScale, m[1]*stageScale, m[4]*stageScale, m[2]*stageScale, m[5]*stageScale);
		}
		else
		{
			// Always use sub-pixel positioning
			this._mCanvasContext.setTransform(m[0], m[3], m[1], m[4], m[2], m[5]);
		}
	},

	setAlpha: function(alpha)
	{
		this._mCanvasContext.globalAlpha = alpha;
	},

	fillRectangle: function(x,y,width,height,color)
	{
		this._mCanvasContext.fillStyle = color;
		this._mCanvasContext.fillRect(x,y,width,height);
	},

	gradientFill: function(direction,color1,color2,transitionPoint,width,height, colorDef)
	{
		var gradient;

		// Define gradient direction
		if (direction==="circular")
		{
			var biggestDimension = Math.max(width,height);
			gradient = this._mCanvasContext.createRadialGradient(width/2,height/2,0,width/2,height/2,biggestDimension*(transitionPoint*0.5+0.5));
		}
		else
		{
			var x0 = 0, y0 = 0, x1 = 0, y1 = 0;
			if (colorDef)
			{
				// use new gradient routines, when they originate from a CB colorDef
                switch (direction)
                {
                    case "horizontal":
                    	x0 = Math.max(0, (transitionPoint - 0.5) * width * 1.85);
                    	x1 = Math.min(width, width - (0.5 - transitionPoint) * width * 1.85);
                        break;
                    case "vertical":
						y0 = Math.max(0, (transitionPoint - 0.5) * height * 1.85);
						y1 = Math.min(height, height - (0.5 - transitionPoint) * height * 1.85);
                        break;
					default:
						var len = Math.sqrt(width * width + height * height);
						var min = Math.max(0, (transitionPoint - 0.5) * len * 1.5);
						var max = Math.min(len, len - (0.5 - transitionPoint) * len * 1.5);
                        x0 = min / len * width;
                        x1 = max / len * width;
						y0 = (direction === "leftDiagonal" ? min : len - min) / len * height;
						y1 = (direction === "leftDiagonal" ? max : len - max) / len * height;
						break;
                }
			}
			else
			{
				if (direction !== "vertical")
				{
					x1 = width*2*transitionPoint;
				}
				if (direction === "vertical" || direction === "leftDiagonal")
				{
					y0 = height*2*transitionPoint;
				}
				else
				{
					y1 = height*2*transitionPoint;
				}
			}
			gradient = this._mCanvasContext.createLinearGradient(x0, y0, x1, y1);
		}

		// Apply colors
		gradient.addColorStop(0,color1);
		gradient.addColorStop(1,color2);

		this._mCanvasContext.fillStyle = gradient;
		this._mCanvasContext.fillRect(0,0,width,height);
	},

	drawImage: function(texture,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight)
	{
		this._mCanvasContext.drawImage(texture.htmlImageElement,sx,sy,sWidth,sHeight,dx,dy,dWidth,dHeight);
	},

	updateTextImage: function(texture,offscreenCanvas)
	{
		return offscreenCanvas;
	},

	drawTextImage: function(texture,color,width,height,cachePadding,tx,ty)
	{
		this._mCanvasContext.drawImage(texture, -cachePadding, -cachePadding, width+cachePadding*2, height+cachePadding*2);
	}
}
extend(TGE.CanvasRenderer, TGE.Renderer);