import re

with open('src/pages/LandingPage.tsx', 'r') as f:
    content = f.read()

# Colors
content = content.replace('bg-[#0A0A0A]', 'bg-[#F6F9FC]')
content = content.replace('text-[#0A0A0A]', 'text-slate-900')
content = content.replace('text-white', 'TEXT_PLACEHOLDER') # temp
content = content.replace('bg-white/5', 'bg-white shadow-stripe border border-slate-200')
content = content.replace('bg-white/10', 'bg-slate-50')
content = content.replace('border-white/5', 'border-slate-200')
content = content.replace('border-white/10', 'border-slate-200')

# Text grays
content = content.replace('text-gray-300', 'text-slate-600')
content = content.replace('text-gray-400', 'text-slate-500')
content = content.replace('text-gray-500', 'text-slate-400')
content = content.replace('text-gray-600', 'text-slate-600')

# Resolve placeholder
content = content.replace('TEXT_PLACEHOLDER', 'text-slate-900')

# Re-fix cases where text-white is needed on colored backgrounds
content = content.replace('text-slate-900 antialiased', 'text-slate-900 antialiased') 
content = content.replace('text-slate-900"', 'text-slate-900"')
content = content.replace('Zap className="w-5 h-5 text-slate-900"', 'Zap className="w-5 h-5 text-white"')

# Hero section improvements
content = content.replace('bg-white text-black', 'bg-slate-900 text-white')

# Primary buttons
content = content.replace('bg-[#635BFF] rounded-lg', 'bg-[#635BFF] text-white rounded-lg shadow-stripe hover:shadow-stripe-hover transition-all')

# Fix playbooks preview group hover
content = content.replace('group-hover:text-[#635BFF]', 'group-hover:text-[#635BFF]')

# Logos
content = content.replace('color: "#FFFFFF"', 'color: "#000000"')

with open('src/pages/LandingPage.tsx', 'w') as f:
    f.write(content)
