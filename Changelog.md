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

Version 0.4.3
- Added simple toast (tt.showToast(msg))
- Improved event adding (allow either comma separated lists or arrays of selectors).
- Change transition default back to slideleft.
- Added a TRANSITIONS object to tt which means you don't have to use strings to specify transitions.

Versino 0.4.4
- Added menu close event.
- Tried to fix scrolling and select on automatic scrolled div's.
- Don't close dialog if false is returned in dialog button event.
- Allow changing, adding, removing of menu items.

Version 0.4.5
- Called pageadd with the page.
- Allowed for adding an id to a dialog.
- Updated all vendor libraries (jquery from 2.1.0 to 2.1.1, hammer from 1.0.10 to 2.0.3,
  fastclick from 1.0.1 to 1.0.3, Zepto from 1.1.3 to 1.1.4.

Version 0.4.6
- Add toggle button.
- Add Progress Dialog.

Version 0.4.7
- Allow instantiation of TopCoatTouch before document.ready.
- Improve menu handling (allow ordering of menu items, allow new page option that will go to a page)

Version 0.4.8
- Improve menu handling (don't highlight the first menu item when opening the menu).
- Allow passing of locals to the default template engine.

Version 0.4.9
- Allow checking whether a page has loaded.
- Fix bounce option for iScroll
- Wait until the document loads before initializing container (important
  when no container is passed into contstructor).

Version 0.5.0
- Improve handling of dialogs and loading modals (allow for Cancel, and varied button counts).
- Added a progress modal, (call showProgress and updateProgess).
