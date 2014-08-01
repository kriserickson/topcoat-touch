Version 0.1.0
- Initial version

Version 0.2.0
- Added optional minimalistic MVC framework support (no model or binding yet).

Version 0.2.1
- Add barebones menu support.

Version 0.2.2
- Removed previous event as a global event, made it a topcoat touch event.
- Unified click handling.
- Improved menu.

Version 0.2.3
- Added real dialog support with tt.goTo().
- Added different transitions (slidedown, slideup, pop).
- Improved menu (and added menu demo).

Version 0.2.4
- Added the ability to reload a page.

Version 0.2.5
- Added a flip transition, improved support for the dark theme.

Version 0.2.6
- Added the ability to trigger events on multiple pages.

Version 0.2.7
- Minor bugfixes.

Version 0.2.8
- Minor bugfixes.

Version 0.2.9
- Fix iScroll regression on mobile devices (broken in 0.2.8), improve 
  modal dialogs so that pages before do not need to be reloaded.

Version 0.3.0
- Improve menu handling, allow for callbacks when going back.

Version 0.3.1
- Fix some issues with menus, going back, and navigation bars.

Version 0.3.3
- Don't go to a page if you have already been there.

Version 0.3.4
- Small bugfixes...

Version 0.3.5
- Let iScroll emit tap event when the scroll area is clicked/tapped but not scrolled.
- Fix loading not properly showing overlay.
- Updated components.

Version 0.4.0
- Add side-drawer
- Fix hammer.js events where multiple events where passed in the same string.

Version 0.4.1
- Fixes to get the new FastClick working with modern Android browsers.

Version 0.4.2
- Fix to examples, using href="#" created another entry on the popstack which caused
  back to need to be pressed twice if the menu or side-drawer was ever shown.
- Fix for Pop creating a blurry page in Android 4.4 WebView (Chrome 30).
- Tap and click adjustments when using tt.clickEvent
