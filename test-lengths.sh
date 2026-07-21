#!/bin/bash

# Test various slug lengths
declare -A slugs=(
  [26]="national-sword-policy-2017"
  [41]="the-plastic-resource-circulation-act-prca"
  [57]="waste-minimisation-waste-disposal-levy-amendment-act-2024"
  [66]="sub-decree-no-113-on-urban-garbage-and-solid-waste-management-2015"
  [83]="plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-commerce"
  [150]="restrictions-on-the-manufacture-import-and-sale-of-personal-care-and-cosmetics-products-containing-plastic-microbeads-article-21-of-the-waste-disposal"
)

echo "Testing policy page URLs by slug length:\n"
for len in "${!slugs[@]}"; do
  slug="${slugs[$len]}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://ppd-pink.vercel.app/policies/$slug")
  echo "[$status] ${len}ch: $slug"
done | sort -V
