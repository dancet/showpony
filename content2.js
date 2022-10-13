// content.js
(function () {



    if (window.contentScriptInjected !== true) {
        window.contentScriptInjected = true; // global scope
        
        // get current window dimensions
        let _docWidth = document.body.offsetWidth; // (document.width !== undefined) ? document.width : document.body.offsetWidth;
        let _docHeight = document.body.offsetHeight; // (document.height !== undefined) ? document.height : document.body.offsetHeight;

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
        var offsetX; // = canvas.offsetLeft; note - these seemed to work, but I don't know if they're better or worse than the current method
        var offsetY; // = canvas.offsetTop;

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
            // EXPERIMENTAL
            offsetX = canvas.getBoundingClientRect().left;
            offsetY = canvas.getBoundingClientRect().top;
        }

        function handleMouseDown(e) {
            e.preventDefault();
            e.stopPropagation();

            // check if the mouse is clicking in the grey area
            // this defines the existing rectangle - ctx.clearRect(startX, startY, width, height);
            // TODO: work out the best way to clear. On mouse click anywhere or just in the grey area? Clicking an on-screen button? Not sure...

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

            // clear the existing defined box

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
            //ctx.beginPath();
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            //ctx.fillRect(offsetX, offsetY, _docWidth, _docHeight);  // <-- this is working, windowWidth, windowHeight
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

        window.contentScriptInjected = false;

        // handle toggling the chrome extension
        var showPony = document.getElementById('showpony');

        if (showPony) {
            showPony.remove();
            return;
        }    
    }


})();