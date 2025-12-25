原則として、日本語で記述してください。

実装方針:
- KDBのdiff.jsonを取得して解析し、科目ごとにDiscordのembedを生成する。
- embedは1メッセージ内に複数含め、typeに応じて色や表示内容を変える（added/modified/removed）。
- removedは赤色で表示する。
- Webhook送信はfetchを使用し、TypeScriptで実装する。
