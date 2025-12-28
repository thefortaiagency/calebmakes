#!/usr/bin/env node

/**
 * Generate Template Preview Images for CalebMakes
 * Uses DALL-E 3 to create preview images for the 3D model templates
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const TEMPLATES = [
  {
    id: 'phone-stand-1',
    name: 'Simple Phone Stand',
    prompt: `3D render of a sleek phone stand for smartphones, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, the stand has a clean angled back support with cable routing slot, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'cable-organizer-1',
    name: 'Desktop Cable Organizer',
    prompt: `3D render of a desktop cable organizer with 5 slots for cables, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, clean geometric shape with rounded cable slots, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'pencil-holder-1',
    name: 'Hexagonal Pencil Cup',
    prompt: `3D render of a hexagonal pencil holder cup with decorative rings around it, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, geometric honeycomb shape, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'headphone-hook-1',
    name: 'Wall Headphone Hook',
    prompt: `3D render of a wall-mounted headphone hook holder, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, curved hook design with wall mounting plate, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'storage-box-1',
    name: 'Snap-Fit Storage Box',
    prompt: `3D render of a small storage box with snap-fit lid, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, box and lid shown separately, rounded corners, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'controller-stand-1',
    name: 'Gaming Controller Stand',
    prompt: `3D render of a gaming controller display stand, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, ergonomic cradle design for Xbox/PlayStation controller, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'desk-organizer-1',
    name: 'Modular Desk Organizer',
    prompt: `3D render of a modular desk organizer with multiple compartments for pens phone and sticky notes, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, clean geometric design with dividers, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
  {
    id: 'tablet-stand-1',
    name: 'Adjustable Tablet Stand',
    prompt: `3D render of an adjustable tablet stand for iPad, modern minimalist design, cyan and purple gradient lighting, dark background, product photography style, sturdy angled design with front lip, made of smooth plastic material, photorealistic, studio lighting, no text`,
  },
];

async function generateImage(prompt) {
  console.log(`🎨 Generating image...`);

  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      response_format: 'url'
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data[0].url;
}

async function downloadImage(url, filename) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const outputDir = path.join(__dirname, '../public/templates');
  await fs.mkdir(outputDir, { recursive: true });

  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, response.data);

  console.log(`💾 Saved: ${filepath}`);
  return `/templates/${filename}`;
}

async function main() {
  console.log('🚀 CalebMakes Template Image Generator\n');
  console.log(`Generating ${TEMPLATES.length} template preview images...\n`);

  const results = [];

  for (const template of TEMPLATES) {
    console.log(`\n📦 ${template.name} (${template.id})`);
    console.log(`   Prompt: ${template.prompt.substring(0, 80)}...`);

    try {
      const imageUrl = await generateImage(template.prompt);
      const filename = `${template.id}.png`;
      const localPath = await downloadImage(imageUrl, filename);

      results.push({
        id: template.id,
        name: template.name,
        imagePath: localPath,
        success: true
      });

      console.log(`   ✅ Success!`);

      // Rate limiting - wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({
        id: template.id,
        name: template.name,
        success: false,
        error: error.message
      });
    }
  }

  // Save manifest
  const manifestPath = path.join(__dirname, '../public/templates/manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(results, null, 2));

  console.log('\n\n📋 Results Summary:');
  console.log('==================');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Generated ${successCount}/${TEMPLATES.length} images`);
  console.log(`📁 Saved to: public/templates/`);
}

main().catch(console.error);
