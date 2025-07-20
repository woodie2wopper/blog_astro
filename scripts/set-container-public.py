#!/usr/bin/env python3
"""
ConoHa Swift Object Storage コンテナの公開読み取り権限設定スクリプト
"""

import os
import swiftclient
import subprocess
import sys

def load_swift_auth():
    """Swift認証情報を読み込み"""
    try:
        # ~/.swift/auth_v1.0 を読み込み
        auth_file = os.path.expanduser("~/.swift/auth_v1.0")
        if not os.path.exists(auth_file):
            print(f"エラー: 認証ファイルが見つかりません: {auth_file}")
            return None
        
        # 認証情報を環境変数として読み込み
        result = subprocess.run(f"source {auth_file} && env", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print("エラー: 認証ファイルの読み込みに失敗しました")
            return None
        
        # 環境変数を解析
        env_vars = {}
        for line in result.stdout.split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
        
        return env_vars
    except Exception as e:
        print(f"エラー: 認証情報の読み込みに失敗しました: {e}")
        return None

def set_container_public_read(container_name):
    """コンテナに公開読み取り権限を設定"""
    try:
        # 認証情報を読み込み
        auth_vars = load_swift_auth()
        if not auth_vars:
            return False
        
        # Swiftクライアントを初期化
        auth_url = auth_vars.get('OS_AUTH_URL')
        tenant_name = auth_vars.get('OS_TENANT_NAME')
        username = auth_vars.get('OS_USERNAME')
        password = auth_vars.get('OS_PASSWORD')
        
        if not all([auth_url, tenant_name, username, password]):
            print("エラー: 必要な認証情報が不足しています")
            return False
        
        print(f"認証URL: {auth_url}")
        print(f"テナント: {tenant_name}")
        print(f"ユーザー: {username}")
        
        # Swiftクライアント接続
        conn = swiftclient.Connection(
            authurl=auth_url,
            user=username,
            key=password,
            tenant_name=tenant_name,
            auth_version='2'
        )
        
        # コンテナの現在の設定を確認
        print(f"\nコンテナ '{container_name}' の現在の設定を確認中...")
        try:
            container_info = conn.head_container(container_name)
            print(f"コンテナ情報: {container_info}")
        except swiftclient.exceptions.ClientException as e:
            if e.http_status == 404:
                print(f"エラー: コンテナ '{container_name}' が見つかりません")
                return False
            else:
                print(f"エラー: コンテナ情報の取得に失敗しました: {e}")
                return False
        
        # 公開読み取り権限を設定
        print(f"\nコンテナ '{container_name}' に公開読み取り権限を設定中...")
        headers = {
            'X-Container-Read': '.r:*',  # 全ユーザーに読み取り権限を付与
            'X-Container-Meta-Web-Listings': 'true',  # Web一覧を有効化
            'X-Container-Meta-Web-Listings-CSS': '',  # CSS設定
        }
        
        conn.post_container(container_name, headers=headers)
        print("✅ 公開読み取り権限の設定が完了しました")
        
        # 設定後の確認
        print(f"\n設定後の確認中...")
        updated_info = conn.head_container(container_name)
        print(f"更新後のコンテナ情報: {updated_info}")
        
        return True
        
    except Exception as e:
        print(f"エラー: 公開読み取り権限の設定に失敗しました: {e}")
        return False

def test_public_access(container_name, test_object):
    """公開アクセスのテスト"""
    try:
        print(f"\n公開アクセスのテスト中...")
        test_url = f"https://object-storage.tyo2.conoha.io/v1/nc_2520d9a1_{container_name}/{container_name}/{test_object}"
        print(f"テストURL: {test_url}")
        
        import requests
        response = requests.head(test_url, timeout=10)
        print(f"レスポンス: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 公開アクセステスト成功")
            return True
        else:
            print(f"❌ 公開アクセステスト失敗: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"エラー: 公開アクセステストに失敗しました: {e}")
        return False

def main():
    """メイン処理"""
    container_name = "blog-astro-assets"
    test_object = "blog-images/8811365F79D44C44ACFF5480577C65A8/mee313765-math-0001x1200.png"
    
    print("=== ConoHa Swift Object Storage 公開読み取り権限設定 ===")
    print(f"対象コンテナ: {container_name}")
    
    # 公開読み取り権限を設定
    if set_container_public_read(container_name):
        print("\n=== 設定完了 ===")
        
        # 公開アクセスのテスト
        if test_public_access(container_name, test_object):
            print("\n🎉 全ての設定が正常に完了しました！")
            print("ブログ記事で画像が正常に表示されるはずです。")
        else:
            print("\n⚠️  設定は完了しましたが、公開アクセスの確認に失敗しました。")
            print("ConoHa管理画面で手動確認をお願いします。")
    else:
        print("\n❌ 設定に失敗しました。")
        print("ConoHa管理画面で手動設定をお願いします。")
        sys.exit(1)

if __name__ == "__main__":
    main() 