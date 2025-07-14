import os
import pandas as pd
import sys
from pathlib import Path

# Grab the base folder
if len(sys.argv) < 2:
    print("Usage: merge.py <unzipped_base_dir>")
    sys.exit(1)
base_dir = sys.argv[1]

# find ALL .xls files
base = Path(base_dir)
files = list(base.rglob("*.xls"))

if not files:
    print("No .xls files found under", base_dir)
    sys.exit(1)

print("Found", len(files), "files:")
for f in files:
    print(" ", f)

# Read into a DataFrame
dfs = []
for f in files:
    df = pd.read_excel(
        f,
        sheet_name=0,
        dtype=str,
        engine="xlrd",           # for .xls files
        keep_default_na=False,
        na_filter=False,
    )
    dfs.append(df)

# Concat
df_all = pd.concat(dfs, ignore_index=True)

# filename
#--------file path check-------------
first_folder = Path(files[0]).parent.parent.name  
ID, rest   = first_folder.split("_", 1)
prefix, date = rest.split("-", 1)

out_dir = Path("C:\\Users\\CCIB1164_2PC69\\Documents\\BBL_merge")
out_dir.mkdir(parents=True, exist_ok=True)
out_csv = out_dir / f"{ID}_{prefix}_{date}.csv"

# Write CSV
df_all.to_csv(out_csv, index=False, encoding="utf-8-sig")
print(f"Merged {len(files)} files -> {out_csv}")
