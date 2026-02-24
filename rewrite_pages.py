import os

pages = ['DashboardPage.tsx', 'PlaybooksPage.tsx', 'PlaybookViewerPage.tsx']

for page in pages:
    path = os.path.join('src/pages', page)
    if not os.path.exists(path):
        continue
    with open(path, 'r') as f:
        content = f.read()

    # Colors
    content = content.replace('bg-[#0A0A0A]', 'bg-[#F6F9FC]')
    content = content.replace('text-[#0A0A0A]', 'text-slate-900')
    content = content.replace('text-white', 'text-slate-900')
    content = content.replace('bg-white/5', 'bg-white shadow-stripe border border-slate-200')
    content = content.replace('bg-white/10', 'bg-slate-50')
    content = content.replace('border-white/5', 'border-slate-200')
    content = content.replace('border-white/10', 'border-slate-200')

    # Text grays
    content = content.replace('text-gray-300', 'text-slate-600')
    content = content.replace('text-gray-400', 'text-slate-500')
    content = content.replace('text-gray-500', 'text-slate-400')
    content = content.replace('text-gray-600', 'text-slate-600')

    # Primary buttons and UI elements text color
    content = content.replace('bg-[#635BFF] text-slate-900', 'bg-[#635BFF] text-white')
    content = content.replace('bg-[#635BFF] rounded-lg', 'bg-[#635BFF] text-white rounded-lg shadow-stripe hover:shadow-stripe-hover transition-all')
    content = content.replace('bg-white text-black', 'bg-slate-900 text-white')
    
    # Text on some primary-colored things should stay white
    content = content.replace('text-slate-900 hover:text-white', 'text-slate-600 hover:text-slate-900')
    
    with open(path, 'w') as f:
        f.write(content)
