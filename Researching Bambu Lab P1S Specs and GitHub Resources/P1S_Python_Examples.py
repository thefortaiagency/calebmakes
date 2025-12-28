"""
Bambu Lab P1S Python API Examples
==================================

This file contains practical examples for interacting with the Bambu Lab P1S
3D printer using the bambulabs_api Python library.

Installation:
    pip install bambulabs_api

Requirements:
    - Python 3.10 or higher
    - bambulabs_api library
    - Network access to the printer
    - Printer IP address, serial number, and access code

Author: Manus AI
Date: December 28, 2025
"""

import time
import json
from typing import Dict, Any

# Import the Bambu Lab API
try:
    import bambulabs_api as bl
except ImportError:
    print("Error: bambulabs_api not installed. Run: pip install bambulabs_api")
    exit(1)


# ============================================================================
# Configuration
# ============================================================================

# Replace these with your printer's actual values
PRINTER_IP = '192.168.1.200'
PRINTER_SERIAL = 'AC12309BH109'
ACCESS_CODE = '12347890'  # Found in BambuStudio.conf


# ============================================================================
# Example 1: Basic Connection and Status Check
# ============================================================================

def example_basic_connection():
    """
    Demonstrates basic connection to the P1S and retrieving printer status.
    """
    print("=" * 60)
    print("Example 1: Basic Connection and Status Check")
    print("=" * 60)
    
    # Create printer instance
    printer = bl.Printer(PRINTER_IP, ACCESS_CODE, PRINTER_SERIAL)
    
    try:
        # Connect to the printer
        print(f"Connecting to P1S at {PRINTER_IP}...")
        printer.connect()
        time.sleep(2)  # Wait for connection to stabilize
        
        # Get printer status
        status = printer.get_state()
        print(f"Printer Status: {status}")
        
        # Get more detailed information
        print("\nDetailed Printer Information:")
        print(f"  Model: Bambu Lab P1S")
        print(f"  Serial: {PRINTER_SERIAL}")
        print(f"  IP Address: {PRINTER_IP}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Always disconnect when done
        printer.disconnect()
        print("\nDisconnected from printer.")


# ============================================================================
# Example 2: Control Chamber Light
# ============================================================================

def example_control_light():
    """
    Demonstrates controlling the P1S chamber light.
    """
    print("\n" + "=" * 60)
    print("Example 2: Control Chamber Light")
    print("=" * 60)
    
    printer = bl.Printer(PRINTER_IP, ACCESS_CODE, PRINTER_SERIAL)
    
    try:
        printer.connect()
        time.sleep(2)
        
        # Turn light on
        print("Turning chamber light ON...")
        printer.turn_light_on()
        time.sleep(3)
        
        # Turn light off
        print("Turning chamber light OFF...")
        printer.turn_light_off()
        time.sleep(3)
        
        # Turn light back on
        print("Turning chamber light ON again...")
        printer.turn_light_on()
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        printer.disconnect()


# ============================================================================
# Example 3: Monitor Print Progress
# ============================================================================

def example_monitor_print(duration_seconds: int = 60):
    """
    Monitors print progress for a specified duration.
    
    Args:
        duration_seconds: How long to monitor (default 60 seconds)
    """
    print("\n" + "=" * 60)
    print("Example 3: Monitor Print Progress")
    print("=" * 60)
    
    printer = bl.Printer(PRINTER_IP, ACCESS_CODE, PRINTER_SERIAL)
    
    try:
        printer.connect()
        time.sleep(2)
        
        print(f"Monitoring print for {duration_seconds} seconds...")
        print("(This example assumes a print is in progress)")
        
        start_time = time.time()
        while time.time() - start_time < duration_seconds:
            status = printer.get_state()
            
            # Display status information
            print(f"\nTime: {int(time.time() - start_time)}s")
            print(f"Status: {status}")
            
            # Wait before next check
            time.sleep(5)
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        printer.disconnect()


# ============================================================================
# Example 4: Temperature Monitoring
# ============================================================================

def example_temperature_monitoring():
    """
    Demonstrates monitoring hotend and bed temperatures.
    """
    print("\n" + "=" * 60)
    print("Example 4: Temperature Monitoring")
    print("=" * 60)
    
    printer = bl.Printer(PRINTER_IP, ACCESS_CODE, PRINTER_SERIAL)
    
    try:
        printer.connect()
        time.sleep(2)
        
        print("Reading temperatures...")
        
        # Note: Actual temperature reading methods may vary
        # This is a conceptual example
        status = printer.get_state()
        
        print(f"Printer State: {status}")
        print("\nTemperature Information:")
        print(f"  Hotend Max Temp: 300°C")
        print(f"  Bed Max Temp: 100°C")
        print(f"  Recommended PLA: Hotend 210-220°C, Bed 60°C")
        print(f"  Recommended ABS: Hotend 240-250°C, Bed 90°C")
        print(f"  Recommended PETG: Hotend 230-240°C, Bed 70°C")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        printer.disconnect()


# ============================================================================
# Example 5: Printer Specifications Access
# ============================================================================

def example_printer_specs():
    """
    Demonstrates accessing and displaying printer specifications.
    This example loads specs from the JSON file created in the research.
    """
    print("\n" + "=" * 60)
    print("Example 5: Printer Specifications")
    print("=" * 60)
    
    # Define specifications directly (or load from JSON file)
    specs = {
        "build_volume": {
            "width_mm": 256,
            "depth_mm": 256,
            "height_mm": 256
        },
        "motion_system": {
            "max_speed_mm_per_s": 500,
            "max_acceleration_mm_per_s2": 20000
        },
        "toolhead": {
            "max_hotend_temperature_c": 300,
            "nozzle_diameter_mm": 0.4
        },
        "heated_bed": {
            "max_temperature_c": 100
        }
    }
    
    print("\nBambu Lab P1S Specifications:")
    print(f"\nBuild Volume:")
    print(f"  {specs['build_volume']['width_mm']} × "
          f"{specs['build_volume']['depth_mm']} × "
          f"{specs['build_volume']['height_mm']} mm³")
    
    print(f"\nMotion System:")
    print(f"  Max Speed: {specs['motion_system']['max_speed_mm_per_s']} mm/s")
    print(f"  Max Acceleration: {specs['motion_system']['max_acceleration_mm_per_s2']} mm/s²")
    
    print(f"\nToolhead:")
    print(f"  Max Hotend Temp: {specs['toolhead']['max_hotend_temperature_c']}°C")
    print(f"  Nozzle Diameter: {specs['toolhead']['nozzle_diameter_mm']} mm")
    
    print(f"\nHeated Bed:")
    print(f"  Max Bed Temp: {specs['heated_bed']['max_temperature_c']}°C")


# ============================================================================
# Example 6: Calculate Print Volume
# ============================================================================

def calculate_print_volume(width_mm: float, depth_mm: float, height_mm: float) -> Dict[str, Any]:
    """
    Calculates if a model fits within the P1S build volume and provides statistics.
    
    Args:
        width_mm: Model width in millimeters
        depth_mm: Model depth in millimeters
        height_mm: Model height in millimeters
    
    Returns:
        Dictionary with fit status and statistics
    """
    # P1S build volume
    BUILD_VOLUME_WIDTH = 256
    BUILD_VOLUME_DEPTH = 256
    BUILD_VOLUME_HEIGHT = 256
    
    # Check if model fits
    fits = (width_mm <= BUILD_VOLUME_WIDTH and 
            depth_mm <= BUILD_VOLUME_DEPTH and 
            height_mm <= BUILD_VOLUME_HEIGHT)
    
    # Calculate volume utilization
    model_volume = width_mm * depth_mm * height_mm
    build_volume = BUILD_VOLUME_WIDTH * BUILD_VOLUME_DEPTH * BUILD_VOLUME_HEIGHT
    utilization_percent = (model_volume / build_volume) * 100
    
    return {
        "fits": fits,
        "model_dimensions_mm": {
            "width": width_mm,
            "depth": depth_mm,
            "height": height_mm
        },
        "model_volume_mm3": model_volume,
        "build_volume_mm3": build_volume,
        "utilization_percent": utilization_percent,
        "clearance_mm": {
            "width": BUILD_VOLUME_WIDTH - width_mm,
            "depth": BUILD_VOLUME_DEPTH - depth_mm,
            "height": BUILD_VOLUME_HEIGHT - height_mm
        }
    }


def example_volume_calculation():
    """
    Demonstrates print volume calculation for various model sizes.
    """
    print("\n" + "=" * 60)
    print("Example 6: Print Volume Calculation")
    print("=" * 60)
    
    # Test various model sizes
    test_models = [
        {"name": "Small Part", "width": 50, "depth": 50, "height": 30},
        {"name": "Medium Part", "width": 150, "depth": 150, "height": 100},
        {"name": "Large Part", "width": 240, "depth": 240, "height": 240},
        {"name": "Too Large", "width": 300, "depth": 300, "height": 300}
    ]
    
    for model in test_models:
        result = calculate_print_volume(model["width"], model["depth"], model["height"])
        
        print(f"\n{model['name']}:")
        print(f"  Dimensions: {model['width']} × {model['depth']} × {model['height']} mm³")
        print(f"  Fits in P1S: {'✓ YES' if result['fits'] else '✗ NO'}")
        print(f"  Volume Utilization: {result['utilization_percent']:.1f}%")
        
        if result['fits']:
            print(f"  Clearance: {result['clearance_mm']['width']} × "
                  f"{result['clearance_mm']['depth']} × "
                  f"{result['clearance_mm']['height']} mm")


# ============================================================================
# Example 7: Material Temperature Recommendations
# ============================================================================

def get_material_settings(material: str) -> Dict[str, Any]:
    """
    Returns recommended temperature settings for common materials.
    
    Args:
        material: Material name (e.g., 'PLA', 'ABS', 'PETG')
    
    Returns:
        Dictionary with temperature and speed recommendations
    """
    materials = {
        "PLA": {
            "hotend_temp_c": {"min": 190, "max": 220, "recommended": 210},
            "bed_temp_c": {"min": 50, "max": 70, "recommended": 60},
            "print_speed_mm_s": {"min": 40, "max": 200, "recommended": 100},
            "enclosure_required": False,
            "notes": "Easy to print, good for beginners"
        },
        "PETG": {
            "hotend_temp_c": {"min": 220, "max": 250, "recommended": 235},
            "bed_temp_c": {"min": 70, "max": 90, "recommended": 80},
            "print_speed_mm_s": {"min": 30, "max": 150, "recommended": 80},
            "enclosure_required": False,
            "notes": "Strong and durable, slight stringing"
        },
        "ABS": {
            "hotend_temp_c": {"min": 230, "max": 260, "recommended": 245},
            "bed_temp_c": {"min": 80, "max": 100, "recommended": 90},
            "print_speed_mm_s": {"min": 40, "max": 180, "recommended": 100},
            "enclosure_required": True,
            "notes": "Requires enclosed chamber, strong parts"
        },
        "ASA": {
            "hotend_temp_c": {"min": 240, "max": 270, "recommended": 255},
            "bed_temp_c": {"min": 90, "max": 100, "recommended": 95},
            "print_speed_mm_s": {"min": 40, "max": 180, "recommended": 100},
            "enclosure_required": True,
            "notes": "UV resistant, similar to ABS"
        },
        "TPU": {
            "hotend_temp_c": {"min": 210, "max": 240, "recommended": 225},
            "bed_temp_c": {"min": 40, "max": 60, "recommended": 50},
            "print_speed_mm_s": {"min": 20, "max": 60, "recommended": 30},
            "enclosure_required": False,
            "notes": "Flexible, print slowly with direct drive"
        }
    }
    
    return materials.get(material.upper(), None)


def example_material_settings():
    """
    Demonstrates material temperature recommendations.
    """
    print("\n" + "=" * 60)
    print("Example 7: Material Temperature Recommendations")
    print("=" * 60)
    
    materials = ["PLA", "PETG", "ABS", "ASA", "TPU"]
    
    for material in materials:
        settings = get_material_settings(material)
        
        if settings:
            print(f"\n{material}:")
            print(f"  Hotend: {settings['hotend_temp_c']['recommended']}°C "
                  f"(range: {settings['hotend_temp_c']['min']}-{settings['hotend_temp_c']['max']}°C)")
            print(f"  Bed: {settings['bed_temp_c']['recommended']}°C "
                  f"(range: {settings['bed_temp_c']['min']}-{settings['bed_temp_c']['max']}°C)")
            print(f"  Speed: {settings['print_speed_mm_s']['recommended']} mm/s "
                  f"(range: {settings['print_speed_mm_s']['min']}-{settings['print_speed_mm_s']['max']} mm/s)")
            print(f"  Enclosure: {'Required' if settings['enclosure_required'] else 'Optional'}")
            print(f"  Notes: {settings['notes']}")


# ============================================================================
# Example 8: FTP File Upload (Conceptual)
# ============================================================================

def example_ftp_upload():
    """
    Demonstrates FTP file upload to the P1S.
    Note: This is a conceptual example. Actual implementation requires ftplib.
    """
    print("\n" + "=" * 60)
    print("Example 8: FTP File Upload (Conceptual)")
    print("=" * 60)
    
    print("\nFTP Connection Details:")
    print(f"  Host: {PRINTER_IP}")
    print(f"  Port: 990 (FTPS)")
    print(f"  Username: bblp")
    print(f"  Password: Found in BambuStudio.conf under 'access_code'")
    
    print("\nConceptual Python Code:")
    print("""
    from ftplib import FTP_TLS
    
    # Connect to printer via FTPS
    ftp = FTP_TLS()
    ftp.connect(PRINTER_IP, 990)
    ftp.login('bblp', ACCESS_CODE)
    
    # Upload G-code file
    with open('model.gcode', 'rb') as file:
        ftp.storbinary('STOR model.gcode', file)
    
    ftp.quit()
    """)
    
    print("\nNote: FTP access allows programmatic file upload for automation.")


# ============================================================================
# Main Execution
# ============================================================================

def main():
    """
    Main function to run all examples.
    """
    print("\n" + "=" * 60)
    print("Bambu Lab P1S Python API Examples")
    print("=" * 60)
    print("\nNote: Some examples require an active connection to a P1S printer.")
    print("Update PRINTER_IP, PRINTER_SERIAL, and ACCESS_CODE at the top of this file.")
    
    # Run examples that don't require printer connection
    example_printer_specs()
    example_volume_calculation()
    example_material_settings()
    example_ftp_upload()
    
    # Uncomment to run examples that require printer connection
    # example_basic_connection()
    # example_control_light()
    # example_monitor_print(duration_seconds=30)
    # example_temperature_monitoring()
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
