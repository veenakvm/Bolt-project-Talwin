# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Talwin AquaRay office staff on laptops: quotations, invoices, products, expenses, reports, user approvals.
- Field technicians on phones at customer sites: site surveys, sales / installation / complaint pipelines.
- Vendors (role `dealer` in the database): sign up, wait for staff approval, then see only their own quotations and invoices.
Both desktop and phone use are primary.

## Product Purpose
Field-technician and back-office management for Talwin AquaRay (formerly Skanda Agencies), Bengaluru: water treatment (softeners, RO, pumps, heaters) and solar products. Tracks leads through installation and service, records site surveys, and produces GST quotations and invoices as PDFs.

## Operating Context
Indian SMB: GST (CGST/SGST split, HSN codes), amounts in INR with Indian digit grouping, Karnataka place of supply. Quotations convert into invoices. PDFs are printed and terms are written by hand.

## Capabilities and Constraints
React 18 + Vite + Tailwind 3 + lucide-react icons, Supabase backend, deployed to GitHub Pages under /Bolt-project-Talwin/. No router; tabs are component state. Every existing feature, field and PDF must keep working.

## Brand Commitments
- Logo: public/talwin-logo.jpeg (teal-blue water drop with green leaf and yellow/green solar accents). Keep it.
- Name: TALWIN AquaRay Solutions. Contact: 89040 69224 · www.talwin.in · info@talwin.in.
- Look should sit next to Zoho / Freshworks business software; lead colour is the logo's teal-blue.

## Product Principles
- Familiar business-software patterns over novelty: staff and vendors should feel at home immediately.
- Works one-handed on a phone in the field as well as on a laptop at a desk.
- Money and tax figures must be unambiguous and easy to scan.
