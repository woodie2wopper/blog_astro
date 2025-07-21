#!/usr/bin/env python3
"""
単一記事修正プログラム (Task 3.4)
UNIXの精神: 単一責任、シンプル、確実
"""

import sys
import re
from pathlib import Path

def fix_single_article(article_file: str) -> bool:
    """
    単一記事の画像URLを修正
    
    Args:
        article_file: 記事ファイルのパス
        
    Returns:
        bool: 修正成功時True、失敗時False
    """
    try:
        # ファイルパスをPathオブジェクトに変換
        file_path = Path(article_file)
        
        # ファイルが存在するか確認
        if not file_path.exists():
            print(f"エラー: ファイルが見つかりません: {article_file}")
            return False
        
        # 記事IDを抽出（ファイル名から.mdを除去）
        article_id = file_path.stem
        
        print(f"処理中: {article_id}")
        
        # ファイルを読み込み
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修正前のパターン: blog-images/[画像ファイル名]
        # 修正後のパターン: blog-images/[記事ID]/[画像ファイル名]
        old_pattern = r'https://object-storage\.tyo2\.conoha\.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/([^/]+\.(?:png|jpg|jpeg|gif))'
        
        fix_count = 0
        
        def replace_url(match):
            nonlocal fix_count
            image_filename = match.group(1)
            old_url = match.group(0)
            new_url = f"https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/{article_id}/{image_filename}"
            
            print(f"  修正: {image_filename}")
            print(f"    {old_url}")
            print(f"    → {new_url}")
            
            fix_count += 1
            return new_url
        
        # URL修正
        new_content = re.sub(old_pattern, replace_url, content)
        
        # 修正があった場合のみファイルを更新
        if fix_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ 修正完了: {fix_count}件のURLを修正")
            return True
        else:
            print("ℹ️  修正対象のURLが見つかりませんでした")
            return True  # 修正対象がない場合も成功とする
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def main():
    """メイン処理"""
    if len(sys.argv) != 2:
        print("使用方法: python3 fix_single_article.py <記事ファイル>")
        print("例: python3 fix_single_article.py src/content/posts/3D7EE764D1B34FE28ACF38B175848A1A.md")
        sys.exit(1)
    
    article_file = sys.argv[1]
    success = fix_single_article(article_file)
    
    if success:
        print("✅ 処理完了")
        sys.exit(0)
    else:
        print("❌ 処理失敗")
        sys.exit(1)

if __name__ == "__main__":
    main() 