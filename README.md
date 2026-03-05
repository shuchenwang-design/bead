# Fuse Bead Fuel (v1.1.0)
**Transform any image into a precise, buildable fuse bead blueprint. You can also make your own edits with beads on a grid cell scale or global scale.**

## **New in v1.1.0**
**Global Color Swap:** Change every instance of a bead color across the entire grid directly to any Mard bead color.

<img width="512" height="auto" alt="image" src="https://github.com/user-attachments/assets/65082483-872c-4a20-8a33-cc5bdcb7106b" />

**Blueprint Download:** Download a high-resolution blueprint including your fuse bead plan, active highlights (if you are in the highlight mode), and all beads in use.

<img width="512" height="auto" alt="FBF-Blueprint-Complete-1772708562628" src="https://github.com/user-attachments/assets/1636fc9f-f274-4220-9902-c27cb41353ef" />



## **Quick Start Guide**
Follow these five simple steps to turn any photo or illustration into an accessible fuse bead blueprint and start your beading experience smoothly!

### Upload & Prep
Import your image using the sidebar. Use the Color Correction sliders to ensure your subject stands out. The preview canvas updates in real-time.

### Configure Canvas
Set your Grid Size. If you have a limited bead supply, lower the Max Colors slider; the engine will automatically merge similar shades.

### Generate & Refine
Click Generate Blueprint.
<br>**Manual Edit:** Click any cell on the grid to change its color or delete the bead.
<br>**Global Swap:** Hover over a color card in the palette and click the Exchange Icon to replace that color everywhere to another Mard bead color.

### Download & Build
Click Download PNG to get a printable instruction sheet. It will include your current view (including highlights and labels) and a piece-count list for all beads in use.

## **Tips on source image**
To get the most out of the generator, it helps to understand the Sampling Logic:
<br>The generator identifies the most representative color for each cell. If a single color appears in more than 20% of the cell's pixels within the set tolerance, the generator selects the most frequent color to find its Mard Palette match. If no dominant color is found, it calculates the average color value of all pixels in that cell.
<br>
<br>For Best Results:
<br>**High Contrast:** Use high-contrast illustrations or slightly increase the Contrast slider for photographs to ensure bead colors remain distinct.
<br>**Transparency:** Upload PNG files with transparent backgrounds to ensure the generator only places beads exactly where you want them.
<br>

## **Technical Stack**
**Frontend:** HTML5, Tailwind CSS
**Logic:** Vanilla JavaScript (ES6+)
**Engine:** HTML5 Canvas API for image processing and PNG generation
**Data:** JSON-based color palettes (Mard Bead System)

## **License & Usage**
Distributed under the MIT License. See `LICENSE` for more information.

**Author:** [Shuchen Wang](https://github.com/shuchenwang-design)  
**Live Demo:** [Use Tool Online](https://shuchenwang-design.github.io/bead/)

<br>Have fun fuse beading!
