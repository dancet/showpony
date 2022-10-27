// content.js
(function () {    
    // ensure the content script is only executed once when the icon is clicked
    if (window.contentScriptInjected !== true) {
        window.contentScriptInjected = true; // global scope

        // add a badge to the icon (listener code in background.js)
        chrome.runtime.sendMessage({iconText: "on"});

        // get current window dimensions
        let _docWidth = document.body.offsetWidth;
        let _docHeight = document.body.offsetHeight;

        // z-index super high to try and ensure it sits over everything else
        let css = 'position:fixed; background:transparent; z-index:100000; top:0; left:0; bottom:0; right:0;';

        // create the canvas
        var canvas = document.createElement('canvas');
        canvas.id = 'showpony';
        canvas.width = _docWidth;
        canvas.height = _docHeight;
        canvas.style.cssText = css

        // add the canvas to the body element and get the context
        document.body.prepend(canvas);
        var ctx = canvas.getContext("2d");

        // track where the canvas is on the window - (used to help calculate mouseX/mouseY)
        var offsetX;
        var offsetY;

        // these will hold the starting mouse position
        var startX;
        var startY;

        // these will hold the end mouse position
        var endX;
        var endY;

        // this flag is true when the user is dragging the mouse
        var isDown = false;

        // functions
        function updateOffset() {
            offsetX = canvas.getBoundingClientRect().left;
            offsetY = canvas.getBoundingClientRect().top;
        }

        function handleMouseDown(e) {
            e.preventDefault();
            e.stopPropagation();

            // clear any existing shade/box
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // update the x/y offsets to account for scroll position
            updateOffset()

            // save the starting x/y of the rectangle
            startX = parseInt(e.clientX - offsetX);
            startY = parseInt(e.clientY - offsetY);

            // set a flag indicating the drag has begun
            isDown = true;
        }

        function handleMouseMove(e) {
            e.preventDefault();
            e.stopPropagation();

            // if we're not dragging, just return
            if (!isDown) {
                return;
            }

            // update the x/y offsets to account for scroll position
            updateOffset()
            
            // get the current mouse position
            mouseX = parseInt(e.clientX - offsetX);
            mouseY = parseInt(e.clientY - offsetY);

            // clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // calculate the rectangle width/height based on starting vs current mouse position
            endX = mouseX - startX;
            endY = mouseY - startY;

            // draw the grey background
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
            // clear the space in the middle based on start and end mouse movement
            ctx.clearRect(startX, startY, endX, endY);
        }

        function handleMouseUp(e) {
            e.preventDefault();
            e.stopPropagation();

            // the drag is over, clear the dragging flag
            isDown = false;
        }

        canvas.onmousedown = function(event){
            handleMouseDown(event)
        }

        canvas.onmousemove = function(event){
            handleMouseMove(event)
        }

        canvas.onmouseup = function(event){
            handleMouseUp(event);
        }

    } else {
        // set this so we re-enable on the next click of the icon
        window.contentScriptInjected = false;

        // clear the badge text
        chrome.runtime.sendMessage({iconText: "off"});

        // remove the HTML element that was added before
        var showPony = document.getElementById('showpony');

        if (showPony) {
            showPony.remove();
            return;
        }    
    }
})();
