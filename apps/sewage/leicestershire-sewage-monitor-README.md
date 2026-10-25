# Leicestershire Storm Overflow &amp; Sewage Monitor

A reusable lab tool showing **live raw-sewage storm overflow activity** in
and around Leicester &amp; Leicestershire, from the two water companies that
actually cover the county — Severn Trent Water (most of it) and Anglian
Water (the eastern Welland catchment, e.g. around Market Harborough). No API
key, open `index.html` in a browser.

## Where the data comes from

Every storm overflow (combined sewer overflow) in England has an Event
Duration Monitor (EDM) that must, by law (Environment Act 2021, s.81),
report activations within an hour. Water UK aggregates these into the
**National Storm Overflow Hub**. This tool queries the two relevant
companies' feeds directly:

- Severn Trent Water:
  `services1.arcgis.com/NO7lTIlnxRMMG9Gw/.../Severn_Trent_Water_Storm_Overflow_Activity/FeatureServer`
- Anglian Water:
  `services3.arcgis.com/VCOY1atHWVcDlvlJ/.../stream_service_outfall_locations_view/FeatureServer`

Both endpoints were identified from **[POOPy](https://github.com/AlexLipp/POOPy)**,
the open-source Python package that powers `sewagemap.co.uk` — credit to
Alex Lipp, Jonny Dawe and Sudhir Balaji for documenting them. Data is
licensed CC-BY via the Stream Data Hub.

**What EDM does and doesn't tell you** (worth repeating to students, water
companies say this themselves): a monitor activating means the overflow
*operated* — it doesn't confirm how much sewage was released, what it
mixed with, or what it did to water quality downstream. Monitors can also
mis-trigger (debris, wipes, movement). Treat "discharging" as "the device
indicated an overflow," not a lab-confirmed pollution event.

## About the "last 6 months" request — an honesty note

**The live API does not expose a 6-month (or any) queryable history.** Both
companies' near-real-time feeds only return:
- current status (discharging / not discharging / offline)
- the last event's start/end time

That's it — no day-by-day or event-by-event archive going back further.
This is true of the underlying Water UK Hub generally, not a limitation of
this tool. So rather than fake a 6-month chart, this tool does three honest
things instead:

1. **Shows the last known event per monitor** — e.g. "last spill ended 6
   days ago" — which is real historical signal, just not a full timeline.
2. **Builds its own local log going forward.** Every time you open the tool
   (or click "Log snapshot now"), it records the current discharge count to
   this browser's local storage and charts it. Leave a tab open during a
   wet week, or check in every few days over a term, and you'll have a
   genuine local history — it just can't be backdated to before you started
   using it. The log is per-browser/per-device (not shared, not uploaded
   anywhere), exportable as CSV, and clearable.
3. **Links to sources that do have real historical depth**: the EA's
   annual Storm Overflow Annual Return (official regulatory spill counts
   and total hours per overflow, per calendar year), Top of the Poops'
   company-level analysis built from that same annual data, and the Rivers
   Trust's Sewage Map for a national live+recent view.

If a genuinely granular multi-month archive matters for a specific lab
session, the EA Annual Return is the real source to work from — it's just
annual-resolution, not daily.

## Extending it

`COMPANIES` near the top of the script is the whole company list — add
another water company's FeatureServer URL (check `POOPy`'s
`poopy/companies/` folder for the ones it supports: Thames, United
Utilities, Wessex, Yorkshire, Southern, South West, Welsh, Northumbrian,
Scottish) and it'll appear automatically, useful if you extend this to
other counties.

## Attribution

- Live EDM data: Severn Trent Water &amp; Anglian Water, via Water UK's
  National Storm Overflow Hub, CC-BY
- Endpoint discovery: [POOPy](https://github.com/AlexLipp/POOPy) (Alex Lipp,
  Jonny Dawe, Sudhir Balaji), GPL-3.0
- Basemap: © CARTO, © OpenStreetMap contributors
