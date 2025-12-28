# Bambu Lab P1S Deep Research

## Initial Specifications from Official Website

### P1S Core Specifications

**Body:**
- Build Volume: 256 x 256 x 256 mm³
- Chassis: Welded Steel
- Shell: Enclosed (Plastic & Glass)

**Speed:**
- Max Speed of Toolhead: 500 mm/s
- Max Acceleration of Toolhead: 20 m/s² (20000 mm/s²)

**Toolhead:**
- Hot End: All-Metal
- Nozzle: Stainless Steel
- Max Hot End Temperature: 300℃
- Toolhead Cable: Enhanced toolhead cable with cable chain

**Cooling & Filtration:**
- Control Board Fan: Closed Loop Control
- Chamber Temperature Regulator Fan: Closed Loop Control
- Auxiliary Part Cooling Fan: Closed Loop Control
- Air Filter: Activated Carbon Filter

**Supported Filaments:**
- PLA, PETG, TPU, PVA, PET: Ideal
- ABS, ASA: Ideal
- PA, PC: Capable

**Key Features:**
- CoreXY motion system
- Direct-drive Extruder
- Automatic bed leveling (ABL) sensor
- Vibration Compensation (XY)
- Pressure Advance
- Filament Run-out Sensor
- Power Loss Recovery
- Semi-automatic Belt Tensioning
- Fans with Speed Feedback
- Built-in chamber camera for Liveview & Time-lapse
- Multi-color capability: Up to 16 colors with AMS (Automatic Material System)
- Setup time: 15 minutes right out of the box

**Physical Dimensions (from search results):**
- Dimensions (W×D×H): 389 × 389 × 458 mm³
- Net Weight: 12.95 kg
- Package size: 485 × 480 × 528 mm³

**Electronics:**
- Input Voltage: 100-240 VAC, 50/60 Hz
- Max Power: 1000 W @220V, 350W @110V

**Heated Bed:**
- Max Bed Temperature: 100°C

---

## Sources:
- https://bambulab.com/en-us/p1


## Detailed Specifications from Official Bambu Lab Wiki

### Complete Technical Specifications Table

| Category | Specification | Value |
|----------|--------------|-------|
| **Printing Technology** | | Fused Deposition Modeling |
| **Body** | Build Volume (W×D×H) | 256 × 256 × 256 mm³ |
| | Chassis | Steel |
| | Shell | Plastic & Glass |
| **Tool Head** | Hot End | All-Metal |
| | Extruder Gears | Steel |
| | Nozzle | Stainless Steel |
| | Max Hot End Temperature | 300°C |
| | Nozzle Diameter (Included) | 0.4 mm |
| | Nozzle Diameter (Optional) | 0.2 mm, 0.6 mm, 0.8 mm |
| | Filament Cutter | Yes |
| | Filament Diameter | 1.75 mm |
| **Hot Bed** | Compatible Build Plate | Bambu Textured PEI Plate, Bambu Cool Plate, Bambu Engineering Plate, Bambu High Temperature Plate |
| | Max Build Plate Temperature | 100°C |
| **Speed** | Max Speed of Tool Head | 500 mm/s |
| | Max Acceleration of Tool Head | 20 m/s² |
| | Max Hot End Flow | 32 mm³/s @ABS (Model: 150×150mm single wall; Material: Bambu ABS; Temperature: 280℃) |
| **Cooling** | Part Cooling Fan | Closed Loop Control |
| | Hot End Fan | Closed Loop Control |
| | Control Board Fan | Closed Loop Control |
| | Chamber Temperature Regulator Fan | Closed Loop Control |
| | Auxiliary Part Cooling Fan | Closed Loop Control |
| | Air Filter | Activated Carbon Filter |
| **Supported Filament** | PLA, PETG, TPU, ABS, ASA, PA, PC, PVA, PET | Ideal |
| | Carbon/Glass Fiber Reinforced Polymer | Not Recommended |
| **Sensors** | Chamber Monitoring Camera | Low Rate Camera 1280 × 720 / 0.5fps, Timelapse Supported |
| | Filament Run Out Sensor | Yes |
| | Filament Odometry | Optional with AMS |
| | Power Loss Recover | Yes |
| **Physical Dimensions** | Dimensions (W×D×H) | 389 × 389 × 457 mm³ |
| | Net Weight | 12.95 kg |
| **Electrical Parameters** | Input Voltage | 100-240 VAC, 50/60 Hz |
| | Max Power | 1000W @220V, 350W @110V |
| | USB Output Power | 5V/1.5A |
| **Electronics** | Display | 2.7-inch 192×64 Screen |
| | Connectivity | Wi-Fi, Bluetooth, Bambu-Bus |
| | Storage | Micro SD Card |
| | Control Interface | Button, APP, PC Application |
| | Motion Controller | Dual-Core Cortex M4 |
| **Software** | Slicer | Bambu Studio (Support third party slicers which export standard G-code such as Superslicer, Prusaslicer and Cura, but certain advanced features may not be supported) |
| | Slicer Supported OS | MacOS, Windows |
| **WiFi** | Frequency Range | 2412MHz-2472MHz (CE), 2412MHz-2462MHz (FCC), 2400MHz-2483.5MHz (SRRC) |
| | Transmitter Power (EIRP) | ≤21.5dBm (FCC), ≤20dBm (CE/SRRC) |
| | Protocol | IEEE802.11 b/g/n |
| **Bluetooth** | Frequency Band | 2402MHz-2480MHz (CE/FCC), 2400MHz-2483.5MHz (SRRC) |
| | Transmitter Power (EIRP) | ≤20dBm (FCC/SRRC), <10dBm (CE) |
| | Protocol | BLE5.0 |

### Package Contents
- P1S 3D Printer
- Screen
- Spool Holder
- Filament
- Spare Hotend
- Nozzle Wiping Pads
- Power Cord
- Unclogging Pin Tool
- PTFE Tube
- Bambu Scraper
- Allen Keys
- Hotend Clip
- Double-sided Tape
- 32 GB MicroSD Card (inside printer)
- Textured PEI Plate (Pre-installed on the heat bed)

---

## Sources:
- https://wiki.bambulab.com/en/p1/manual/unboxing-p1s


## GitHub Repositories and Libraries

### 1. Official Bambu Lab BambuStudio
**Repository:** https://github.com/bambulab/BambuStudio
**Stars:** 3.6k | **Forks:** 539
**Language:** C++ (83.8%), C (7.9%), JavaScript (4.4%)
**License:** GNU Affero General Public License v3

**Description:** Official PC slicing software for BambuLab and other 3D printers. Based on PrusaSlicer.

**Key Features:**
- Basic slicing features & GCode viewer
- Multiple plates management
- Remote control & monitoring
- Auto-arrange and auto-orient objects
- Hybrid/Tree/Normal support types with customized support
- Multi-material printing and rich painting tools
- Multi-platform (Win/Mac/Linux) support
- Global/Object/Part level slicing parameters
- Advanced cooling logic controlling fan speed and dynamic print speed
- Auto brim according to mechanical analysis
- Support arc path (G2/G3)
- Support STEP format
- Assembly & explosion view
- Flushing transition-filament into infill/object during filament change

**Compile Support:**
- Windows 64-bit
- Mac 64-bit
- Linux (AppImages for Ubuntu/Fedora, Flathub version available)

### 2. OpenBL - Hardware Exploration
**Repository:** https://github.com/opensourcemanufacturing/OpenBL
**Stars:** 41 | **Forks:** 3

**Description:** Exploration of Bambu Lab Printer Hardware and Firmware. Contains detailed hardware information derived from observation and publicly available documentation.

**P1 Series Hardware Details:**

**Machine Controller (MC):**
- MCU: Spintrol SPC2168APE80
- Motor Drivers: AT8236 (for A, B, and Z axis steppers)
- Location: Back of printer behind metal rear panel

**MC Board Connectors:**
1. Z Motor
2. Right motor (view from rear)
3. Left motor (view from rear)
4. Chamber temperature regulator fan
5. Auxiliary part cooling fan
6. MC board fan
7. MC board to AC board connecting cable
8. AMS interface board
9. AP main board (power and communication cable)
10. TH board (power and communication cable)

**Toolhead Controller (TH):**
- MCU: Spintrol SPC1168APE48
- Motor Controller: AT8236 (for extruder)
- Connection: 6-pin JST style connector to MC board
- Cable: 6 conductor (two red, two black, one green, one white)
  - Speculation: Red/black = 24V, Green/white = CAN high/low

**Application Processor (AP):**
- Location: Behind user interface on front of printer
- Connection: 12 conductor cable to MC board

**AP Board Connectors:**
1. USB
2. Not Connected
3. Antenna
4. Not Connected
5. Camera FPC (probably CSI)
6. LED
7. SD Card

**FTP Access Information:**
- FTP Port: 990
- Username: bblp
- Password: Found under "access_code" in BambuStudio.conf

### 3. Bambu Lab Python API
**Repository:** https://github.com/acse-ci223/bambulabs_api

**Description:** Unofficial Python API for interacting with BambuLab 3D Printers. Enables programmatic control and monitoring.

### 4. Bambu Lab Cloud API
**Repository:** https://github.com/coelacant1/Bambu-Lab-Cloud-API

**Description:** Python Library Implementation for Bambu Lab Cloud API. Documentation and tools based on network traffic analysis.

### 5. OpenBambuAPI
**Repository:** https://github.com/Doridian/OpenBambuAPI

**Description:** Bambu API documentation for developers.

### 6. Bambu Link (Node.js)
**Repository:** https://github.com/Evan-2007/bambu-link
**Stars:** 7
**Language:** TypeScript

**Description:** A Node.js module for connecting to and controlling Bambu Lab 3D printers.

### 7. P1S Custom G-Code
**Repository:** https://github.com/Justagwas/P1S-GCODE
**Stars:** 10

**Description:** Custom-optimized G-Code for the Bambu Lab P1S Printer.

### 8. Bambu P1 Camera Streamer
**Repository:** https://github.com/slynn1324/BambuP1Streamer

**Description:** MJPEG stream access for Bambu P1 printers. Tested on P1S, expected to work for P1P camera.

### 9. Home Assistant P1 Spaghetti Detection
**Repository:** https://github.com/nberktumer/ha-bambu-lab-p1-spaghetti-detection

**Description:** Home Assistant integration leveraging Bambu Lab Integration and Obico ML server for detecting and handling print failures.

### 10. Jeff Geerling's 3D Printing Setup
**Repository:** https://github.com/geerlingguy/3d-printing

**Description:** Documentation and tools for 3D printer setup, including BigTreeTech P1S mods like Panda Touch.

---

## Sources:
- https://github.com/topics/p1s
- https://github.com/bambulab/BambuStudio
- https://github.com/opensourcemanufacturing/OpenBL


## Custom Design Concepts for Bambu Lab P1S

Here are a few creative and practical design concepts for the Bambu Lab P1S, complete with specifications that can be used for 3D modeling and printing. These designs are aimed at enhancing the functionality and user experience of the printer.

### 1. Modular Magnetic Tool Holder

**Description:**
A customizable and modular tool holder system that magnetically attaches to the side of the P1S. This allows for easy access to frequently used tools like scrapers, Allen keys, nozzle-clearing pins, and clippers. The modular design allows users to print and add different modules as needed.

**Key Features:**
- **Magnetic Mounting:** Uses strong neodymium magnets for secure attachment without any modifications to the printer.
- **Modular Design:** Users can print and combine different modules for various tools.
- **Easy Access:** Keeps essential tools organized and within reach.
- **Customizable:** The base module can be extended, and new tool holder modules can be designed and added.

**Printing Specifications:**
- **Material:** PETG or ABS for durability and heat resistance.
- **Layer Height:** 0.2 mm for a balance of speed and quality.
- **Infill:** 20% Grid pattern.
- **Supports:** Not required if printed in the recommended orientation.
- **Required Non-Printed Parts:**
    - 10x3mm Neodymium Magnets (quantity depends on the number of modules).
    - Super glue to secure the magnets in the printed slots.

### 2. Ventilated Riser with Integrated LED Lighting

**Description:**
A riser that fits on top of the P1S, increasing the internal height to accommodate taller prints or modifications like a larger top-mounted spool holder. This riser also incorporates ventilation slots for improved air circulation when printing materials like PLA, and it has channels for embedding LED strips to illuminate the build area.

**Key Features:**
- **Increased Height:** Adds 60mm of vertical space inside the enclosure.
- **Improved Ventilation:** Ventilation slots can be opened or closed to regulate chamber temperature.
- **Integrated LED Lighting:** Channels for standard LED strips to provide bright, even lighting of the print bed.
- **Easy Installation:** Designed to sit securely on top of the existing P1S frame.

**Printing Specifications:**
- **Material:** PC (Polycarbonate) or ABS for high-temperature resistance and structural integrity.
- **Layer Height:** 0.2 mm.
- **Infill:** 25% Gyroid pattern for strength.
- **Supports:** May be required for the ventilation slots, depending on the design.
- **Required Non-Printed Parts:**
    - 24V LED strip (e.g., COB LED strip for even lighting).
    - Wiring and a connector to tap into the printer's 24V power supply (requires electrical knowledge).

### 3. Stackable AMS Hub with Desiccant Holder

**Description:**
A stackable hub for the Bambu Lab Automatic Material System (AMS) that includes an integrated desiccant holder. This design helps to keep the filament dry and allows for stacking multiple AMS units securely. The hub also features a filament guide to ensure smooth feeding from the AMS to the printer.

**Key Features:**
- **Stackable Design:** Allows for stable stacking of multiple AMS units.
- **Integrated Desiccant Holder:** A compartment for silica gel beads to keep the filament dry.
- **Filament Guide:** A smooth, low-friction path for the filament to travel from the AMS to the printer.
- **Hygrometer Slot:** A slot to fit a small digital hygrometer to monitor humidity levels inside the hub.

**Printing Specifications:**
- **Material:** PLA or PETG.
- **Layer Height:** 0.2 mm.
- **Infill:** 15% Grid pattern.
- **Supports:** Not required.
- **Required Non-Printed Parts:**
    - Silica gel beads (color-indicating beads are recommended).
    - Small digital hygrometer (optional).

### 4. “Poop Chute” with Magnetic Collection Bin

**Description:**
An improved “poop chute” (excess filament chute) that directs the waste filament into a magnetically attached collection bin. This makes it easier to collect and dispose of the waste filament and keeps the printing area clean.

**Key Features:**
- **Magnetic Collection Bin:** The collection bin attaches to the chute with magnets, making it easy to remove and empty.
- **Improved Chute Design:** A wider and steeper chute to prevent clogs.
- **Clean and Tidy:** Keeps the waste filament contained and the printing area clean.

**Printing Specifications:**
- **Material:** PETG or PLA.
- **Layer Height:** 0.28 mm for faster printing of the bin, 0.2mm for the chute.
- **Infill:** 10% for the bin, 20% for the chute.
- **Supports:** Not required.
- **Required Non-Printed Parts:**
    - 6x3mm Neodymium Magnets.
    - Super glue.
