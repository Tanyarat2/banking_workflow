#!/usr/bin/env python3
import os
import pandas as pd
import sys
from pathlib import Path

# 1) Grab the base folder from the arg
if len(sys.argv) < 2:
    print("Usage: merge.py <unzipped_base_dir>")
    sys.exit(1)
base_dir = sys.argv[1]

# 2) Use pathlib to recursively find ALL .xls files under any depth
base = Path(base_dir)
files = list(base.rglob("*.xls"))

# 3) If none found, bail early
if not files:
    print("No .xls files found under", base_dir)
    sys.exit(1)

print("Found", len(files), "files:")
for f in files:
    print(" ", f)

# 4) Read each into a DataFrame
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

# 5) Concatenate
df_all = pd.concat(dfs, ignore_index=True)

# 6) filename
first_folder = Path(files[0]).parent.parent.name  
ID, rest   = first_folder.split("_", 1)
prefix, date = rest.split("-", 1)

out_dir = Path("C:\\Users\\CCIB1164_2PC69\\Documents\\BBL_merge")
out_dir.mkdir(parents=True, exist_ok=True)
out_csv = out_dir / f"{ID}_{prefix}_{date}.csv"

# 7) Write CSV with BOM for Excel
df_all.to_csv(out_csv, index=False, encoding="utf-8-sig")
print(f"Merged {len(files)} files -> {out_csv}")
