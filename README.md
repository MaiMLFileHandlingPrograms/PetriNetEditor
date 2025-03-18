# PetriNetEditor
## 概要
### 下記機能を持つGUI editor
 - ペトリネット図を作成するGUI機能
 - XML/MaiMLファイルの読み込み、ペトリネット図の表示と編集機能
 - \<pnml\>要素/\<method\>要素の生成とファイル出力機能
### demo
 - ペトリネット図作成のデモ <br/>
    https://github.com/MaiMLFileHandlingPrograms/PetriNetEditor/blob/IMG/PetriNetEditor1.gif
 - ファイル読み込みと編集のデモ <br/>
    https://github.com/MaiMLFileHandlingPrograms/PetriNetEditor/blob/IMG/PetriNetEditor2.gif

## 環境構築
### 1. nodeをインストール
- 公式サイト（ https://nodejs.org/ ）からダウンロード
- ダウンロードしたインストールファイルを実行
  - インストーラーの途中、
    「Automatically install the necessary tools. Note that this will also install Chocolatey.
    The script will pop-up in a new window after installation completes.」にチェックを入れる
### 2. 必要なJSモジュールをインストール
- package.jsonが存在するディレクトリに移動
  ```sh
  > cd flow-editor
  ```
- 関連するモジュールをインストール
  ```sh
  > npm install
  ```

## 開発サーバーを立ち上げ実行
### 1. 開発サーバーを立ち上げる
- package.jsonが存在するディレクトリに移動
  ```sh
  > cd flow-editor
  ```
- scriptを実行
  ```sh
  > npm start
  ```
### 2. WEBブラウザから、http://localhost:3000 にアクセス
