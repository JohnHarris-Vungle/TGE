TGE.GenericLoadingWindow = function(width,height)
{
    TGE.GenericLoadingWindow.superclass.constructor.apply(this,arguments);

    this.backgroundColor = "#000";

    // Bar background
    var bWidth = 300;
    var bHeight = 25;
    var background = this.addChild(new TGE.DisplayObjectContainer().setup({
        backgroundColor: "#fff",
        width: bWidth,
        height: bHeight,
        layout: {
            xPercentage: 0.5,
            yPercentage: 0.5,
            scaleToWidth: 0.5,
            scaleToHeight: 0.05
        }
    }));

    // Bar inverse fill
    var thickness = 3;
    bar = background.addChild(new TGE.DisplayObjectContainer().setup({
        registrationX: 1,
        x: background.width/2 - thickness/2,
        backgroundColor: "#000",
        width: bWidth-thickness,
        height: bHeight-thickness,
        scaleX: 1
    }));

    // Add an event listener for the progress update
    this.addEventListener("progress",function(event) {
        bar.scaleX = 1-event.percentComplete;
    });
}
extend(TGE.GenericLoadingWindow,TGE.Window);