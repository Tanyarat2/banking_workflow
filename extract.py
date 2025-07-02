#!/usr/bin/env python3
import zipfile
import sys
import os
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--file',     required=True, help='Path to the password-protected zip file')
parser.add_argument('--password', required=True, help='Password for the zip archive')
parser.add_argument('--dest',     default='unzipped', help='output folder')
args = parser.parse_args()

# ensure output exists
os.makedirs(args.dest, exist_ok=True)

with zipfile.ZipFile(args.file) as zf:
    zf.extractall(path=args.dest, pwd=args.password.encode())

print(" Extraction successful")
