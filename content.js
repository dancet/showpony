(function () {
    // Check if the content script is already injected to prevent duplication
    if (window.contentScriptInjected !== true) {
        // Mark the content script as injected
        window.contentScriptInjected = true;

        // Set the icon badge text to "on" (indicates the extension is active)
        chrome.runtime.sendMessage({ iconText: "on" });

        // Get the current window dimensions to size the canvas
        let _docWidth = document.body.offsetWidth;
        let _docHeight = document.body.offsetHeight;

        // Define common CSS properties for the canvas
        let css = 'position:fixed; background:transparent; z-index:100000; top:0; left:0; bottom:0; right:0;';

        // Create the canvas element that will overlay the webpage
        let canvas = document.createElement('canvas');
        canvas.id = 'showpony'; // Unique ID for the canvas
        canvas.width = _docWidth; // Set canvas width
        canvas.height = _docHeight; // Set canvas height
        canvas.style.cssText = css; // Apply CSS to ensure proper placement

        // Add the canvas to the top of the body element
        document.body.prepend(canvas);
        let ctx = canvas.getContext("2d"); // Get the canvas rendering context

        // Variables for tracking mouse activity and positions
        let offsetX, offsetY; // Canvas offset relative to the window
        let startX, startY, endX, endY; // Start and end positions of the box
        let isDown = false; // Indicates whether the user is dragging to draw
        let isDraggingCorner = false; // Indicates whether the user is dragging a corner
        let draggingCorner = null; // Tracks which corner is being dragged

        // Create a "Clear" button to allow users to reset the overlay
        let clearButton = document.createElement("button");
        clearButton.id = "clearOverlayButton"; // Unique ID for the button
        clearButton.textContent = "Clear"; // Button label
        clearButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100001; 
            padding: 5px 10px;
            font-size: 14px;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 3px;
            cursor: pointer;
        `;
        // Add functionality to clear the overlay when the button is clicked
        clearButton.onclick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        document.body.appendChild(clearButton);

        // Function to update the canvas offset (accounts for window scrolling)
        function updateOffset() {
            offsetX = canvas.getBoundingClientRect().left;
            offsetY = canvas.getBoundingClientRect().top;
        }

        // Function to draw the overlay on the canvas
        function drawOverlay() {
            // Clear the canvas to prepare for re-drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Normalize start and end coordinates to handle drag directions
            let normalizedStartX = Math.min(startX, endX);
            let normalizedEndX = Math.max(startX, endX);
            let normalizedStartY = Math.min(startY, endY);
            let normalizedEndY = Math.max(startY, endY);

            // Draw a semi-transparent black overlay on the entire canvas
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear a rectangular area in the overlay to create the transparent box
            ctx.clearRect(
                normalizedStartX,
                normalizedStartY,
                normalizedEndX - normalizedStartX,
                normalizedEndY - normalizedStartY
            );

            // Draw corner indicators for resizing
            drawCornerBox(normalizedStartX, normalizedStartY, "top-left");
            drawCornerBox(normalizedEndX, normalizedStartY, "top-right");
            drawCornerBox(normalizedStartX, normalizedEndY, "bottom-left");
            drawCornerBox(normalizedEndX, normalizedEndY, "bottom-right");
        }

        // Function to draw draggable corner indicators
        function drawCornerBox(x, y, position) {
            let size = 20; // Size of the corner box
            let offset = 10; // Distance from the box's corner to the transparent box
            let adjustment = 1; // Fine adjustment to ensure lines overlap cleanly
            ctx.lineWidth = 2; // Thickness of the corner lines
            ctx.strokeStyle = "#878787"; // Color of the corner lines

            ctx.beginPath(); // Begin drawing the corner lines
            switch (position) {
                case "top-left":
                    ctx.moveTo(x - offset - adjustment, y - offset); // Horizontal line
                    ctx.lineTo(x + size - offset, y - offset);
                    ctx.moveTo(x - offset, y - offset - adjustment); // Vertical line
                    ctx.lineTo(x - offset, y + size - offset);
                    break;
                case "top-right":
                    ctx.moveTo(x + offset + adjustment, y - offset); // Horizontal line
                    ctx.lineTo(x - size + offset, y - offset);
                    ctx.moveTo(x + offset, y - offset - adjustment); // Vertical line
                    ctx.lineTo(x + offset, y + size - offset);
                    break;
                case "bottom-left":
                    ctx.moveTo(x - offset - adjustment, y + offset); // Horizontal line
                    ctx.lineTo(x + size - offset, y + offset);
                    ctx.moveTo(x - offset, y + offset + adjustment); // Vertical line
                    ctx.lineTo(x - offset, y - size + offset);
                    break;
                case "bottom-right":
                    ctx.moveTo(x + offset + adjustment, y + offset); // Horizontal line
                    ctx.lineTo(x - size + offset, y + offset);
                    ctx.moveTo(x + offset, y + offset + adjustment); // Vertical line
                    ctx.lineTo(x + offset, y - size + offset);
                    break;
            }
            ctx.stroke(); // Render the corner lines
        }

        // Function to check if a point is inside a corner box
        function isPointInCornerBox(x, y, cornerX, cornerY) {
            let size = 30; // Size of the draggable area around the corner
            return (
                x >= cornerX - size / 2 &&
                x <= cornerX + size / 2 &&
                y >= cornerY - size / 2 &&
                y <= cornerY + size / 2
            );
        }

        // Event handlers for mouse actions
        canvas.addEventListener("mousedown", (e) => {
            e.preventDefault();
            updateOffset();

            let mouseX = e.clientX - offsetX;
            let mouseY = e.clientY - offsetY;

            // Check if the user is clicking a corner box
            if (isPointInCornerBox(mouseX, mouseY, startX, startY)) {
                isDraggingCorner = true;
                draggingCorner = "top-left";
            } else if (isPointInCornerBox(mouseX, mouseY, endX, startY)) {
                isDraggingCorner = true;
                draggingCorner = "top-right";
            } else if (isPointInCornerBox(mouseX, mouseY, startX, endY)) {
                isDraggingCorner = true;
                draggingCorner = "bottom-left";
            } else if (isPointInCornerBox(mouseX, mouseY, endX, endY)) {
                isDraggingCorner = true;
                draggingCorner = "bottom-right";
            } else {
                // Otherwise, start drawing a new box
                isDown = true;
                startX = mouseX;
                startY = mouseY;
                endX = startX;
                endY = startY;
            }
        });

        canvas.addEventListener("mousemove", (e) => {
            e.preventDefault();
            updateOffset();

            let mouseX = e.clientX - offsetX;
            let mouseY = e.clientY - offsetY;

            if (isDraggingCorner) {
                // Update the appropriate corner's position
                switch (draggingCorner) {
                    case "top-left":
                        startX = mouseX;
                        startY = mouseY;
                        break;
                    case "top-right":
                        endX = mouseX;
                        startY = mouseY;
                        break;
                    case "bottom-left":
                        startX = mouseX;
                        endY = mouseY;
                        break;
                    case "bottom-right":
                        endX = mouseX;
                        endY = mouseY;
                        break;
                }
                drawOverlay(); // Redraw the overlay
            } else if (isDown) {
                // Update the box's end coordinates as the user drags
                endX = mouseX;
                endY = mouseY;
                drawOverlay(); // Redraw the overlay
            } else {
                // Change the cursor to indicate when over a draggable corner
                if (
                    isPointInCornerBox(mouseX, mouseY, startX, startY) ||
                    isPointInCornerBox(mouseX, mouseY, endX, startY) ||
                    isPointInCornerBox(mouseX, mouseY, startX, endY) ||
                    isPointInCornerBox(mouseX, mouseY, endX, endY)
                ) {
                    canvas.style.cursor = "move";
                } else {
                    canvas.style.cursor = "default";
                }
            }
        });

        canvas.addEventListener("mouseup", (e) => {
            e.preventDefault();
            isDown = false; // Stop drawing
            isDraggingCorner = false; // Stop dragging a corner
            draggingCorner = null; // Clear the active corner
        });
    } else {
        // If the extension is deactivated, reset everything
        window.contentScriptInjected = false;

        chrome.runtime.sendMessage({ iconText: "off" });

        // Remove the canvas and clear button if they exist
        let showPony = document.getElementById("showpony");
        let clearButton = document.getElementById("clearOverlayButton");
        if (showPony) showPony.remove();
        if (clearButton) clearButton.remove();
    }
})();
