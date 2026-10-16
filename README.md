# cloudflare-worker-api

APLINEのデータ操作と認証APIを提供するNext.js App Routerプロジェクトです。画面側の `cloudflare-next` から呼び出され、ユーザー、APLINE、下書き、お気に入り、添付ファイル、ノートを扱います。OpenNextでビルドしてCloudflare Workersにデプロイする構成です。

## 技術構成

- Next.js 16 / React 19 / TypeScript
- Supabase Auth（メールアドレス・パスワード認証、Bearerトークン検証）
- Drizzle ORM / Cloudflare D1、R2、Workers KV
- OpenNext / Wrangler

## ローカル開発

Node.js 22（Dockerfileと同じバージョン）とnpmを使用します。以下はこのディレクトリで実行します。

```bash
npm ci
```

`.env.local` に設定を用意します。既存ファイルがある場合は必要な項目のみ追加してください。

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

| 変数 | 用途 |
| --- | --- |
| `SUPABASE_URL` | 接続するSupabaseプロジェクトのURL |
| `SUPABASE_PUBLISHABLE_KEY` | 同プロジェクトのpublishable key |
| `SUPABASE_ANON_KEY` | 旧anon keyを使う場合の代替。publishable keyが優先されます |
| `CLOUDFLARE_ACCOUNT_ID` | D1 HTTPアクセス・Drizzle Kit用のアカウントID |
| `CLOUDFLARE_DATABASE_ID` | 同上のD1データベースID |
| `CLOUDFLARE_D1_TOKEN` | 同上のAPIトークン |
| `CLOUDFLARE_KV_TOKEN` | `lib/utils/kv.ts` にある開発用HTTPプロキシのトークン。現在の `getKV()` はbindingを使います |
| `CLOUDFLARE_ENV` | 一部のダウンロードURL生成処理の分岐に使用 |

```bash
npm run dev -- --port 3001
```

APIのベースURLは `http://localhost:3001/api` です。画面側の `API_URL_BASE` にこの値を設定します。`next.config.mjs` の `initOpenNextCloudflareForDev()` が開発時のCloudflare連携を初期化します。

ローカルD1には必要なテーブルとユーザーを用意してください。ログイン時はSupabaseでパスワードを照合し、確認済みメールがD1の有効なユーザーと一致することを確認します。初期ユーザーを作るseedスクリプトはありません。

## Cloudflare設定

`wrangler.jsonc` のリソース名・IDを対象環境に合わせて設定します。

| binding | 用途 |
| --- | --- |
| `DB` | D1（現在のデータベース名: `vercel-apline`） |
| `VERCEL_APLINE` | R2（`vercel-apline`） |
| `PRIVATE_APLINE` | R2（`private`） |
| `NEXT_INC_CACHE_R2_BUCKET` | R2（`next-inc-cache`）。定義はありますが、OpenNextの増分キャッシュは現在有効化されていません |
| `VERCEL_KV` | API側のユーザー設定・セッショントークン用KV |
| `ASSETS` | OpenNextが生成する静的アセット |

画面側のKV binding名は `CLOUDFLARE_NEXT_KV` で、このAPIの `VERCEL_KV` とは異なります。両プロジェクトのD1・R2設定は現在同じリソース名を参照しますが、ローカル開発時の保存領域は自動共有されません。

環境ファイルやシークレットをコミットしないでください。デプロイ先でも必要な環境変数・シークレットを設定します。

## 主なAPI

パスはすべて `/api` から始まります。認証が必要な処理では、原則として `Authorization: Bearer <accessToken>` を送ります。入力項目・権限チェックの詳細は各 `route.ts` を参照してください。

| メソッド | パス | 処理 |
| --- | --- | --- |
| POST / DELETE | `/internal/token/access` | ログイン・トークン発行 / セッション削除 |
| POST | `/internal/token/refresh` | トークン更新 |
| GET | `/apline/lists` | 一覧・検索 |
| GET / POST | `/apline/create` | 作成用情報取得 / 作成 |
| GET | `/apline/nav`、`/apline/users`、`/apline/stores` | ナビゲーション・ユーザー・店舗情報 |
| GET | `/apline/draft`、`/apline/draft/[id]` | 下書き取得 |
| DELETE | `/apline/draft/[id]` | 下書き削除 |
| GET | `/apline/favorite`、`/apline/favorite/[id]` | お気に入り取得 |
| GET / DELETE / PUT | `/apline/admin/users` | 管理用ユーザー操作 |
| PUT / POST | `/apline/admin/authority` | APLINEユーザー紐付け / 旧パスワード更新は410 |
| GET / POST / PATCH | `/user` | ユーザー情報の取得・作成・更新 |
| POST | `/user/password` | パスワード変更 |
| GET | `/user/otherusers`、`/user/search/[email]` | ユーザー取得・検索 |
| POST | `/user/search` | ユーザー検索 |
| POST / DELETE | `/upload` | ファイルアップロード・削除 |
| GET / POST | `/notes` | ノート一覧・作成 |
| DELETE | `/notes/[id]` | ノート削除 |

API側のNextAuthと独自JWT発行は撤去しました。画面側のNextAuthは画面セッション管理に残し、実際の認証はAPI経由でSupabase Authへ委譲します。

## ビルド・デプロイ

```bash
npm run build
npm start -- --port 3001
```

上記はNode.js上のNext.jsを起動するコマンドです。Workers向けのプレビュー・デプロイはOpenNext CLIを直接使います（このプロジェクトには `preview` / `deploy` npmスクリプトがありません）。Cloudflareへのデプロイには対象アカウントの認証が必要です。

```bash
npx opennextjs-cloudflare build
npx opennextjs-cloudflare preview
```

デプロイする場合は、ビルド後に実行します。

```bash
npx opennextjs-cloudflare deploy
```

## データベース

スキーマは `db/schema/`、既存のSQLは `drizzle/migrations/` にあります。

```bash
npx drizzle-kit generate
```

ローカルD1へ既存の初期SQLを適用する場合:

```bash
npx wrangler d1 execute vercel-apline --local --file=./drizzle/migrations/0000_foamy_dorian_gray.sql
```

初期SQLの適用は空の開発DBで行ってください。実行済みのDBに同じSQLを再投入すると失敗する場合があります。

`drizzle.config.ts` は `.env` またはシェル環境の `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_DATABASE_ID`、`CLOUDFLARE_D1_TOKEN` を使います。`npx drizzle-kit migrate` はその設定先のリモートD1に適用するため、実行前に接続先と生成SQLを確認してください。

## ディレクトリ・検証

```text
app/api/            Route Handlers
src/service/        業務処理・データ操作
lib/                認証、JWT、D1・KV・R2の共通処理
db/schema/          Drizzleスキーマ
drizzle/migrations/ マイグレーションSQL
types/              ユーザー・環境などの型
test/               Workers向けテストの雛形
```

`npm run test:auth` で認証APIをテストします。実SDKを使い、SupabaseのHTTP応答とD1/KVをモックします。実際の接続は環境設定後に確認してください。lint用スクリプトはありません。旧 `test/index.spec.ts` は存在しない `src/index` を参照する雛形のため、専用の `vitest.auth.config.mts` で除外しています。

親の `compose.yaml` で両アプリを起動できます。外部ネットワーク `docker_vercel_network` を事前に用意し、親ディレクトリで `docker compose up --build` を実行します。APIは http://localhost:3001/api 、画面は http://localhost:3000 で公開します（ホストのループバック限定）。

ソースは `/app` にマウントし、依存関係・Next.jsキャッシュは専用ボリュームを使います。起動時に依存関係・キャッシュ用ボリュームの所有権を `node` に補正し、`node` ユーザーで `npm ci` と開発サーバーを実行します。画面側からのAPI接続先は `http://cloudflare-worker-api:3001/api` です。各プロジェクトの `.env.local` に認証などの設定を用意してください。

画面側の説明は [cloudflare-nextのREADME](../cloudflare-next/README.md) を参照してください。

## Supabase Authへの移行

1. `.env.example` を参考にAPIの `.env.local` にURLとpublishable keyを設定します。Workers環境にも設定してください。service-role keyは不要です。
2. Supabase Authでユーザーを作成・招待し、メール確認を完了します。D1の `user.email` と同じメールを登録してください（現在は完全一致）。
3. D1ユーザーの `is_active = true`、`deleted_at IS NULL` を確認します。Supabaseだけのユーザーから業務データは自動作成しません。
4. 画面側からログアウトし、Supabase側のパスワードでログインし直します。旧JWT・旧リフレッシュトークンは使用できません。

D1のパスワードハッシュはSupabaseへ自動移行しません。Supabaseで招待・パスワード再設定を実施してください。`password_hash` 列は互換性のため残しますが、API認証では参照・更新しません。業務スキーマの変更は不要です。

ユーザー作成APIはD1の業務ユーザーを登録します。Supabaseへの作成・招待は別途行います。D1で削除・無効化するとAPIアクセスを拒否しますが、Supabaseの認証アカウントは自動削除しません。

`POST /user/password` は現在のパスワードをSupabaseで再確認して変更します。旧 `POST /apline/admin/authority` のハッシュ書き込みは410を返します。画面側の旧「パスワードを忘れた」フォームは管理者への問い合わせを案内し、旧管理者パスワード再設定も廃止しています。セルフサービスのリカバリー画面を使うにはSupabase対応が必要です。移行後の再設定はSupabase Authの管理・リカバリー機能で実施してください。

毎回Supabaseの `getUser(accessToken)` で検証し、D1から業務IDと権限を取得します。JWTの `role=authenticated` やユーザー編集可能なmetadataは業務権限に使いません。メール一致で紐付けるため、確認済みメールの変更・再利用は管理してください。恒久的な紐付けが必要になった場合はSupabaseユーザーID対応表への移行を検討します。

## 他のCloudflare Workerからの利用

ユーザーとしてログインする呼び出し例です。Worker自体のサービス認証とは異なります。

```ts
const response = await fetch(`${env.API_URL_BASE}/internal/token/access`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!response.ok) throw new Error(`Login failed: ${response.status}`);
const { tokens } = await response.json() as {
  tokens: { accessToken: string; refreshToken: string; accessTokenExpiry: number; refreshTokenExpiry: number };
};
const result = await fetch(`${env.API_URL_BASE}/user`, {
  headers: { Authorization: `Bearer ${tokens.accessToken}` },
});
```

`POST /internal/token/refresh` へ `{ "refreshToken": "..." }` を送ると、新しいトークン2種と各期限（Unixミリ秒）が返ります。期限切れ後にも更新できるよう、このAPIにBearer認証は不要です。リフレッシュトークンはローテーションするので、返却値をセットで保存し、同一セッションの並行更新はクライアント側で直列化してください。

アクセストークン期限はSupabaseの返却値を使います。`refreshTokenExpiry` はクライアント用の7日間のアイドル期限で、Supabase側の期限・失効設定も適用されます。API側KVには認証トークンを保存しません。各クライアントがセッションごとに安全に保管します。既存画面側はユーザー単位のKV管理なので、複数端末では最後のログイン情報を共有する制限が残ります。

`DELETE /internal/token/access` にBearerトークンを付けると、そのSupabaseセッションのリフレッシュトークンを失効させます。クライアント側も保存済みトークンを破棄してください。発行済みアクセストークンは期限まで残るため、即時失効が必要なら別途セッション失効チェックが必要です。

パスワード・トークンはログへ出さないでください。Worker間のfetchにブラウザのCORS設定は不要です。
