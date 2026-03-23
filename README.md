# create-discovery-kit

discovery kit プロジェクトを作成する CLI です。

## 前提条件

- Node.js 20+
- git

## 使い方

```bash
npm create discovery-kit
```

または

```bash
npx create-discovery-kit my-project
```

`project-name` には単一ディレクトリ名を指定します。`../my-project` や `nested/my-project` は使えません。

## 例

```bash
npx create-discovery-kit my-project
cd my-project
```

## 実行内容

- 固定された discovery-kit template revision を取得する
- git 履歴を削除する
- `.gitkeep` を削除し、空ディレクトリをそのまま残す

## テンプレート

- リポジトリ: https://github.com/haya-inc/discovery-kit-template
- 固定 ref: `432afb302ba93bd8623dd457fa5b0585c6a3cfd1`

## リリース

- GitHub Release の tag は `package.json` の version と一致している必要があります。`v` プレフィックスは利用できます。
- prerelease は npm の `next` dist-tag で公開され、stable release のみ `latest` に公開されます。
