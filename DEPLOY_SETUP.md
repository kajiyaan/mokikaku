# さくらインターネット 自動デプロイ セットアップ 引き継ぎメモ

このリポジトリ（`kajiyaan/mokikaku`）を、さくらのレンタルサーバへ **自動アップロード**するための設定状況と残作業をまとめたものです。

---

## 🖥️ 別のマシンで続きを始める方法

1. GitHubからリポジトリをクローン（別マシンで）
   ```bash
   git clone https://github.com/kajiyaan/mokikaku.git
   cd mokikaku
   ```
2. ブランチ構成
   - `main` … 公開用（GitHub Pages / さくらデプロイの対象）
   - `claude/dazzling-edison-1FwJ1` … 開発用ブランチ（最新の作業はこちら）
   - 開発を続ける場合：`git checkout claude/dazzling-edison-1FwJ1`
3. このファイル（`DEPLOY_SETUP.md`）を開けば、下記の「残作業」から再開できる。
4. GitHub Secrets はGitHub上に保存されているので、別マシンでも設定不要（そのまま有効）。
5. Claude Code で続ける場合は「さくらデプロイの続きをやりたい。DEPLOY_SETUP.md を見て」と伝えればOK。

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

## ✅ 完了しました（自動デプロイ稼働中）

`main` への push で、GitHub Actions が FTPS でさくらへ自動アップロードする状態が完成。

### 解決までの経緯（ハマりどころ）
1. **サーバーパスワードが不明だった** → 会員メニュー →「契約中のサービス一覧」→ レンタルサーバ →「サーバーパスワード再発行」で再設定し、FFFTPで疎通確認して確定。
2. **さくらの「国外IPアドレスフィルタ」がONだった** → これが最大の原因。GitHub Actions は海外IPのため、FTPのデータ通信がブロックされていた（ログインは通るがファイル転送で `max-retries exceeded`）。コントロールパネル →「セキュリティ」→「国外IPアドレスフィルタ」を**無効**にして解決。

### 判明した接続可否（メモ）
- SFTP（SSH/22番）: このアカウントでは認証拒否（`Login incorrect`）→ 使用不可。
- FTPS（暗号化FTP/21番）: ✅ 採用。lftp で mirror アップロード。

### 補足：パスワードの種類
- **会員パスワード** … さくら会員メニューへのログイン用。※変更不要。
- **サーバーパスワード** … FTP用。※これを再発行して使用。
- 会員パスワードとサーバーパスワードは別物。

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
