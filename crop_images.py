import cv2
import numpy as np

# Load the image
img_path = '/Users/moutamanalyasiri/.gemini/antigravity/brain/9fc0f288-73c1-4a4c-a7a2-c8b3959ece70/highlights_area_1765282297479.png'
img = cv2.imread(img_path)

if img is None:
    print("Error: Image not found.")
    exit()

# 1. Crop Profile Picture (Approximate coordinates based on standard Insta layout)
# Usually top left, large circle.
# Let's guess: x=50, y=50, w=150, h=150 (This is a wild guess, need to be careful)
# Better: Detect circles.

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.medianBlur(gray, 5)

# Hough Circle Transform
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20,
                           param1=50, param2=30, minRadius=30, maxRadius=100)

if circles is not None:
    circles = np.uint16(np.around(circles))
    # Sort by radius (largest first) -> Profile pic is usually largest or first
    # But highlights are also circles. Profile pic is usually leftmost.
    sorted_circles = sorted(circles[0, :], key=lambda x: x[0]) # Sort by x coordinate
    
    # Profile pic should be the first one (leftmost)
    profile_circle = sorted_circles[0]
    x, y, r = profile_circle
    
    # Crop Profile Pic
    # Add some padding
    x1 = max(0, x - r)
    y1 = max(0, y - r)
    x2 = min(img.shape[1], x + r)
    y2 = min(img.shape[0], y + r)
    
    profile_pic = img[y1:y2, x1:x2]
    cv2.imwrite('/Users/moutamanalyasiri/Desktop/ЛАЗЕРКАААА/master_real.png', profile_pic)
    print(f"Saved profile pic: {x},{y}, r={r}")
    
    # Highlights (next circles)
    # Let's try to find the one labeled "Роботи" (Works).
    # It's hard to read text with CV here without OCR.
    # We'll just take the 2nd and 3rd circles as portfolio items.
    
    if len(sorted_circles) > 1:
        c2 = sorted_circles[1]
        x, y, r = c2
        h1 = img[y-r:y+r, x-r:x+r]
        cv2.imwrite('/Users/moutamanalyasiri/Desktop/ЛАЗЕРКАААА/portfolio_1.png', h1)
        print("Saved portfolio_1")
        
    if len(sorted_circles) > 2:
        c3 = sorted_circles[2]
        x, y, r = c3
        h2 = img[y-r:y+r, x-r:x+r]
        cv2.imwrite('/Users/moutamanalyasiri/Desktop/ЛАЗЕРКАААА/portfolio_2.png', h2)
        print("Saved portfolio_2")

else:
    print("No circles found. Saving whole image as fallback.")
    cv2.imwrite('/Users/moutamanalyasiri/Desktop/ЛАЗЕРКАААА/fallback_insta.png', img)
