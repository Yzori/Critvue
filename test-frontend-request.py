#!/usr/bin/env python3
"""
Test script to simulate frontend registration request
"""
import requests
import json

# Simulate exactly what axios sends
url = "http://localhost:8000/api/v1/auth/register"
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "http://localhost:3000",
    "Referer": "http://localhost:3000/register",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
}

payload = {
    "email": "frontendtest@example.com",
    "password": "TestPass123!",
    "full_name": "Frontend Test User"
}

print("Testing frontend-like registration request...")
print(f"URL: {url}")
print(f"Headers: {json.dumps(headers, indent=2)}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\n" + "="*60 + "\n")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")

    if response.status_code == 201:
        print("\n✓ SUCCESS - Registration worked!")
    else:
        print(f"\n✗ FAILED - Got {response.status_code} error")
except Exception as e:
    print(f"\n✗ ERROR: {e}")
