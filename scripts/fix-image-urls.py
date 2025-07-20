#!/usr/bin/env python3
"""
画像URL修正スクリプト
現在のURLを正しい形式に修正
"""

import os
import re
import glob

def fix_image_urls():
    """画像URLを正しい形式に修正"""
    
    # 正しいURL形式
    old_pattern = r'https://object-storage\.tyo2\.conoha\.io/v1/nc_2520d9a1_blog-astro-assets/blog-astro-assets/blog-images/'
    new_pattern = 'https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/'
    
    # 記事ファイルのパス
    posts_dir = 'src/content/posts'
    
    # 修正されたファイル数
    fixed_files = 0
    
    print("=== 画像URL修正スクリプト ===")
    print(f"修正対象ディレクトリ: {posts_dir}")
    print(f"修正前パターン: {old_pattern}")
    print(f"修正後パターン: {new_pattern}")
    print()
    
    # 記事ファイルを検索
    md_files = glob.glob(f"{posts_dir}/*.md")
    
    for file_path in md_files:
        try:
            # ファイルを読み込み
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 修正前のURLを検索
            old_urls = re.findall(old_pattern + r'[^"\s]+', content)
            
            if old_urls:
                print(f"修正対象ファイル: {os.path.basename(file_path)}")
                print(f"修正対象URL数: {len(old_urls)}")
                
                # URLを修正
                new_content = content.replace(old_pattern, new_pattern)
                
                # 修正後のURLを確認
                new_urls = re.findall(new_pattern + r'[^"\s]+', new_content)
                
                # ファイルを書き込み
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"✅ 修正完了: {len(new_urls)}個のURLを修正")
                print(f"  例: {new_urls[0] if new_urls else 'N/A'}")
                print()
                
                fixed_files += 1
                
        except Exception as e:
            print(f"❌ エラー: {file_path} - {e}")
            print()
    
    print(f"=== 修正完了 ===")
    print(f"修正されたファイル数: {fixed_files}")
    
    return fixed_files

def test_fixed_urls():
    """修正されたURLのテスト"""
    print("\n=== 修正されたURLのテスト ===")
    
    # テスト用のURL
    test_url = "https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/8811365F79D44C44ACFF5480577C65A8/mee313765-math-0001x1200.png"
    
    import requests
    
    try:
        response = requests.head(test_url, timeout=10)
        print(f"テストURL: {test_url}")
        print(f"レスポンス: HTTP {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 修正されたURLでアクセス成功")
            return True
        else:
            print(f"❌ 修正されたURLでアクセス失敗: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ テストエラー: {e}")
        return False

def main():
    """メイン処理"""
    print("画像URL修正スクリプトを開始します...")
    
    # URL修正
    fixed_count = fix_image_urls()
    
    if fixed_count > 0:
        # 修正されたURLのテスト
        test_success = test_fixed_urls()
        
        if test_success:
            print("\n🎉 全ての修正が正常に完了しました！")
            print("ブログ記事で画像が正常に表示されるはずです。")
        else:
            print("\n⚠️  URL修正は完了しましたが、アクセステストに失敗しました。")
    else:
        print("\nℹ️  修正対象のファイルが見つかりませんでした。")

if __name__ == "__main__":
    main() 