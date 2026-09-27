import os
from PIL import Image, ImageFilter, ImageChops, ImageEnhance

def transform_image():
    src_path = r"c:\Users\ADMIN\Desktop\Portfolio 2\assets\profile.png"
    dest_path = r"c:\Users\ADMIN\Desktop\Portfolio 2\assets\profile-hero.png"
    
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return
        
    print("Loading image...")
    img = Image.open(src_path).convert("RGBA")
    width, height = img.size
    
    # Separate channels
    r, g, b, a = img.split()
    
    # 1. Grayscale Conversion (using ITU-R 601-2 luma coefficients)
    print("Converting to grayscale base...")
    l = img.convert("L")
    
    # Adjust contrast and brightness to ensure deep shadows and clean highlights
    enhancer = ImageEnhance.Contrast(l)
    l_contrast = enhancer.enhance(1.22) # Increase contrast by 22%
    
    enhancer_bright = ImageEnhance.Brightness(l_contrast)
    l_final = enhancer_bright.enhance(1.02) # Slightly raise highlights
    
    # 2. Apply Warm Duotone Tint
    # Shadows (L=0) -> #121212 (18, 18, 18)
    # Midtones (L=128) -> (128, 128, 128)
    # Highlights (L=255) -> (255, 232, 212) - a very faint warm orange tint
    print("Applying warm duotone tint...")
    
    # Generate duotone lookup table
    lut_r = []
    lut_g = []
    lut_b = []
    for v in range(256):
        if v < 128:
            t = v / 128.0
            lut_r.append(int(18 + 110 * t))
            lut_g.append(int(18 + 110 * t))
            lut_b.append(int(18 + 110 * t))
        else:
            t = (v - 128) / 127.0
            lut_r.append(int(128 + 127 * t))
            lut_g.append(int(128 + 104 * t)) # G goes to 232
            lut_b.append(int(128 + 84 * t))  # B goes to 212
            
    r_tinted = l_final.point(lut_r)
    g_tinted = l_final.point(lut_g)
    b_tinted = l_final.point(lut_b)
    
    img_tinted = Image.merge("RGB", (r_tinted, g_tinted, b_tinted))
    
    # 3. Add Soft Orange (#FF7A1A) Rim Light
    # Shift alpha mask to the right to isolate the left/top edge
    print("Generating rim light mask...")
    dx = 14
    dy = 2
    
    # Offset shifts the image and wraps it (which is fine since margins are empty)
    a_shifted = ImageChops.offset(a, dx, dy)
    
    # Edge mask = A - A_shifted (finds the left edge where original is opaque but shifted is transparent)
    edge_mask = ImageChops.subtract(a, a_shifted)
    
    # Apply a Gaussian blur to create a soft, natural glow
    glow_mask = edge_mask.filter(ImageFilter.GaussianBlur(radius=18))
    
    # Multiply by original alpha to keep the glow restricted to the silhouette interior
    final_glow_mask = ImageChops.multiply(glow_mask, a)
    
    # Scale mask intensity to control the strength of the rim light (0.75 strength)
    scaled_glow_mask = final_glow_mask.point(lambda x: int(x * 0.75))
    
    # Create solid orange color base (#FF7A1A -> 255, 122, 26)
    orange_solid = Image.new("RGB", (width, height), (255, 122, 26))
    
    # Composite the orange rim light onto the tinted grayscale portrait
    final_rgb = Image.composite(orange_solid, img_tinted, scaled_glow_mask)
    
    # 4. Re-apply the original alpha channel to preserve background transparency exactly
    print("Re-applying transparency mask...")
    final_rgba = Image.merge("RGBA", (final_rgb.split()[0], final_rgb.split()[1], final_rgb.split()[2], a))
    
    print(f"Saving final output to {dest_path}...")
    final_rgba.save(dest_path, "PNG")
    print("Image transformation completed successfully!")

if __name__ == "__main__":
    transform_image()
