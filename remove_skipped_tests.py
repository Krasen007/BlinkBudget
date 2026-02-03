import re
import os

# Files with skipped tests
files_to_process = [
    r'tests\smart-suggestions.test.js',
    r'tests\security\comprehensive-security.test.js',
    r'tests\security\auth-penetration.test.js',
    r'tests\privacy\privacy-validation-focused.test.js',
    r'tests\privacy\account-deletion-privacy.test.js',
    r'tests\data-loss-prevention.test.js',
    r'tests\data-loss-prevention-simple.test.js',
]

def remove_skipped_tests(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove it.skip blocks
    # Pattern to match it.skip('...', () => { ... });
    pattern_it = r"  it\.skip\(['\"].*?['\"],.*?\{\n(?:.*?\n)*?  \}\);\n\n?"
    content = re.sub(pattern_it, '', content, flags=re.MULTILINE)
    
    # Remove describe.skip blocks
    # Pattern to match describe.skip('...', () => { ... });
    pattern_describe = r"  describe\.skip\(['\"].*?['\"],.*?\{\n(?:.*?\n)*?  \}\);\n\n?"
    content = re.sub(pattern_describe, '', content, flags=re.MULTILINE)
    
    # Also try with 4 spaces
    pattern_it_4 = r"    it\.skip\(['\"].*?['\"],.*?\{\n(?:.*?\n)*?    \}\);\n\n?"
    content = re.sub(pattern_it_4, '', content, flags=re.MULTILINE)
    
    pattern_describe_4 = r"    describe\.skip\(['\"].*?['\"],.*?\{\n(?:.*?\n)*?    \}\);\n\n?"
    content = re.sub(pattern_describe_4, '', content, flags=re.MULTILINE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Processed: {filepath}")

# Process each file
for file in files_to_process:
    if os.path.exists(file):
        remove_skipped_tests(file)
    else:
        print(f"File not found: {file}")

print("Done!")
