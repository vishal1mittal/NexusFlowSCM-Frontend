import os

# Directory containing JavaScript and JSX files
scripts_folder = "D:\\Codes\\NexusFlowSCM\\frontend"  # Change this to your folder path
output_file = 'combined_scripts.txt'

# Open the output file in write mode
with open(output_file, 'w', encoding='utf-8') as outfile:
    # Walk through all directories and subdirectories
    for dirpath, dirnames, filenames in os.walk(scripts_folder):
        # Exclude the node_modules directory
        if 'node_modules' in dirnames:
            dirnames.remove('node_modules')  # This prevents os.walk from going into the node_modules folder
            
        for filename in filenames:
            if filename.endswith('.js') or filename.endswith('.jsx'):
                filepath = os.path.join(dirpath, filename)
                
                # Write the filename at the top of the file's content
                outfile.write(f"--- Start of {filename} ---\n")
                
                # Open the JavaScript/JSX file and write its content
                with open(filepath, 'r', encoding='utf-8') as infile:
                    for line in infile:
                        outfile.write(line)
                
                # Write a separator after the content of each script
                outfile.write(f"\n--- End of {filename} ---\n\n")

print(f"Combined all scripts into {output_file}")
