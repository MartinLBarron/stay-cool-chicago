# Journal

## 2026-05-20

**User:** On the center screen there is a section for "what's available" (amenities). I don't have an outside source for amenities so let's remove that section (for now. Leave the scaffolding, just remove it from the display)

**Assistant:** Added `hidden` attribute to the `.detail-amenities` div in `center.html` (line 93). All scaffolding — the container div, `amenities-content` div, `renderAmenities` function, `AMENITY_SVG` map, `AMENITY_KEYS`, and supporting JS — remains intact for when a data source is available.
