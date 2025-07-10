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
        let isDraggingBox = false; // Indicates whether the user is dragging the entire box
        let dragStartX, dragStartY; // Initial mouse position when dragging starts

        // Create an "Exit" button to deactivate the extension
        let exitButton = document.createElement("button");
        exitButton.id = "exitShowPonyButton"; // Unique ID for the button
        exitButton.textContent = "Exit (esc)"; // Button label
        exitButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 100001; 
            padding: 5px 10px;
            font-size: 14px;
            background-color: #fff;
            color: #000;
            border: 1px solid #ccc;
            border-radius: 3px;
            cursor: pointer;
        `;
        
        // Function to exit the extension (shared by button and escape key)
        function exitExtension() {
            // Deactivate the extension by setting the flag and cleaning up
            window.contentScriptInjected = false;
            chrome.runtime.sendMessage({ iconText: "off" });
            
            // Remove escape key event listener to prevent memory leak
            document.removeEventListener('keydown', escapeKeyHandler);
            
            // Remove all extension elements
            let showPony = document.getElementById("showpony");
            let clearButton = document.getElementById("clearOverlayButton");
            let exitButton = document.getElementById("exitShowPonyButton");
            let logoContainer = document.getElementById("showPonyLogo");
            let instructionText = document.getElementById("showponyInstructions");
            if (showPony) showPony.remove();
            if (clearButton) clearButton.remove();
            if (exitButton) exitButton.remove();
            if (logoContainer) logoContainer.remove();
            if (instructionText) instructionText.remove();
        }

        // Add functionality to exit the extension when the button is clicked
        exitButton.onclick = exitExtension;
        document.body.appendChild(exitButton);

        // Add escape key event listener to exit the extension
        const escapeKeyHandler = (e) => {
            if (e.key === 'Escape') {
                exitExtension();
            }
        };
        document.addEventListener('keydown', escapeKeyHandler);

        // Create logo container in top left corner
        let logoContainer = document.createElement("div");
        logoContainer.id = "showPonyLogo";
        logoContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 100001;
            display: flex;
            align-items: center;
            gap: 8px;
            height: 40px;
        `;

        // Create logo image
        let logoImage = document.createElement("img");
        logoImage.src = chrome.runtime.getURL("images/32x32.png");
        logoImage.style.cssText = `
            width: 32px;
            height: 32px;
        `;

        // Create logo text
        let logoText = document.createElement("span");
        logoText.textContent = "Show Pony";
        logoText.style.cssText = `
            color: #ffffff;
            font-size: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        `;

        logoContainer.appendChild(logoImage);
        logoContainer.appendChild(logoText);
        document.body.appendChild(logoContainer);

        // Create a "Clear" button to allow users to reset the overlay
        let clearButton = document.createElement("button");
        clearButton.id = "clearOverlayButton"; // Unique ID for the button
        clearButton.textContent = "Clear"; // Button label
        clearButton.style.cssText = `
            position: fixed;
            top: 10px;
            z-index: 100001; 
            padding: 5px 10px;
            font-size: 14px;
            background-color: #fff;
            color: #000;
            border: 1px solid #ccc;
            border-radius: 3px;
            cursor: pointer;
        `;
        
        // Add functionality to clear the overlay when the button is clicked
        clearButton.onclick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        document.body.appendChild(clearButton);
        
        // Position Clear button based on Exit button width after DOM insertion
        setTimeout(() => {
            let exitButtonWidth = exitButton.offsetWidth;
            clearButton.style.right = (10 + exitButtonWidth + 10) + 'px'; // 10px edge + button width + 10px gap
        }, 0);

        // Create instructional text overlay
        let instructionText = document.createElement("div");
        instructionText.id = "showponyInstructions";
        instructionText.innerHTML = "Welcome to Show Pony.<br>Click and drag to get started.";
        instructionText.style.cssText = `
            position: fixed;
            top: 25%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 100002;
            padding: 4px;
            font-size: 24px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 500;
            color: #ffffff;
            background: linear-gradient(45deg, #8a2be2, #4169e1, #00bfff, #9370db);
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            user-select: none;
        `;
        
        // Create inner content div for the black background
        let innerContent = document.createElement("div");
        innerContent.innerHTML = instructionText.innerHTML;
        innerContent.style.cssText = `
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            padding: 20px 30px;
            margin: 0;
        `;
        
        // Clear the outer div and add the inner content
        instructionText.innerHTML = "";
        instructionText.appendChild(innerContent);
        document.body.appendChild(instructionText);

        // Function to hide instruction text
        function hideInstructionText() {
            if (instructionText && instructionText.parentNode) {
                instructionText.remove();
            }
        }

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
            
            // Draw drag handle for moving the entire box
            drawDragHandle(normalizedStartX, normalizedEndX, normalizedStartY);
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

        // Function to draw drag handle for moving the entire box
        function drawDragHandle(startX, endX, topY) {
            let centerX = (startX + endX) / 2;
            let handleLength = 30; // Length of the drag handle line
            let offset = 10; // Distance above the box (matches corner handle offset)
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#878787";
            ctx.beginPath();
            ctx.moveTo(centerX - handleLength / 2, topY - offset);
            ctx.lineTo(centerX + handleLength / 2, topY - offset);
            ctx.stroke();
        }

        // Function to check if a point is inside the drag handle area
        function isPointInDragHandle(x, y, startX, endX, topY) {
            let centerX = (startX + endX) / 2;
            let handleLength = 30;
            let offset = 10;
            let hitAreaHeight = 10; // Height of the clickable area
            
            return (
                x >= centerX - handleLength / 2 &&
                x <= centerX + handleLength / 2 &&
                y >= topY - offset - hitAreaHeight / 2 &&
                y <= topY - offset + hitAreaHeight / 2
            );
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
            
            // Hide instruction text when user starts interacting
            hideInstructionText();

            let mouseX = e.clientX - offsetX;
            let mouseY = e.clientY - offsetY;

            // Check if the user is clicking the drag handle (only if a box exists)
            if (startX !== undefined && isPointInDragHandle(mouseX, mouseY, Math.min(startX, endX), Math.max(startX, endX), Math.min(startY, endY))) {
                isDraggingBox = true;
                dragStartX = mouseX;
                dragStartY = mouseY;
            } else if (isPointInCornerBox(mouseX, mouseY, startX, startY)) {
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

            if (isDraggingBox) {
                // Calculate the movement delta
                let deltaX = mouseX - dragStartX;
                let deltaY = mouseY - dragStartY;
                
                // Move the entire box by the delta
                startX += deltaX;
                startY += deltaY;
                endX += deltaX;
                endY += deltaY;
                
                // Update the drag start position for the next movement
                dragStartX = mouseX;
                dragStartY = mouseY;
                
                drawOverlay(); // Redraw the overlay
            } else if (isDraggingCorner) {
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
                // Change the cursor to indicate when over draggable elements
                if (startX !== undefined && isPointInDragHandle(mouseX, mouseY, Math.min(startX, endX), Math.max(startX, endX), Math.min(startY, endY))) {
                    canvas.style.cursor = "move";
                } else if (isPointInCornerBox(mouseX, mouseY, startX, startY)) {
                    canvas.style.cursor = "ne-resize"; // Top-left corner - cursor points northeast
                } else if (isPointInCornerBox(mouseX, mouseY, endX, startY)) {
                    canvas.style.cursor = "nw-resize"; // Top-right corner - cursor points northwest  
                } else if (isPointInCornerBox(mouseX, mouseY, startX, endY)) {
                    canvas.style.cursor = "se-resize"; // Bottom-left corner - cursor points southeast
                } else if (isPointInCornerBox(mouseX, mouseY, endX, endY)) {
                    canvas.style.cursor = "sw-resize"; // Bottom-right corner - cursor points southwest
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
            isDraggingBox = false; // Stop dragging the box
        });
    } else {
        // If the extension is deactivated, reset everything
        window.contentScriptInjected = false;

        chrome.runtime.sendMessage({ iconText: "off" });

        // Remove the canvas, buttons, logo, and instruction text if they exist
        let showPony = document.getElementById("showpony");
        let clearButton = document.getElementById("clearOverlayButton");
        let exitButton = document.getElementById("exitShowPonyButton");
        let logoContainer = document.getElementById("showPonyLogo");
        let instructionText = document.getElementById("showponyInstructions");
        if (showPony) showPony.remove();
        if (clearButton) clearButton.remove();
        if (exitButton) exitButton.remove();
        if (logoContainer) logoContainer.remove();
        if (instructionText) instructionText.remove();
    }
})();
