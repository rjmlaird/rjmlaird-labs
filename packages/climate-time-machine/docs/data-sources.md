# Data sources

## Observations: Met Office UK regional series
- Files: `https://www.metoffice.gov.uk/pub/data/weather/uk/climate/datasets/{Tmean|Rainfall}/date/{Region}.txt`
- Browse and download manually: https://www.metoffice.gov.uk/research/climate/maps-and-data/uk-and-regional-series
- Derived from HadUK-Grid: station data interpolated to a 1 km grid, then averaged over regions.
- Series: `Tmean`, `Tmax`, `Tmin`, `Rainfall`, `AirFrost`. The last three are optional; if one fails to download, that variable is left out.
- Columns used: monthly values (for April–September rainfall), summer (JJA) mean temperature, annual mean temperature, annual rainfall.
- Licence: Open Government Licence v3.0. Credit the Met Office.
- Region file names are set in `scripts/fetch-data.mjs`. If the Met Office renames one, the script skips that region and warns.

## Projections: Open-Meteo Climate API
- Endpoint: `https://climate-api.open-meteo.com/v1/climate`
- Models: MRI_AGCM3_2_S, EC_Earth3P_HR, NICAM16_8S, CMCC_CM2_VHR4, FGOALS_f3_H, HiRAM_SIT_HR, MPI_ESM1_2_XR (CMIP6 HighResMIP).
- Variables: daily mean, maximum and minimum temperature and precipitation, 1991 to 2050.
- Licence: CC BY 4.0, free for non-commercial use. Commercial use needs their API plan.

## For multi-scenario work
UKCP18 projections (RCP2.6, 4.5, 8.5 and the 12 km local set) are the standard UK source. They are on the CEDA archive and need a free account, so the fetch script does not use them yet.
