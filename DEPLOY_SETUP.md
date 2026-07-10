# さくらインターネット 自動デプロイ セットアップ 引き継ぎメモ

このリポジトリ（`kajiyaan/mokikaku`）を、さくらのレンタルサーバへ **自動アップロード**するための設定状況と残作業をまとめたものです。

---

## ゴール
`main` ブランチに push すると、GitHub Actions が自動でさくらのレンタルサーバへサイトを同期し、`https://mokikaku.jp/` で公開される状態にする。

---

## サーバー・ドメイン情報

| 項目 | 値 |
|---|---|
| さくらプラン | さくらのレンタルサーバ スタンダード |
| 初期ドメイン | kzshop.sakura.ne.jp |
| ホスト名 | www437.sakura.ne.jp |
| **FTP/SFTPサーバー名** | kzshop.sakura.ne.jp |
| FTP/SSHユーザー名 | kzshop |
| 公開ドメイン | mokikaku.jp（取得済み・さくらに設定済み） |
| 公開フォルダ | `/home/kzshop/www/mokikaku/` |

---

## 完了済みの作業

- [x] マルチページのWebサイトを作成（index / service-company / service-worker / flow / faq / entry / company）
- [x] `main` ブランチ = GitHub Pages 公開用、`claude/dazzling-edison-1FwJ1` = 開発用
- [x] さくらで独自ドメイン `mokikaku.jp` を追加、公開フォルダを `~/www/mokikaku` に設定
- [x] さくらのファイルマネージャーで `/home/kzshop/www/mokikaku` フォルダを作成
- [x] GitHub Actions ワークフロー `.github/workflows/deploy.yml` を作成（SFTP方式）
- [x] GitHub Secrets を3つ登録
  - `SAKURA_FTP_SERVER` = `kzshop.sakura.ne.jp`
  - `SAKURA_FTP_USER` = `kzshop`
  - `SAKURA_FTP_PASSWORD` = （サーバーパスワード）

---

## 現在つまずいている点（⚠️要対応）

デプロイ実行時、SFTP接続で **`Permission denied`（パスワード認証の失敗）** が発生している。

- FFFTP で `kzshop.sakura.ne.jp` / ユーザー `kzshop` に接続を試みても、**同じパスワードで拒否される**ことを確認済み。
- → **現在手元にあるサーバーパスワードが、実際のサーバーパスワードと一致していない**ことが原因と判明。

### 補足：パスワードの種類（重要）
- **会員パスワード** … さくら会員メニューへのログイン用。※今回は変更しない。
- **サーバーパスワード** … FTP / SSH / SFTP / ファイルマネージャー用。※これが今回必要なもの。
- さくらでは FTPパスワード = SSHパスワード = サーバーパスワード（すべて同一）。

---

## 残作業（次にやること）

### STEP 1. サーバーパスワードを再発行
1. さくら会員メニュー →「契約中のサービス一覧」→ レンタルサーバ スタンダード
2. 「手続き： 解約 / **サーバーパスワード再発行**」の青リンクをクリック
3. 新しいサーバーパスワードを設定（**英数字のみ**推奨。記号は避けると安全）

### STEP 2. FFFTP で接続確認
- ホスト：`kzshop.sakura.ne.jp` / ユーザー：`kzshop` / パスワード：新パスワード / ポート：22（SFTP）
- 接続できれば新パスワードは正しい。
- ※メールソフトを使っている場合、再発行でメールのパスワードも変わるため、そちらも更新が必要。

### STEP 3. GitHub Secret を更新
- https://github.com/kajiyaan/mokikaku/settings/secrets/actions
- `SAKURA_FTP_PASSWORD` の鉛筆✏️ → 新パスワードを貼り付け → Update secret
- ⚠️ 前後にスペースや改行が入らないよう注意。

### STEP 4. デプロイを再実行して確認
- GitHub の「Actions」タブ →「Deploy to Sakura Internet」→「Run workflow」で手動実行
- 成功したら `https://mokikaku.jp/` にサイトが表示される。

### STEP 5.（任意）SSLを設定してHTTPS化
- さくらのコントロールパネル →「ドメイン/SSL」→ mokikaku.jp に無料のLet's Encrypt SSLを設定。

---

## 代替案：パスワードでうまくいかない場合は SSH鍵方式
`Permission denied` が解決しない場合、パスワードの代わりに **SSH公開鍵認証**に切り替える手もある。
- さくらのコントロールパネル →「サーバー情報」→「SSH公開鍵」で公開鍵を登録
- ワークフローを鍵認証（`ssh_private_key` を使う形）に変更し、秘密鍵を Secret `SAKURA_SSH_KEY` に登録
- この方式ならパスワード不一致の問題を回避できる。

---

## 参考：ワークフローの仕組み
`.github/workflows/deploy.yml` が本体。`main` への push か手動実行（workflow_dispatch）で起動し、
`wlixcc/SFTP-Deploy-Action` を使って `./`（リポジトリ全体、.git等を除く）を
`/home/kzshop/www/mokikaku/` へSFTPアップロードする。
