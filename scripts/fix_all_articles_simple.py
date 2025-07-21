#!/usr/bin/env python3
"""
全記事修正スクリプト (Task 3.4)
UNIXの精神: シンプル、確実、段階的実行
"""

import subprocess
import sys
from pathlib import Path

def get_articles_needing_fix():
    """修正が必要な記事を取得"""
    result = subprocess.run([
        "grep", "-l", 
        "blog-images/[^/]*\\.(png\\|jpg\\|jpeg\\|gif\\|PNG\\|JPG\\|JPEG\\|GIF)", 
        "src/content/posts/*.md"
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        return result.stdout.strip().split('\n')
    else:
        return []

def fix_all_articles():
    """全記事を修正"""
    articles = get_articles_needing_fix()
    
    if not articles:
        print("✅ 修正が必要な記事はありません")
        return
    
    total_articles = len(articles)
    print(f"=== 全記事修正開始 ===")
    print(f"修正対象記事数: {total_articles}")
    print("")
    
    success_count = 0
    error_count = 0
    
    for i, article_file in enumerate(articles, 1):
        print(f"[{i}/{total_articles}] {Path(article_file).name}")
        
        # 単一記事修正プログラムを実行
        result = subprocess.run([
            "python3", "scripts/fix_single_article_simple.py", article_file
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            success_count += 1
            print("  ✅ 成功")
        else:
            error_count += 1
            print(f"  ❌ 失敗: {result.stderr}")
        
        # 進捗表示
        if i % 10 == 0:
            print(f"進捗: {i}/{total_articles} ({i/total_articles*100:.1f}%)")
            print("")
    
    print("")
    print("=== 修正完了 ===")
    print(f"成功: {success_count}件")
    print(f"失敗: {error_count}件")
    print(f"成功率: {success_count/total_articles*100:.1f}%")
    
    if error_count == 0:
        print("✅ 全記事の修正が完了しました")
        return True
    else:
        print("❌ 一部の記事で修正に失敗しました")
        return False

def main():
    """メイン処理"""
    print("全記事修正プログラム")
    print("このプログラムは修正が必要な全記事を処理します")
    print("")
    
    # 確認
    response = input("続行しますか？ (y/N): ").strip().lower()
    if response != 'y':
        print("キャンセルしました")
        return
    
    success = fix_all_articles()
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 