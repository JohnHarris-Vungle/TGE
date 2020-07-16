/** @ignore */
TGE.Tracking = {
    warn: function() { TGE.Debug.Log(TGE.Debug.LOG_WARNING, "TGE.Tracking URLs can no longer be set in game code"); }
};

TGE.Tracking.FireOnImpression =
TGE.Tracking.FireOnGameViewable =
TGE.Tracking.FireOnInteraction =
TGE.Tracking.FireOnEngagement =
TGE.Tracking.FireOnCompletion =
TGE.Tracking.FireOnClickThrough =
TGE.Tracking.FireOnCustomEvent = TGE.Tracking.warn;
