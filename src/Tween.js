/**
 <p>The Tween class lets you do things like move, scale, and fade display objects by specifying a property of the target object to animate over a period of time.
 The Tween class also lets you specify a variety of easing methods. "Easing" refers to gradual acceleration or deceleration during an animation, which helps your animations appear more realistic.
 TGE.Tween supports the following standard easing functions:
 <ul>
    <li>TGE.Tween.Linear</li>
    <li>TGE.Tween.Quadratic.In, TGE.Tween.Quadratic.Out, TGE.Tween.Quadratic.InOut</li>
    <li>TGE.Tween.Cubic.In, TGE.Tween.Cubic.Out, TGE.Tween.Cubic.InOut</li>
    <li>TGE.Tween.Quartic.In, TGE.Tween.Quartic.Out, TGE.Tween.Quartic.InOut</li>
    <li>TGE.Tween.Quintic.In, TGE.Tween.Quintic.Out, TGE.Tween.Quintic.InOut</li>
    <li>TGE.Tween.Sine.In, TGE.Tween.Sine.Out, TGE.Tween.Sine.InOut</li>
    <li>TGE.Tween.Exponential.In, TGE.Tween.Exponential.Out, TGE.Tween.Exponential.InOut</li>
    <li>TGE.Tween.Circular.In, TGE.Tween.Circular.Out, TGE.Tween.Circular.InOut</li>
    <li>TGE.Tween.Elastic.In, TGE.Tween.Elastic.Out, TGE.Tween.Elastic.InOut</li>
    <li>TGE.Tween.Back.In, TGE.Tween.Back.Out, TGE.Tween.Back.InOut</li>
    <li>TGE.Tween.Bounce.In, TGE.Tween.Bounce.Out, TGE.Tween.Bounce.InOut</li>
 </ul>
 <p>If you want to use your own easing function it should accept a parameter for time (normalized to 0-1), and another optional parameter as specified in the easingParam parameter.</p>
 <p>The easiest way to create tweens is to use the helper functions {@link TGE.DisplayObject} <strong>tweenTo</strong> and <strong>tweenFrom</strong> methods. You can chain tweens by using
 the TGE.Tween thenTweenTo method on the TGE.Tween object returned by tweenTo, tweenFrom, and thenTweenTo calls.</p>
 * @class
 * @property {Object} target The target object receiving the tweened values.
 * @property {Number} duration The desired duration of the tween from start to finish (in seconds).
 * @property {Function} easing The easing function to use for the tween. Built-in functions are:
 * @property {Number} easingParam An optional amplitude parameter for use when using TGE.Tween.Back or TGE.Tween.Elastic easing functions.
 * @property {Number} delay A delay that can be applied before the tween starts (in seconds).
 * @property {Boolean|Number} loop If true, the tween will start over once it is complete and loop infinitely. If specified as a numerical value, the tween will loop for only the number of times specified by the value. Use the loop parameter in conjunction with the rewind parameter to create a "yo-yo" loop.
 * @property {Boolean} rewind If true, the tween will loop by progressing from start-to-end, then end-to-start, etc. (sometimes referred to as "yo-yo"). Only applicable if the loop parameter is true or a non-zero numerical value.
 * @property {Boolean} startFromEnd If true, the tween will begin from the property values specified, and the final values will be the object's current property values before the tween is applied.
 * @property {Function} onBegin An optional callback function that will be fired when the tween begins.
 * @property {Function} onComplete An optional callback function that will be fired when the tween is complete.
 * @property {Function} onLoopComplete An optional callback function that will be fired when the loop is complete
 * @property {Boolean} removeOnComplete If true, the target object will be destroyed when the tween is complete.
 * @property {Number|String} id An optional user specified id value (typically a string or number) that can be used to later cancel the tween using the TGE.DisplayObject.removeTween method.
 * @constructor
 */
TGE.Tween = function()
{
	// Public members
	this.id = null;
	this.target = null;
	this.duration = 1;
	this.easing = TGE.Tween.Linear;
	this.delay = 0;
	this.loop = false;
	this.rewind = false;
    this.onBegin = null;
    this.onComplete = null;
    this.onLoopComplete = null;
	this.startFromEnd = false;
	this.removeOnComplete = false;

	// Private members
	this._mAge = 0;
	this._mForward = true;
	this._mSetup = false;
	this._mFinished = false;
	this._mStartValues = {};
	this._mEndValues = {};
	this._mChainedTweens = [];
	this._mEaseParam = 0;
	this._mRepeats = -1;
}

TGE.Tween.prototype =
{
	/**
	 * Initializes a TGE.Tween object using the parameters specified.
	 * @param {Object} params Information used to initialize the tween.
	 * @param {Object} params.target The target object receiving the tweened values.
	 * @param {Number} [params.duration=1] The desired duration of the tween from start to finish (in seconds).
	 * @param {Function} [params.easing=TGE.Tween.Linear] The easing function to use for the tween. Built-in functions are:
	 * <ul>
	 *     <li>TGE.Tween.Linear</li>
	 *     <li>TGE.Tween.Quadratic.In, TGE.Tween.Quadratic.Out, TGE.Tween.Quadratic.InOut</li>
	 *     <li>TGE.Tween.Cubic.In, TGE.Tween.Cubic.Out, TGE.Tween.Cubic.InOut</li>
	 *     <li>TGE.Tween.Quartic.In, TGE.Tween.Quartic.Out, TGE.Tween.Quartic.InOut</li>
	 *     <li>TGE.Tween.Quintic.In, TGE.Tween.Quintic.Out, TGE.Tween.Quintic.InOut</li>
	 *     <li>TGE.Tween.Sine.In, TGE.Tween.Sine.Out, TGE.Tween.Sine.InOut</li>
	 *     <li>TGE.Tween.Exponential.In, TGE.Tween.Exponential.Out, TGE.Tween.Exponential.InOut</li>
	 *     <li>TGE.Tween.Circular.In, TGE.Tween.Circular.Out, TGE.Tween.Circular.InOut</li>
	 *     <li>TGE.Tween.Elastic.In, TGE.Tween.Elastic.Out, TGE.Tween.Elastic.InOut</li>
	 *     <li>TGE.Tween.Back.In, TGE.Tween.Back.Out, TGE.Tween.Back.InOut</li>
	 *     <li>TGE.Tween.Bounce.In, TGE.Tween.Bounce.Out, TGE.Tween.Bounce.InOut</li>
	 * </ul>
	 * If you want to use your own easing function it should accept a parameter for time (normalized to 0-1), and another optional parameter as specified in the easingParam parameter.
	 * @param {Number} [params.easingParam] An optional amplitude parameter for use when using TGE.Tween.Back or TGE.Tween.Elastic easing functions.
	 * @param {Number} [params.delay=0] A delay that can be applied before the tween starts (in seconds).
	 * @param {Boolean|Number} [params.loop=false] If true, the tween will start over once it is complete and loop infinitely. If specified as a numerical value, the tween will loop for only the number of times specified by the value. Use the loop parameter in conjunction with the rewind parameter to create a "yo-yo" loop.
	 * @param {Boolean} [params.rewind=false] If true, the tween will loop by progressing from start-to-end, then end-to-start, etc. (sometimes referred to as "yo-yo"). Only applicable if the loop parameter is true or a non-zero numerical value.
	 * @param {Boolean} [params.startFromEnd=false] If true, the tween will begin from the property values specified, and the final values will be the object's current property values before the tween is applied.
     * @param {Function} [params.onBegin] An optional callback function that will be fired when the tween begins.
     * @param {Function} [params.onComplete] An optional callback function that will be fired when the tween is complete.
	 * @param {Function} [params.onLoopComplete] An optional callback function that will be fired when the loop ends
     * @param {Function} [params.removeOnComplete] If true, the target object will be destroyed when the tween is complete.
	 * @param {Number|String} [params.id] id An optional user specified id value (typically a string or number) that can be used to later cancel the tween using the TGE.DisplayObject.removeTween method.
	 * @returns {TGE.Tween} Returns the new tween object that was created. This can be used to chain new tweens using TGE.Tween.thenTweenTo.
	 */
	setup: function(params)
	{
		this.id = params.id;

		for(var k in params)
		{
			if(this.hasOwnProperty(k))
			{
				this[k] = params[k];
			}
			else
			{
				// we need to be modifying the internal _mLayout properties when tweening layouts
				this._mEndValues[(k === "layout") ? "_mLayout": k] = typeof params[k] === "object" ? TGE.DeepClone(params[k]) : params[k];
			}
		}

		// Handle any custom easing parameters
		if(this.easing===TGE.Tween.Back.In || this.easing===TGE.Tween.Back.Out || this.easing===TGE.Tween.Back.InOut)
		{
			this._mEaseParam = params.easingParam ? params.easingParam : 1.70158;
		}
		else if(this.easing===TGE.Tween.Elastic.In || this.easing===TGE.Tween.Elastic.Out || this.easing===TGE.Tween.Elastic.InOut)
		{
			this._mEaseParam = params.easingParam ? params.easingParam : 1;
		}

		// Limited looping
		if(typeof(params.loop)==="number")
		{
			this._mRepeats = params.loop*2;
		}

		// If it's a tween-from we should apply the initial values now
		if(this.startFromEnd)
		{
			this._setupValues();
		}

		// PAN-1378/1380 - Leaving this warning out until we can figure out what's wrong with tweening layouts.
		// Responsive layout validation. Tweening using absolute x/y/scaleX/Y destinations (or origins) when the tweened object
		// uses any form of layout strategy is likely incorrect. These tweens need to be done with a tweened layout object.
		/*if(TGE.Game.GetInstance().debugResizeMode && params.target.isResponsive() &&
			(params.x || params.y || params.scale || params.scaleX || params.scaleY))
		{
			TGE.Debug.Log(TGE.Debug.LOG_WARNING, "tweening to absolute coordinates/scale on a responsive object");
		}*/

		return this;
	},

	/**
	 * Indicates whether or not the tween animation is complete.
	 * @returns {Boolean} Whether or not the tween animation is complete.
	 */
	finished: function()
	{
		return this._mFinished;
	},

	/**
	 * Creates a new tween and sets it up to play once this tween is complete. Often referred to as 'chaining'.
	 * @param {Object} params Information used to initialize the tween. For a complete list of parameters, see {@link TGE.Tween.setup}
	 * @returns {TGE.Tween} Returns the new tween object that was created.
	 */
	thenTweenTo: function(params)
	{
		params.target = this.target;
		var tween = new TGE.Tween().setup(params);
		this._mChainedTweens.push(tween);

		return tween;
	},

	/** @ignore */
	_setupValues: function()
	{
		// Don't do this more than once
		if(this._mSetup)
		{
			return;
		}

		// Call the onBegin callback
        if (this.onBegin!==null)
        {
            this.onBegin();
        }

		// Setup the start values based on the object's current values
		for(var p in this._mEndValues)
		{
			var val = (!this.target.hasOwnProperty(p) && p==="scale") ? this.target.scaleX : this.target[p];
			this._mStartValues[p] = TGE.DeepClone(val, this._mEndValues[p]);
		}

		// If this is a tween-from then flip the start and end
		if(this.startFromEnd)
		{
			var temp = this._mStartValues;
			this._mStartValues = this._mEndValues;
			this._mEndValues = temp;

			// Apply the initial values
			for(var p in this._mStartValues)
			{
				this._setProp(this.target, this._mStartValues, this._mEndValues, p, 0);
			}
		}

		this._mSetup = true;
	},

	/** @ignore */
	_update: function(elapsedTime)
	{
		// Done?
		if(this.finished())
		{
			return;
		}

		this._mAge += elapsedTime;

		// Not time to start?
		if(this._mAge<this.delay)
		{
			return;
		}

		// Evaluate the starting values now (they may have changed since this tween was instantiated
		// if it is part of a chain - tween-froms will have already been setup)
		if(!this._mSetup)
		{
			this._setupValues();
		}

		// Calculate the percentage complete
		var percent = (this._mAge-this.delay)/this.duration;

		// Done?
		if(percent>=1)
		{
			if(this.loop===true || this._mRepeats>=2)
			{
				this._mAge = this._mAge-this.duration;
				percent -= 1;
				if(this.rewind)
				{
					this._mForward = !this._mForward;
				}
				if (this.onLoopComplete !== null)
				{
					this.onLoopComplete();
				}
				this._mRepeats--;
			}
			else
			{
				if (this.onLoopComplete !== null)
				{
					this.onLoopComplete();
				}

				// It's done
				this._mFinished = true;
			}
		}

		// Apply the updated property values to the target
		var val = this._mFinished ? 1 : this.easing(percent,this._mEaseParam);
		val = this._mForward ? val : 1-val;
		for(var p in this._mStartValues)
		{
			this._setProp(this.target, this._mStartValues, this._mEndValues, p, val);
		}

		// If we just finished, handle chaining/callbacks
		if(this._mFinished)
		{
			this.endTween();
		}
	},

	/**
	 * Sets the fractional progress value of a property.
	 * If the property is an object, then it recursively sets the values therein.
	 * @ignore
	 */
	_setProp: function(target, start, end, prop, frac)
	{
		if (typeof start[prop] === "object")
		{
			// recursively iterate object properties, for setting things like 'layout' values
			for (var key in start[prop])
			{
				this._setProp(target[prop], start[prop], end[prop], key, frac);
			}

			// if this was a 'layout' object, call setLayout
			if (prop === "_mLayout")
			{
				target._setLayout(target._mLayout);
			}
		}
		else
		{
			target[prop] = start[prop] + (end[prop] - start[prop]) * frac;
		}
	},

	/**
	 * Ends a current tween in progress, regardless of whether it had finished playback or not. The object's tweened parameters will stay at their current values from the moment endTween was called.
	 * @param {Boolean} [runChains=true] Indicates whether to start any tweens that are chained to this one (defaults to true).
	 * @param {Boolean} [fireCallback=true] Indicates whether to fire the onComplete callback if one was set (defaults to true).
	 */
	endTween: function(runChains,fireCallback)
	{
		runChains = typeof runChains === "undefined" ? true : runChains;
		fireCallback = typeof fireCallback === "undefined" ? true : fireCallback;

		this._mFinished = true; // In case this function is called directly

		// Chaining?
		if(runChains && this._mChainedTweens.length>0)
		{
			for(var t=0; t<this._mChainedTweens.length; t++)
			{
				this.target._injectTween(this._mChainedTweens[t]);
			}
		}
		this._mChainedTweens = null;

		// Callback?
		if(fireCallback && this.onComplete!==null)
		{
			this.onComplete();
		}

        // Remove on complete?
        if (this.removeOnComplete)
        {
            this.target.markForRemoval();
        }
	}
}

/**
 * Global function to allow a non-scenegraph object to apply a tween to a target's properties
 * @param {Object} params Information used to initialize the tween.
 * @returns {TGE.Tween} Returns the new tween object that was created. This can be used to chain new tweens using TGE.Tween.thenTweenTo.
 */
TGE.Tween.To = function(params)
{
	return TGE.Game.GetInstance().stage.tweenTo(params);
}

/**
 * Global function to allow a non-scenegraph object to apply a tween to a target's properties
 * @param {Object} params Information used to initialize the tween.
 * @returns {TGE.Tween} Returns the new tween object that was created. This can be used to chain new tweens using TGE.Tween.thenTweenTo.
 */
TGE.Tween.From = function(params)
{
	return TGE.Game.GetInstance().stage.tweenFrom(params);
}

/**
 * these clutter up the docs and shouldn't be used directly anyways
 * Linear easing function.
 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
 * @returns {Number}
 * @constructor
 * @ignore
 */
TGE.Tween.Linear = function(e)
{
	return e;
}

/**
 * Quadratic easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Quadratic = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return e*e;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return e*(2-e);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if((e*=2)<1) return 0.5*e*e;
		return -0.5*(--e*(e-2)-1);
	}
}

/**
 * Cubic easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Cubic = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return e*e*e;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return --e*e*e+1;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if((e*=2)<1) return 0.5*e*e*e;
		return 0.5*((e-=2)*e*e+2);
	}
}

/**
 * Quartic easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Quartic = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return e*e*e*e;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return 1-(--e*e*e*e);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if((e*=2)<1) return 0.5*e*e*e*e;
		return -0.5 * ((e-=2) * e*e*e-2);
	}
}

/**
 * Quintic easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Quintic = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return e*e*e*e*e;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return --e*e*e*e*e+1;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if ((e*=2)<1) return 0.5*e*e*e*e*e;
		return 0.5*((e-=2)*e*e*e*e+2);
	}
}

/**
 * Sinusodal easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Sine = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return 1-Math.cos(e*Math.PI/2);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return Math.sin(e*Math.PI/2);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		return 0.5*(1-Math.cos(Math.PI*e));
	}
}

/**
 * Exponential easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Exponential = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return e===0 ? 0 : Math.pow(1024,e-1);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return e===1 ? 1 : 1-Math.pow(2,-10*e);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if(e===0) return 0;
		if(e===1) return 1;
		if((e*=2)<1) return 0.5*Math.pow(1024,e-1);
		return 0.5*(-Math.pow(2,-10*(e-1))+2);
	}
}

/**
 * Circular easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Circular = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return 1-Math.sqrt(1-e*e);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		return Math.sqrt(1-(--e*e));
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if ((e*=2)<1) return -0.5*(Math.sqrt(1-e*e)-1);
		return 0.5*(Math.sqrt(1-(e-=2)*e)+1);
	}
}

/**
 * Elastic easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Elastic = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1 Amplitude of the elastic effect.
	 * @returns {Number}
	 */
	In: function(e,t)
	{
		return -(t*Math.pow(2,10*(e-=1))*Math.sin((e-0.3/(2*Math.PI)*(Math.asin(1/t) || 0))*2*Math.PI/0.3));
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1 Amplitude of the elastic effect.
	 * @returns {Number}
	 */
	Out: function(e,t)
	{
		return t*Math.pow(2,-10*e)*Math.sin((e-0.3/(2*Math.PI)*(Math.asin(1/t)||0))*2*Math.PI/0.3)+1;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1 Amplitude of the elastic effect.
	 * @returns {Number}
	 */
	InOut: function(e,t)
	{
		var n = 0.3/(2*Math.PI)*(Math.asin(1/t)||0);
		var r = 2*Math.PI;
		return (e*=2)<1 ? -0.5*t*Math.pow(2,10*(e-=1))*Math.sin((e-n)*r/0.45) : t*Math.pow(2,-10*(e-=1))*Math.sin((e-n)*r/0.45)*0.5+1;
	}
}

/**
 * Back easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Back = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1.70158 Amplitude of the back effect.
	 * @returns {Number}
	 */
	In: function(e,a)
	{
		return e*e*((a+1)*e-a);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1.70158 Amplitude of the back effect.
	 * @returns {Number}
	 */
	Out: function(e,t)
	{
		return (e = e-1)*e*((t+1)*e+t)+1;
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @param {Number} a=1.70158 Amplitude of the back effect.
	 * @returns {Number}
	 */
	InOut: function(e,t)
	{
		var n = t*1.525;
		return (e*=2)<1 ? 0.5*e*e*((n+1)*e-n) : 0.5*((e-=2)*e*((n+1)*e+n)+2);
	}
}

/**
 * Bounce easing functions.
 * @ignore
 * @constructor
 */
TGE.Tween.Bounce = {

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	In: function(e)
	{
		return 1-TGE.Tween.Bounce.Out(1-e);
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	Out: function(e)
	{
		if(e<(1/2.75)) { return 7.5625*e*e; }
		else if(e<(2/2.75)) { return 7.5625*(e-=(1.5/2.75))*e+0.75; }
		else if(e<(2.5/2.75)) { return 7.5625*(e-=(2.25/2.75))*e+0.9375; }
		else { return 7.5625*(e-=(2.625/2.75))*e+0.984375; }
	},

	/**
	 * @param {Number} e Elapsed time normalized to a percentage value (0-1)
	 * @returns {Number}
	 */
	InOut: function(e)
	{
		if(e<0.5) return TGE.Tween.Bounce.In(e*2)*0.5;
		return TGE.Tween.Bounce.Out(e*2-1)*0.5+0.5;
	}
}
