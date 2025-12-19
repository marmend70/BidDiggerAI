
import os

file_path = 'src/components/Dashboard.tsx'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    start_line = 1990
    end_line = 2000
    
    print(f"--- Lines {start_line}-{end_line} of {file_path} ---")
    for i in range(start_line, end_line):
        if i < len(lines):
            print(f"{i+1}: {repr(lines[i])}")
            
except Exception as e:
    print(f"Error: {e}")
