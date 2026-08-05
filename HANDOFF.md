# 有限会社エムオー企画 Webサイト 引き継ぎ書

最終更新: 2026-08-05

このドキュメントは、エムオー企画のWebサイト制作・運用を**別のセッション／別の担当者**が引き継ぐための総合ガイドです。これ1つで現状把握と作業再開ができるようにまとめています。

---

## 0. まず最初に（別セッションでの再開手順）

Claude Code などで再開する場合は、次のように伝えてください：

> 「kajiyaan/mokikaku のサイトを引き継ぎたい。リポジトリの HANDOFF.md と DEPLOY_SETUP.md を読んで状況を把握して。」

作業環境の準備（ローカルにクローンする場合）：
```bash
git clone https://github.com/kajiyaan/mokikaku.git
cd mokikaku
git checkout claude/dazzling-edison-1FwJ1   # 開発用ブランチ
```

---

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| 会社 | 有限会社エムオー企画 |
| 事業 | 障がい者の就職支援・就業場所の提供（企業の障がい者雇用現場の運営・管理を受託） |
| サイト種別 | 静的HTMLサイト（フレームワークなし・HTML/CSS/JSのみ） |
| デザイン方針 | 温かみ・親しみやすさ。https://start-line.jp/ を参考にした小規模サイト |
| 本番URL | https://mokikaku.jp/ |
| 確認用URL | https://kajiyaan.github.io/mokikaku/ （GitHub Pages） |
| GitHubリポジトリ | https://github.com/kajiyaan/mokikaku |

### 事業内容の要点（原稿を書く際の前提）
- エムオー企画は **運営・管理を担う**。企業が法的な雇用主で、エムオー企画は現場運営・施設提供・業務指導・日常管理・月次報告を代行する。
- **営業やコンサルは別会社が担当**。エムオー企画はあくまで運営。
- エントリーは **企業向け** と **障がい者向け** の2種類を用意している。

---

## 2. リポジトリ構成

```
mokikaku/
├── index.html            … トップページ
├── service-company.html  … 企業様向けサービス
├── service-worker.html   … 障がいをお持ちの方へのサービス
├── flow.html             … ご利用の流れ（企業/障がい者の縦型ステップ）
├── faq.html              … よくある質問
├── entry.html            … エントリーフォーム（企業/障がい者タブ切替）
├── company.html          … 会社概要＋お問い合わせ
├── css/
│   └── style.css         … 全ページ共通スタイル（BEM設計・CSS変数）
├── js/
│   └── main.js           … ハンバーガーメニュー・タブ切替・FAQアコーディオン・フェードイン等
├── .github/workflows/
│   └── deploy.yml         … さくらへの自動デプロイ設定（GitHub Actions）
├── HANDOFF.md            … この引き継ぎ書
└── DEPLOY_SETUP.md       … デプロイ設定の詳細メモ
```

### サイト構成（ナビゲーション）
トップ / 企業様向けサービス / 障がいをお持ちの方へ / ご利用の流れ / よくある質問 / 会社概要 ＋ エントリー（CTAボタン）

### デザインの技術メモ
- CSS変数は `css/style.css` 冒頭の `:root` に定義（色: `--primary`緑 `#2d8f5f` / `--accent`青 `#1a7fc1` など）。
- `.fade-in` … Intersection Observer でスクロール時にふわっと表示。
- タブUI … `.tab-btn[data-tab]` → `.tab-content[id]`（企業/障がい者の切替）。
- FAQ … `.faq__question` クリックでアコーディオン開閉。
- ヘッダーはページごとに現在地を `is-current` クラスで示す。

---

## 3. ブランチ運用（重要）

| ブランチ | 役割 |
|---|---|
| `main` | **本番公開用**。ここに push されると GitHub Pages とさくら自動デプロイの両方が反映される。 |
| `claude/dazzling-edison-1FwJ1` | 開発用ブランチ。まずここにコミットし、確認後に main へ反映してきた。 |

### これまでの運用フロー
1. 開発ブランチ `claude/dazzling-edison-1FwJ1` を編集・コミット
2. `git push origin claude/dazzling-edison-1FwJ1`
3. `git push origin claude/dazzling-edison-1FwJ1:main --force` で main へ反映
4. main への push で自動デプロイが走り、本番反映

> 注意: main は開発ブランチから force push で更新してきた経緯がある。引き継ぎ後もこの運用を続けるか、通常のPRマージ運用に切り替えるかは任意。

---

## 4. 自動デプロイの仕組み（GitHub → さくら）

`main` に push されると、GitHub Actions（`.github/workflows/deploy.yml`）が起動し、
**lftp を使って FTPS でさくらのレンタルサーバへ mirror アップロード**する。

```
main に push
   ↓
GitHub Actions 起動
   ↓
lftp が FTPS でさくらへ接続
   ↓
/home/kzshop/www/mokikaku/ に全ファイルを同期（--delete で不要ファイルも削除）
   ↓
https://mokikaku.jp/ に反映
```

- 手動実行も可能: GitHubの「Actions」タブ →「Deploy to Sakura Internet」→「Run workflow」
- 反映まで**1〜3分程度**のタイムラグあり。確認時は `Ctrl + F5`（スーパーリロード）。
- `README.md` `DEPLOY_SETUP.md` `HANDOFF.md` `.git` `.github` はアップロード対象から除外している。

---

## 5. さくらインターネット設定情報

| 項目 | 値 |
|---|---|
| プラン | さくらのレンタルサーバ スタンダード |
| 初期ドメイン | kzshop.sakura.ne.jp |
| コントロールパネル ホスト名 | www437.sakura.ne.jp |
| **FTPサーバー名** | kzshop.sakura.ne.jp |
| FTPユーザー名 | kzshop |
| サーバ上の公開フォルダ | /home/kzshop/www/mokikaku/ |
| 独自ドメイン | mokikaku.jp（さくらに設定済み・Web公開フォルダ = ~/www/mokikaku） |
| SSL | Let's Encrypt（無料）設定済み・HTTPS転送ON |

### GitHub Secrets（GitHub側に登録済み・変更不要）
リポジトリの Settings → Secrets and variables → Actions に以下を登録済み：
- `SAKURA_FTP_SERVER` = kzshop.sakura.ne.jp
- `SAKURA_FTP_USER` = kzshop
- `SAKURA_FTP_PASSWORD` = （さくらのサーバーパスワード）

> パスワードを変更した場合は、この Secret（SAKURA_FTP_PASSWORD）も更新すること。

---

## 6. ハマりどころ（同じ問題を繰り返さないために）

構築時に以下でつまずいた。再発時の参考に。

1. **サーバーパスワードが不明だった**
   → 会員メニュー →「契約中のサービス一覧」→ レンタルサーバ →「サーバーパスワード再発行」で再設定。FFFTPで疎通確認してから Secret に登録した。
   → 「会員パスワード」と「サーバーパスワード」は別物。FTP/SSHで使うのは**サーバーパスワード**。

2. **「国外IPアドレスフィルタ」が最大の原因だった**
   → さくらのこの機能がONだと、海外にある GitHub Actions からのFTP通信がブロックされる（ログインは通るがデータ転送で `max-retries exceeded`）。
   → コントロールパネル →「セキュリティ」→「国外IPアドレスフィルタ」を**無効**にして解決。
   → ⚠️ セキュリティは若干下がる。再度有効化する場合、自動デプロイは動かなくなる（その場合はFFFTP等で手動アップロードに切替）。

3. **接続方式の可否**
   - SFTP（SSH/22番）: このアカウントでは認証拒否（`Login incorrect`）→ 使用不可
   - 平文FTP: データ接続が不安定
   - **FTPS（暗号化FTP/21番）+ lftp: これを採用**（現行の deploy.yml）

---

## 7. サイトの更新方法

### 文言・内容の修正
対象の `.html` を編集 → `main` に反映 → 自動デプロイで本番反映。
Claude Code なら「〇〇を△△に変えて」と伝えれば編集〜本番反映まで実行可能。

### よくある編集ポイント
- 会社概要の仮データ: `company.html`（住所・電話・代表者・資本金・対応エリアなど。**現在は仮の値**）
- 実績数値（50社/200名/10年/90%）: `index.html` の numbers セクション（**仮の値**）
- 電話番号・メール: 各ページに `000-0000-0000` / `info@mo-kikaku.co.jp` の仮値あり
- FAQの追加・修正: `faq.html`

### 表記ルール（適用済み）
- 「障害」「障害者」→ すべて **「障がい」「障がい者」** に統一済み。今後の追記もこれに合わせる。

---

## 8. 現在の状態と今後のTODO

### 完了済み
- ✅ マルチページサイト制作（7ページ）
- ✅ GitHub Pages 公開
- ✅ 独自ドメイン mokikaku.jp 設定
- ✅ GitHub→さくら 自動デプロイ（FTPS/lftp）稼働
- ✅ SSL/HTTPS化（Let's Encrypt）
- ✅ 「障害」→「障がい」表記統一
- ✅ 代表者名を「箕輪」に設定（テスト）
- ✅ エントリーページの「2営業日以内にご連絡」文言を削除

### 今後のTODO（未対応）
- ⬜ **仮データの差し替え**: 会社概要（住所・電話・代表者フルネーム・資本金・対応エリア）、実績数値、電話番号・メールアドレス。正式情報が決まり次第。
- ⬜ エントリーフォームは現在 `action="#"` で**実際には送信されない**（見た目のみ）。実運用するにはメール送信先の設定（フォームメール/外部フォームサービス等）が必要。
- ⬜ フォーム送信後の完了メッセージ（`js/main.js` 内）にも「2営業日以内に…」の文言が残っている。必要なら削除。
- ⬜ プライバシーポリシーのリンク先が未作成（`#` のまま）。

---

## 9. 主要リンク集
- 本番サイト: https://mokikaku.jp/
- GitHub Pages: https://kajiyaan.github.io/mokikaku/
- リポジトリ: https://github.com/kajiyaan/mokikaku
- Actions（デプロイ状況）: https://github.com/kajiyaan/mokikaku/actions
- Secrets設定: https://github.com/kajiyaan/mokikaku/settings/secrets/actions
