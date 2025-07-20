# 監督者AI 重要知見ログ

## 2025-07-20 19:07:27 - Astro設定ファイル競合問題の特定

### 問題の詳細
**根本原因**: 設定ファイルの競合問題

#### 競合するファイル
1. `src/content/config.ts` - postsコレクションを定義
2. `src/content.config.ts` - blogコレクションを定義（競合）

#### 問題の発生メカニズム
- Astroが`src/content.config.ts`を優先して読み込み
- 存在しない`blog`ディレクトリを参照
- 結果としてpostsコレクションが認識されない

### 解決策
1. 競合ファイルの削除: `src/content.config.ts`を削除
2. RSSファイルの修正: blogコレクションをpostsコレクションに変更
3. リンクパスの修正: `/blog/${post.id}/`を`/posts/${post.slug}/`に変更

### 監督者の教訓
- **段階的アプローチ**: 有効だが根本原因特定には不十分
- **症状対応の限界**: キャッシュクリアでは根本解決できない
- **実装AIの重要性**: 技術的深掘りが必要な場面では実装AIの分析力が重要

### 今後の注意点
- Astroプロジェクトでは設定ファイルの重複に注意
- `src/content.config.ts`と`src/content/config.ts`の競合を避ける
- 設定変更後は必ず開発サーバーを再起動

### 技術的詳細
- Astro v5.12.0での動作確認済み
- コンテンツコレクション設定の優先順位: `src/content.config.ts` > `src/content/config.ts`
- 競合時のエラーメッセージ: "The collection 'posts' does not exist or is empty"

---
*このログは今後のAstroプロジェクトでの同様の問題を防ぐために記録* 