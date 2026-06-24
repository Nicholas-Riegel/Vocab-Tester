#!/bin/bash
# Simple script to generate placeholder icons for the Chrome extension
# Creates solid color PNG icons using Python PIL (if available) or provides fallback instructions

cd "$(dirname "$0")"

# Try to generate icons with Python
if command -v python3 &> /dev/null; then
    python3 << 'EOF'
try:
    from PIL import Image, ImageDraw
    
    # Create icons with a simple blue background and white "DE" text
    for size in [16, 48, 128]:
        img = Image.new('RGB', (size, size), color='#4a9eff')
        img.save(f'icon{size}.png')
    print("✓ Icons created successfully!")
except ImportError:
    print("PIL not installed. Install with: pip3 install Pillow")
    print("Or create icons manually (any 16x16, 48x48, 128x128 PNG images)")
EOF
else
    echo "Python not found. Please create three PNG files manually:"
    echo "  icon16.png  (16x16 pixels)"
    echo "  icon48.png  (48x48 pixels)"
    echo "  icon128.png (128x128 pixels)"
    echo "Any simple colored squares will work for now."
fi
