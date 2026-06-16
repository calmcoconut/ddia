import os
import glob
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

def split_epub():
    # Find the EPUB file in the current directory
    epub_files = glob.glob("*.epub")
    if not epub_files:
        print("No EPUB file found in the current directory.")
        return

    epub_file = epub_files[0]
    print(f"Reading: {epub_file}")

    book = epub.read_epub(epub_file)
    output_dir = "chapters"
    os.makedirs(output_dir, exist_ok=True)

    # We iterate over items in the order they appear in the book spine
    # to maintain reading order.
    spine_ids = [item_ref[0] for item_ref in book.spine]
    
    chapter_num = 1
    for spine_id in spine_ids:
        try:
            item = book.get_item_with_id(spine_id)
        except Exception:
            continue
            
        if not item or item.get_type() != ebooklib.ITEM_DOCUMENT:
            continue

        content = item.get_content()
        soup = BeautifulSoup(content, 'html.parser')
        
        # Try to find a reasonable title for the file name
        title = ""
        
        # Try h1/h2 tags first
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text()
        else:
            h2 = soup.find('h2')
            if h2:
                title = h2.get_text()
                
        if not title:
            # Fallback to soup title
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text()

        # Clean title to use as filename
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '_', '-')).strip()
        clean_title = clean_title.replace(' ', '_').lower()

        # If it's too long or empty, use a generic title
        if not clean_title or len(clean_title) > 50:
            # Fallback to the item's own file name (cleaned up)
            orig_name = os.path.basename(item.get_name())
            clean_title = orig_name.replace('.xhtml', '').replace('.html', '')
            clean_title = "".join(c for c in clean_title if c.isalnum() or c in (' ', '_', '-')).strip()

        filename = f"{chapter_num:02d}_{clean_title}.html"
        filepath = os.path.join(output_dir, filename)
        
        print(f"Writing chapter {chapter_num}: {filename}")
        
        # Write clean HTML content to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
            
        chapter_num += 1

    print(f"\nDone! Split EPUB into {chapter_num - 1} files in '{output_dir}/' directory.")

if __name__ == "__main__":
    split_epub()
