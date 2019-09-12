
TGE.CanvasRenderer = function(canvas,alpha)
{
	alpha = alpha===false ? false : true;

	TGE.CanvasRenderer.superclass.constructor.call(this);
	TGE.CanvasRenderer._sNumInstances++;

	this._mFunctional = false;

	if(canvas)
	{
		this._mCanvasContext = canvas.getContext('2d', {alpha:alpha});

		// CocoonJS optimization
		if(navigator.isCocoonJS && TGE.CanvasRenderer._sNumInstances===1)
		{
			canvas.screencanvas = true;
		}

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

	gradientFill: function(direction,color1,color2,transitionPoint,width,height)
	{
		// Define gradient direction
		if (direction==="circular")
		{
			var biggestDimension = Math.max(width,height);
			var gradient = this._mCanvasContext.createRadialGradient(width/2,height/2,0,width/2,height/2,biggestDimension*(transitionPoint*0.5+0.5));
		}
		else if (direction==="vertical")
		{
			var gradient = this._mCanvasContext.createLinearGradient(0,height*2*transitionPoint,0,0);
		}
		else if (direction==="horizontal")
		{
			var gradient = this._mCanvasContext.createLinearGradient(0,0,width*2*transitionPoint,0);
		}
		else if (direction==="leftDiagonal")
		{
			var gradient = this._mCanvasContext.createLinearGradient(0,height*2*transitionPoint,width*2*transitionPoint,0);
		}
		else
		{
			var gradient = this._mCanvasContext.createLinearGradient(0,0,width*2*transitionPoint,height*2*transitionPoint);
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