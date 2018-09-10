Manual Testing
==============

This document describes a high-level script of manual tests to check for. We
should aim to replace items on this list with automated Spectron test cases.

[Windows 10 ISO]: https://www.microsoft.com/en-au/software-download/windows10ISO
[ev3dev]: https://github.com/ev3dev/ev3dev/releases/latest
[FreeDOS]: http://www.freedos.org/download/
[FreeBSD]: https://www.freebsd.org/where.html
[Guix System Distribution (GuixSD)]: https://www.gnu.org/software/guix/
[Pine64]: https://github.com/bamarni/pi64/releases/latest
[recalbox]: https://github.com/recalbox/recalbox-os/releases
[NextCloudPi]: https://ownyourbits.com/nextcloudpi/
[Hass.io]: https://github.com/home-assistant/hassio-build/releases
[BeagleBone]: https://beagleboard.org/latest-images

Image Selection
---------------

- [ ] Cancel image selection dialog
- [ ] Select an unbootable image (without a partition table), and expect a
  sensible warning
- [ ] Attempt to select a ZIP archive with more than one image (i.e. an Android image)
- [ ] Attempt to select a tar archive (with any compression method) ([NextCloudPi])
- [ ] Change image selection
- [ ] Select a Windows image, and expect a sensible warning ([Windows 10 ISO])

Drive Selection
---------------

- [ ] Open the drive selection modal
- [ ] Switch drive selection
- [ ] Insert a single drive, and expect auto-selection
- [ ] Insert more than one drive, and don't expect auto-selection
- [ ] Insert a locked SD Card and expect a warning
- [ ] Insert a too small drive and expect a warning
- [ ] Put an image into a drive and attempt to flash the image to the drive
  that contains it
- [ ] Attempt to flash a compressed image – for which Etcher can determine the
  uncompressed size (i.e. .zip, .dmg, .xz) – to a drive that is big enough to hold the compressed
  image, but not big enough to hold the uncompressed version
- [ ] Enable "Unsafe Mode" and attempt to select a system drive
- [ ] Enable "Unsafe Mode", and if there is only one system drive (and no
  removable ones), don't expect autoselection

Image Support
-------------

Run the following tests with and without validation enabled:

- [ ] Flash an uncompressed image
- [ ] Flash a Bzip2 image ([Hass.io])
- [ ] Flash a XZ image ([FreeBSD], [recalbox], [Guix System Distribution (GuixSD)])
- [ ] Flash a ZIP image ([Pine64], [FreeDOS])
- [ ] Flash a GZ image
- [ ] Flash a DMG image
- [ ] Flash an image whose size is not a multiple of 512 bytes
- [ ] Flash a compressed image whose size is not a multiple of 512 bytes
- [ ] Flash an archive whose image size is not a multiple of 512 bytes
- [ ] Flash an archive image containing a logo ([ev3dev])
- [ ] Flash an archive image containing a blockmap file ([ev3dev])
- [ ] Flash an archive image containing a manifest metadata file ([ev3dev])

Flashing Process
----------------

- [ ] Unplug the drive during flash or validation
- [ ] Click "Flash", cancel elevation dialog, and click "Flash" again
- [ ] Start flashing an image, try to close Etcher, cancel the application
  close warning dialog, and check that Etcher continues to flash the image

### Child Writer

- [ ] Kill the child writer process (i.e. with `SIGINT` or `SIGKILL`), and
  check that the UI reacts appropriately
- [ ] Close the application while flashing using the window manager close icon
- [ ] Close the application while flashing using the OS keyboard shortcut
- [ ] Close the application from the terminal using Ctrl-C while flashing
- [ ] Force kill the application (using a process monitor tool, etc)

In all these cases, the child writer process should not remain alive. Note that
in some systems you need to open your process monitor tool of choice with extra
permissions to see the elevated child writer process.

GUI
----

- [ ] Close application from the terminal using Ctrl-C while the application is
  idle
- [ ] Click footer links that take you to an external website
- [ ] Attempt to change image or drive selection while flashing
- [ ] Go to the settings page while flashing and come back
- [ ] Flash consecutive images without closing the application
- [ ] Remove the selected drive right before clicking "Flash"
- [ ] Minimize the application
- [ ] Start the application given no internet connection

Success Banner
--------------

- [ ] Click an external link on the success banner (with and without internet
  connection)

Elevation Prompt
----------------

- [ ] Flash an image as `root`/administrator
- [ ] Reject elevation prompt
- [ ] Put incorrect elevation prompt password
- [ ] Unplug the drive during elevation

Unmounting
----------

- [ ] Disable unmounting and flash an image
- [ ] Flash an image with a file system that is readable by the host OS, and
  check that is unmounted correctly

Analytics
---------

- [ ] Disable analytics, open DevTools Network pane or a packet sniffer, and
  check that no request is sent
- [ ] **Disable analytics, refresh application from DevTools (using Cmd-R or
  F5), and check that initial events are not sent to Mixpanel**
