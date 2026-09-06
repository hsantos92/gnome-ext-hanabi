# Clapper investigation — 2026-09-05

Test system: Arch Linux, RTX 4090, NVIDIA 610.57.04, GStreamer 1.28.6,
GTK 4.22.4. Video: H.264, 2560×1440, 24 fps.

The installed `libclapper-gtk 0.10.0-2` owns the native `clappersink` plugin.
Its GL uploader aborts in `_gst_gl_color_convert_set_caps_unlocked`, after
`gst_caps_get_structure` and `gst_video_info_from_caps` report invalid caps.
The stack includes `libgstclappergluploader.so`.

Clapper upstream commit `45b0852` (reports version 0.11.0) was built with the
GStreamer plugin, GL importer, GL uploader, and raw importer enabled. It was
installed only under `/tmp`, selected with per-process plugin/importer paths,
and tested in a separate Hanabi renderer with a unique application ID and no
access to Hanabi settings. It reproduced the same abort with both the default
GTK renderer and `GSK_RENDERER=gl`. System packages were not replaced.

This matches the failure signature in [Clapper issue #560](https://github.com/Rafostar/clapper/issues/560).
The [Hanabi README](https://github.com/jeffshee/gnome-ext-hanabi) also warns about
native Clapper compatibility with GStreamer 1.26+. A current source build alone
is therefore not a demonstrated fix on this system. Keep `prefer-clappersink`
disabled and use the working `glsinkbin + gtk4paintablesink` backend.

This investigation identifies the failing component and reproduces the problem;
it does not establish the underlying cause of the invalid format negotiation.
