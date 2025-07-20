#!/usr/bin/env python3
"""
画像URL検証・修正プログラム (Task 3.3)
全記事（109件）の画像URLを一括検証し、正しいパスに自動修正するプログラム
"""

import os
import re
import json
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
import requests
from typing import Dict, List, Tuple, Optional

class ImageUrlVerifier:
    def __init__(self, posts_dir: str = "src/content/posts", backup_dir: str = "scripts/backup"):
        self.posts_dir = Path(posts_dir)
        self.backup_dir = Path(backup_dir)
        self.old_container = "nc_2520d9a1"
        self.new_container = "nc_938a9d00d6004f1390c354d4a15ef25b"
        self.base_url = "https://object-storage.tyo2.conoha.io/v1"
        
        # 結果保存用
        self.verification_results = []
        self.fix_results = []
        self.test_results = []
        
        # ログファイル
        self.log_file = "scripts/image_url_verification.log"
        self.report_file = "scripts/verification_report.json"
        
    def log(self, message: str):
        """ログメッセージを記録"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(log_message + "\n")
    
    def create_backup(self) -> bool:
        """記事ファイルのバックアップを作成"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"posts_backup_{timestamp}"
            
            if self.posts_dir.exists():
                shutil.copytree(self.posts_dir, backup_path)
                self.log(f"バックアップ作成完了: {backup_path}")
                return True
            else:
                self.log(f"エラー: 記事ディレクトリが見つかりません: {self.posts_dir}")
                return False
        except Exception as e:
            self.log(f"バックアップ作成エラー: {e}")
            return False
    
    def extract_article_id(self, filename: str) -> str:
        """ファイル名から記事IDを抽出"""
        return Path(filename).stem
    
    def extract_image_filename(self, url: str) -> str:
        """URLから画像ファイル名を抽出"""
        match = re.search(r'/([^/]+\.(png|jpg|jpeg|gif|webp))', url)
        return match.group(1) if match else ""
    
    def verify_url_format(self, url: str, article_id: str) -> Dict:
        """URL形式を検証"""
        result = {
            "url": url,
            "article_id": article_id,
            "is_valid": False,
            "errors": [],
            "correct_url": ""
        }
        
        # 正しいURL形式のパターン
        correct_pattern = f"{self.base_url}/{self.new_container}/blog-astro-assets/blog-images/{article_id}/"
        
        # 古いコンテナパスのチェック
        if self.old_container in url:
            result["errors"].append("古いコンテナパスが使用されています")
        
        # 正しいディレクトリ構造のチェック
        if "blog-images/" not in url:
            result["errors"].append("blog-imagesディレクトリが含まれていません")
        
        # 記事IDのチェック
        if article_id not in url:
            result["errors"].append("記事IDがURLに含まれていません")
        
        # 画像ファイル名の抽出
        image_filename = self.extract_image_filename(url)
        if not image_filename:
            result["errors"].append("画像ファイル名を抽出できません")
        else:
            result["correct_url"] = f"{correct_pattern}{image_filename}"
        
        # エラーがない場合は有効
        if not result["errors"]:
            result["is_valid"] = True
        
        return result
    
    def verify_all_posts(self) -> List[Dict]:
        """全記事の画像URLを検証"""
        self.log("全記事の画像URL検証を開始")
        
        markdown_files = list(self.posts_dir.glob("*.md"))
        self.log(f"検証対象ファイル数: {len(markdown_files)}")
        
        for file_path in markdown_files:
            article_id = self.extract_article_id(file_path.name)
            self.log(f"記事ID {article_id} を検証中...")
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # 画像URLを抽出
                image_urls = re.findall(r'https://object-storage\.tyo2\.conoha\.io[^)\s]+', content)
                
                if not image_urls:
                    self.log(f"記事ID {article_id}: 画像URLが見つかりません")
                    continue
                
                for url in image_urls:
                    verification_result = self.verify_url_format(url, article_id)
                    verification_result["file_path"] = str(file_path)
                    self.verification_results.append(verification_result)
                    
                    if not verification_result["is_valid"]:
                        self.log(f"記事ID {article_id}: URL形式エラー - {verification_result['errors']}")
                    else:
                        self.log(f"記事ID {article_id}: URL形式正常")
                        
            except Exception as e:
                self.log(f"記事ID {article_id} の検証エラー: {e}")
        
        self.log("全記事の画像URL検証完了")
        return self.verification_results
    
    def fix_image_urls(self) -> List[Dict]:
        """画像URLを修正"""
        self.log("画像URL修正を開始")
        
        # バックアップ作成
        if not self.create_backup():
            self.log("バックアップ作成に失敗したため、修正を中止します")
            return []
        
        # 修正が必要なURLを抽出
        urls_to_fix = [r for r in self.verification_results if not r["is_valid"]]
        self.log(f"修正対象URL数: {len(urls_to_fix)}")
        
        for result in urls_to_fix:
            try:
                file_path = Path(result["file_path"])
                article_id = result["article_id"]
                old_url = result["url"]
                new_url = result["correct_url"]
                
                if not new_url:
                    self.log(f"記事ID {article_id}: 正しいURLを生成できませんでした")
                    continue
                
                # ファイル内容を読み込み
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # URLを置換
                new_content = content.replace(old_url, new_url)
                
                # ファイルを書き込み
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                
                fix_result = {
                    "article_id": article_id,
                    "file_path": str(file_path),
                    "old_url": old_url,
                    "new_url": new_url,
                    "success": True
                }
                self.fix_results.append(fix_result)
                
                self.log(f"記事ID {article_id}: URL修正完了")
                
            except Exception as e:
                self.log(f"記事ID {article_id} の修正エラー: {e}")
                fix_result = {
                    "article_id": article_id,
                    "file_path": str(file_path),
                    "old_url": old_url,
                    "new_url": new_url,
                    "success": False,
                    "error": str(e)
                }
                self.fix_results.append(fix_result)
        
        self.log("画像URL修正完了")
        return self.fix_results
    
    def test_image_access(self) -> List[Dict]:
        """修正後の画像URLアクセステスト"""
        self.log("画像アクセステストを開始")
        
        # 修正されたURLをテスト
        for fix_result in self.fix_results:
            if not fix_result["success"]:
                continue
                
            article_id = fix_result["article_id"]
            new_url = fix_result["new_url"]
            
            try:
                # curlコマンドでHTTPアクセステスト
                result = subprocess.run(
                    ["curl", "-I", "-s", "-w", "%{http_code}", "-o", "/dev/null", new_url],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                http_code = result.stdout.strip()
                is_accessible = http_code == "200"
                
                test_result = {
                    "article_id": article_id,
                    "url": new_url,
                    "http_code": http_code,
                    "is_accessible": is_accessible,
                    "success": True
                }
                
                if is_accessible:
                    self.log(f"記事ID {article_id}: 画像アクセス成功 (HTTP {http_code})")
                else:
                    self.log(f"記事ID {article_id}: 画像アクセス失敗 (HTTP {http_code})")
                
                self.test_results.append(test_result)
                
            except subprocess.TimeoutExpired:
                self.log(f"記事ID {article_id}: 画像アクセステストタイムアウト")
                test_result = {
                    "article_id": article_id,
                    "url": new_url,
                    "http_code": "TIMEOUT",
                    "is_accessible": False,
                    "success": False,
                    "error": "Timeout"
                }
                self.test_results.append(test_result)
                
            except Exception as e:
                self.log(f"記事ID {article_id}: 画像アクセステストエラー: {e}")
                test_result = {
                    "article_id": article_id,
                    "url": new_url,
                    "http_code": "ERROR",
                    "is_accessible": False,
                    "success": False,
                    "error": str(e)
                }
                self.test_results.append(test_result)
        
        self.log("画像アクセステスト完了")
        return self.test_results
    
    def generate_report(self):
        """レポートを生成"""
        self.log("レポート生成を開始")
        
        # 統計情報
        total_posts = len(self.verification_results)
        valid_urls = len([r for r in self.verification_results if r["is_valid"]])
        invalid_urls = total_posts - valid_urls
        successful_fixes = len([r for r in self.fix_results if r["success"]])
        accessible_images = len([r for r in self.test_results if r["is_accessible"]])
        
        # レポートデータ
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_posts": total_posts,
                "valid_urls": valid_urls,
                "invalid_urls": invalid_urls,
                "successful_fixes": successful_fixes,
                "accessible_images": accessible_images
            },
            "verification_results": self.verification_results,
            "fix_results": self.fix_results,
            "test_results": self.test_results
        }
        
        # JSONレポートを保存
        with open(self.report_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        
        # サマリーレポートを生成
        summary_file = "scripts/verification_summary.txt"
        with open(summary_file, "w", encoding="utf-8") as f:
            f.write("=== 画像URL検証・修正レポート ===\n")
            f.write(f"実行日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"総記事数: {total_posts}\n")
            f.write(f"有効なURL: {valid_urls}\n")
            f.write(f"無効なURL: {invalid_urls}\n")
            f.write(f"修正成功: {successful_fixes}\n")
            f.write(f"アクセス可能: {accessible_images}\n")
            f.write("\n")
            
            if invalid_urls > 0:
                f.write("=== エラー詳細 ===\n")
                for result in self.verification_results:
                    if not result["is_valid"]:
                        f.write(f"記事ID: {result['article_id']}\n")
                        f.write(f"エラー: {', '.join(result['errors'])}\n")
                        f.write(f"正しいURL: {result['correct_url']}\n")
                        f.write("\n")
        
        self.log(f"レポート生成完了: {self.report_file}, {summary_file}")
    
    def run_full_verification(self):
        """完全な検証・修正プロセスを実行"""
        self.log("=== 画像URL検証・修正プログラム開始 ===")
        
        # Phase 1: 検証
        self.verify_all_posts()
        
        # Phase 2: 修正
        if any(not r["is_valid"] for r in self.verification_results):
            self.fix_image_urls()
            
            # Phase 3: テスト
            self.test_image_access()
        
        # Phase 4: レポート生成
        self.generate_report()
        
        self.log("=== 画像URL検証・修正プログラム完了 ===")

def main():
    """メイン関数"""
    verifier = ImageUrlVerifier()
    verifier.run_full_verification()

if __name__ == "__main__":
    main() 