Welcome to the first release of Fuse Bead Fuel, a generative tool built to transform your own images into precise, buildable fuse bead blueprints. By combining advanced color quantization with a manual editing suite, this tool bridges the gap between digital inspiration and physical creation for hobbyists and artists alike.

<img width="1508" height="770" alt="image" src="https://github.com/user-attachments/assets/3125221d-53bc-481a-b466-9ddf231913e5" />


## Quick Start Guide
Follow these five simple steps to turn any photo or illustration into an accessible fuse bead blueprint and start your beading experience smoothly!

### Upload & Prep
**Import:** Click Upload Image in the left sidebar to select your reference file.
<br>**Initial View:** The tool will automatically generate a 50×50 grid based on your image using the default Mard Bead palette.
<br>**Fine-Tune:** Use the Color Correction sliders (Hue, Saturation, Lightness, and Contrast) to make the colors pop. Watch the Preview Canvas to see how your adjustments affect the source image.

### Configure Your Canvas
**Scale the Grid:** Use the Grid Size slider to match your physical pegboard. You can go up to 100×100 for large-scale murals (if you want an even larger one, you can also type in the certain amount in console. However larger scale will significantly slow down the generation.)
<br>**Simplify the Palette:** If you have a limited bead collection, lower the Max Colors slider. The engine will automatically merge similar shades to reduce the number of different colors you need to buy.

### Generate & Review
**Process:** Click the Generate Blueprint button to finalize your settings.
<br>**Navigation:** Use the Numerical Rulers on the top and left to keep track of your progress.
<br>**Labels:** Toggle LABEL: ON/OFF to switch between seeing the bead codes (like A1, B12) and a clean "artistic" view of the final colors.

### Manual Refinement
**Highlighting:** Click any color in the Right Palette Sidebar. This will fade out all other beads on the grid, making it easy to see exactly where that specific color should be placed.
<br>**Direct Editing:** Click any individual cell on the grid to open the Floating Color Picker. Choose a new color from the current project palette or select the Red Slash icon to delete the bead and create a blank space.

### Export & Build
**Bead List:** Look at the Palette Sidebar to see the exact piece count for every color used in your piece.
<br>**Final Substitution:** If you don't have enough of a certain color, click the Trash Icon next to it in the palette. The tool will automatically replace those beads with the next closest available color in your project.

## Tips on source image
To get the most out of the generator, it helps to understand the Sampling Logic:
<br>The generator identifies the most representative color for each cell. If a single color appears in more than 20% of the cell's pixels within the set tolerance, the generator selects the most frequent color to find its Mard Palette match. If no dominant color is found, it calculates the average color value of all pixels in that cell.
<br>
<br>For Best Results:
<br>**High Contrast:** Use high-contrast illustrations or slightly increase the Contrast slider for photographs to ensure bead colors remain distinct.
<br>**Transparency:** Upload PNG files with transparent backgrounds to ensure the generator only places beads exactly where you want them.
<br>
<br>Have fun fuse beading!
