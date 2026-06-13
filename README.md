# Blackthorn's Tropical Plants

Static storefront and care site for Blackthorn's Tropical Plants, an Oregon-grown tropical plant business focused on monsteras, rooted starts, and care education.

## What is included

- Branded homepage based on the supplied Blackthorn's logo and reference design
- Shop-by-stage sections for nodes, rooting nodes, rooted cuttings, baby plants, juvenile plants, and mature plants
- Local quote drawer that stores selected plants in the browser
- Inquiry form that opens an email draft with selected plants and customer details
- Care and collection sections for plant education and brand storytelling

## Local development

Install dependencies, then run the local Vinext dev server:

```bash
npm install
npm run dev
```

For a production validation build:

```bash
npm run build
```

## Maintenance notes

- Update contact routing in `app/page.tsx` by changing `CONTACT_EMAIL`.
- Edit inventory in `app/page.tsx` by updating the `plants` array.
- Add new plant photos under `public/assets/images/` and reference them from the relevant card or section.
- Sites deployment metadata lives in `.openai/hosting.json`.
