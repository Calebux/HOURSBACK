const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Colors & backgrounds
    content = content.replace(/bg-\[#F6F9FC\]/g, 'bg-brand-light');
    content = content.replace(/text-slate-900/g, 'text-brand-dark');
    content = content.replace(/text-slate-500/g, 'text-brand-dark/70');
    content = content.replace(/text-slate-600/g, 'text-brand-dark/80');
    content = content.replace(/border-slate-200/g, 'border-brand-dark/10');
    content = content.replace(/bg-slate-900/g, 'bg-brand-dark');

    // Shadows
    content = content.replace(/shadow-stripe-hover/g, 'shadow-antigravity-lg');
    content = content.replace(/shadow-stripe/g, 'shadow-antigravity-md');

    // Border radius geometry
    content = content.replace(/rounded-xl/g, 'rounded-3xl');
    content = content.replace(/rounded-2xl/g, 'rounded-3xl');
    content = content.replace(/rounded-lg/g, 'rounded-full'); // mainly buttons and small cards

    // Button primary color (previously blurple, now solid dark)
    content = content.replace(/bg-\[#635BFF\]/g, 'bg-brand-dark text-white');
    content = content.replace(/text-\[#635BFF\]/g, 'text-brand-blue');
    content = content.replace(/text-\[#A78BFA\]/g, 'text-brand-blue/70');

    // Hero section and main layout tweaks
    if (file === 'LandingPage.tsx') {
        // Make hero heading huge
        content = content.replace(/text-5xl md:text-7xl font-semibold/g, 'text-6xl md:text-8xl font-medium tracking-tighter');
        // Add bg-noise to the root div
        content = content.replace(/className="min-h-screen bg-brand-light/g, 'className="min-h-screen bg-noise bg-brand-light');

        // Glassmorphic cards
        content = content.replace(/bg-white rounded-full/g, 'bg-white/60 backdrop-blur-xl border border-white/50 rounded-full'); // badges
        content = content.replace(/bg-white shadow-antigravity-md/g, 'bg-white/60 backdrop-blur-xl shadow-antigravity-md');

        // Convert gradients
        content = content.replace(/from-\[#635BFF\] to-\[#A78BFA\]/g, 'from-brand-blue to-cyan-500');
        content = content.replace(/background: 'radial-gradient\(circle, #635BFF 0%, transparent 70%\)'/g, "background: 'radial-gradient(circle, rgba(66, 133, 244, 0.4) 0%, transparent 70%)'");
    }

    // Dashboard and generic glassmorphism 
    content = content.replace(/bg-white border-brand-dark\/10/g, 'bg-white/80 backdrop-blur-xl border border-white/40');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
}
