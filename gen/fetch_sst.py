"""Build gen/sst.json: average sea surface temperature for each calendar month at every beach.

Data: NOAA OI SST v2.1 high resolution (0.25 degree) long-term monthly means, 1991-2020,
from NOAA PSL (public domain): https://psl.noaa.gov/data/gridded/data.noaa.oisst.v2.highres.html
For each beach, uses the nearest sea grid cell within about 1 degree.
Run by .github/workflows/sst.yml.
"""
import json, os, re, urllib.request
import numpy as np
from netCDF4 import Dataset

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
URL = 'https://downloads.psl.noaa.gov/Datasets/noaa.oisst.v2.highres/sst.mon.ltm.1991-2020.nc'
NC = os.path.join('/tmp', 'sst.mon.ltm.nc')

if not os.path.exists(NC):
    urllib.request.urlretrieve(URL, NC)
ds = Dataset(NC)
lat = ds.variables['lat'][:]
lon = ds.variables['lon'][:]
sst = ds.variables['sst'][:]  # (12, lat, lon), masked over land
mask = np.ma.getmaskarray(sst[0])

beaches = []
bdir = os.path.join(ROOT, 'beach')
for slug in sorted(os.listdir(bdir)):
    f = os.path.join(bdir, slug, 'index.html')
    if not os.path.exists(f):
        continue
    h = open(f, encoding='utf-8').read()
    m = re.search(r'mlat=(-?[\d.]+)&(?:amp;)?mlon=(-?[\d.]+)', h)
    if m:
        beaches.append((slug, float(m.group(1)), float(m.group(2))))

out, miss = {}, []
for slug, la, lo in beaches:
    lo360 = lo % 360
    i = int(np.argmin(np.abs(lat - la)))
    j = int(np.argmin(np.abs(lon - lo360)))
    best, bd = None, 1e9
    for di in range(-4, 5):
        for dj in range(-4, 5):
            ii, jj = i + di, (j + dj) % len(lon)
            if ii < 0 or ii >= len(lat) or mask[ii, jj]:
                continue
            d = (lat[ii] - la) ** 2 + (((lon[jj] - lo360 + 180) % 360 - 180) * np.cos(np.radians(la))) ** 2
            if d < bd:
                bd, best = d, (ii, jj)
    if best is None:
        miss.append(slug)
        continue
    vals = [round(float(sst[k, best[0], best[1]]), 1) for k in range(12)]
    out[slug] = vals

json.dump(out, open(os.path.join(HERE, 'sst.json'), 'w'), separators=(',', ':'))
print('beaches', len(beaches), 'saved', len(out), 'missing', len(miss), miss[:20])
