import re
p = r"c:\\Users\\34644\\Desktop\\GISI\\GISI 3º\\ISO\\Proyecto_Ingenieria_Software\\proyecto_iso\\static\\perfil.html"
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()
# extract the first <script type="module"> ... </script>
m = re.search(r"<script[^>]*type=[\"']module[\"'][^>]*>([\s\S]*?)</script>", s, re.I)
if not m:
    print('No module script found')
    exit(1)
code = m.group(1)
# Count characters and show positions of suspicious lines
counts = {'(': code.count('('), ')': code.count(')'), '{': code.count('{'), '}': code.count('}'), '[': code.count('['), ']': code.count(']')}
print('Counts:', counts)
# Show lines around end to inspect
lines = code.splitlines()
for i in range(max(0, len(lines)-40), len(lines)):
    print(f"{i+1+ (len(lines)-len(lines))}: {lines[i]}")
# Find lines with only closing parens/braces
for idx, line in enumerate(lines, start=1):
    if re.match(r"^\s*\)\s*;?\s*$", line):
        print('Found lonely ) at line', idx, repr(line))
    if re.match(r"^\s*\};?\s*$", line):
        print('Found lonely }; at line', idx, repr(line))

# Print the last 60 lines with numbers
print('\n--- Last 60 lines of module script ---')
start = max(0, len(lines)-60)
for i in range(start, len(lines)):
    print(f"{i+1}: {lines[i]}")

# Also print a diff of parentheses balance by prefix
balance = 0
for idx, ch in enumerate(code):
    if ch == '(':
        balance += 1
    elif ch == ')':
        balance -= 1
    if balance < 0:
        print('Negative balance at char index', idx)
        break
else:
    print('Parentheses balance non-negative through entire script; final balance', balance)

# Count braces balance
b = 0
for idx, ch in enumerate(code):
    if ch == '{': b += 1
    elif ch == '}': b -= 1
    if b < 0:
        print('Brace negative at index', idx)
        break
else:
    print('Braces final balance', b)
