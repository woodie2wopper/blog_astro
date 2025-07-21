#!/usr/bin/env python3
"""
シンプルな単一記事修正プログラム (Task 3.4)
UNIXの精神: 単一責任、シンプル、確実
"""

import sys
import re
import shutil
from pathlib import Path

def fix_single_article_simple(article_file: str) -> bool:
    """
    単一記事の画像URLを修正（シンプル版）
    
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
        
        # 修正前にバックアップを作成
        backup_path = file_path.with_suffix('.md.bak')
        shutil.copy2(file_path, backup_path)
        print(f"バックアップ作成: {backup_path}")
        
        # ファイルを読み込み
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # シンプルな正規表現パターン
        # 修正前: blog-images/IMG_5554x1200.JPG
        # 修正後: blog-images/[記事ID]/IMG_5554x1200.JPG
        pattern = r'blog-images/([^/]+\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF))'
        
        fix_count = 0
        
        def replace_url(match):
            nonlocal fix_count
            image_filename = match.group(1)
            old_url_part = f"blog-images/{image_filename}"
            new_url_part = f"blog-images/{article_id}/{image_filename}"
            
            print(f"  修正: {image_filename}")
            print(f"    {old_url_part}")
            print(f"    → {new_url_part}")
            
            fix_count += 1
            return new_url_part
        
        # URL修正
        new_content = re.sub(pattern, replace_url, content)
        
        # 修正があった場合のみファイルを更新
        if fix_count > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ 修正完了: {fix_count}件のURLを修正")
            return True
        else:
            print("ℹ️  修正対象のURLが見つかりませんでした")
            # バックアップファイルを削除（修正が不要な場合）
            backup_path.unlink()
            print(f"バックアップ削除: {backup_path}")
            return True  # 修正対象がない場合も成功とする
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def main():
    """メイン処理"""
    if len(sys.argv) != 2:
        print("使用方法: python3 fix_single_article_simple.py <記事ファイル>")
        print("例: python3 fix_single_article_simple.py src/content/posts/3D7EE764D1B34FE28ACF38B175848A1A.md")
        sys.exit(1)
    
    article_file = sys.argv[1]
    success = fix_single_article_simple(article_file)
    
    if success:
        print("✅ 処理完了")
        sys.exit(0)
    else:
        print("❌ 処理失敗")
        sys.exit(1)

if __name__ == "__main__":
    main() 